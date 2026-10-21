import { NextResponse } from "next/server";
import { getCurrentUser, requireEditor } from "@/lib/auth";
import { logMediaUpload } from "@/lib/actions/dashboard";
import {
  validateFileType,
  validateFileSize,
  verifyUploadContent,
  sniffImageDimensions,
  generateStorageKey,
  getPublicUrl,
  getSignedUploadUrl,
} from "@/lib/storage";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      requireEditor(user);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unauthorized";
      if (msg === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const alt = (formData.get("alt") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!validateFileType(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed. Allowed: images (JPEG, PNG, GIF, WebP, AVIF), documents (PDF, DOC, DOCX), videos (MP4, WebM)" },
        { status: 400 }
      );
    }

    // Validate file size
    const sizeValidation = validateFileSize(file.type, file.size);
    if (!sizeValidation.valid) {
      return NextResponse.json({ error: sizeValidation.error }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Content sniffing — the declared type must match magic bytes exactly
    // (an HTML/text file renamed to .jpg is rejected here, not stored).
    const verified = verifyUploadContent(file.type, buffer);
    if (!verified.ok) {
      return NextResponse.json({ error: verified.error }, { status: 400 });
    }
    const effectiveType = verified.effectiveType ?? file.type;

    // Intrinsic image dimensions (best effort; undefined for documents)
    const dims = await sniffImageDimensions(buffer, effectiveType);

    const key = generateStorageKey(file.name);
    const publicUrl = getPublicUrl(key);

    // Upload to R2 (S3-compatible API) if configured, otherwise save locally.
    // In production, require R2 configuration — do not silently persist to
    // ephemeral local disk, which does not survive redeployments.
    const s3Key = process.env.R2_ACCESS_KEY_ID;

    if (process.env.NEXT_PUBLIC_NODE_ENV === "production" && !s3Key) {
      throw new Error(
        "R2 storage is required in production (R2_ACCESS_KEY_ID environment variable missing)."
      );
    }

    if (s3Key) {
      const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
      const config = {
        region: process.env.R2_REGION || "auto",
        endpoint: process.env.R2_ENDPOINT,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
        },
      };

      const client = new S3Client(config);
      await client.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET || "lens-media",
          Key: key,
          Body: buffer,
          ContentType: effectiveType,
        })
      );
    } else {
      // Local storage fallback — development only; does NOT persist across redeployments.
      const { writeFile, mkdir } = await import("fs/promises");
      const { join, dirname } = await import("path");
      const localDir = join(process.cwd(), "public", "uploads");
      await mkdir(localDir, { recursive: true });
      // Write file to a sub-path based on key. NOTE: join() emits backslashes
      // on Windows — use dirname() instead of lastIndexOf("/") to derive the
      // parent directory (otherwise the directory comes out as "").
      const localPath = join(process.cwd(), "public", key);
      const localDirPath = dirname(localPath);
      await mkdir(localDirPath, { recursive: true });
      await writeFile(localPath, buffer);
    }

    // Log to database
    const result = await logMediaUpload(
      key,
      file.name,
      effectiveType,
      file.size,
      publicUrl,
      alt,
      { width: dims.width, height: dims.height }
    );

    return NextResponse.json({
      success: true,
      file: {
        id: result.id,
        url: publicUrl,
        filename: key,
        originalName: file.name,
        mimeType: effectiveType,
        size: file.size,
      },
    });
  } catch (error) {
    console.error("[Upload API Error]", error);
    const errorMessage = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { logMediaUpload } from "@/lib/actions/dashboard";
import {
  validateFileType,
  validateFileSize,
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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const alt = (formData.get("alt") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!validateFileType(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed. Allowed: images (JPEG, PNG, GIF, WebP, AVIF, SVG), documents (PDF, DOC, DOCX)" },
        { status: 400 }
      );
    }

    // Validate file size
    const sizeValidation = validateFileSize(file.type, file.size);
    if (!sizeValidation.valid) {
      return NextResponse.json({ error: sizeValidation.error }, { status: 400 });
    }

    const key = generateStorageKey(file.name);
    const publicUrl = getPublicUrl(key);

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to S3 if configured, otherwise save locally
    const s3Key = process.env.S3_ACCESS_KEY_ID ? key : null;

    if (s3Key) {
      const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
      const config = {
        region: process.env.S3_REGION || "us-east-1",
        endpoint: process.env.S3_ENDPOINT,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
        },
      };

      const client = new S3Client(config);
      await client.send(
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET || "lens-media",
          Key: key,
          Body: buffer,
          ContentType: file.type,
        })
      );
    } else {
      // Local storage fallback
      const { writeFile, mkdir } = await import("fs/promises");
      const { join } = await import("path");
      const localDir = join(process.cwd(), "public", "uploads");
      await mkdir(localDir, { recursive: true });
      // Write file to a sub-path based on key
      const localPath = join(process.cwd(), "public", key);
      const localDirPath = localPath.substring(0, localPath.lastIndexOf("/"));
      await mkdir(localDirPath, { recursive: true });
      await writeFile(localPath, buffer);
    }

    // Log to database
    const result = await logMediaUpload(
      key,
      file.name,
      file.type,
      file.size,
      publicUrl,
      alt
    );

    return NextResponse.json({
      success: true,
      file: {
        id: result.id,
        url: publicUrl,
        filename: key,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
      },
    });
  } catch (error) {
    console.error("[Upload API Error]", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}

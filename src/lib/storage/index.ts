import { db } from "@/lib/db";

export interface StorageConfig {
  bucket: string;
  region: string;
  endpoint?: string;
  accessKeyId: string;
  secretAccessKey: string;
  cdnUrl?: string;
}

function getConfig(): StorageConfig {
  return {
    bucket: process.env.R2_BUCKET || "lens-media",
    region: process.env.R2_REGION || "auto",
    endpoint: process.env.R2_ENDPOINT,
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    cdnUrl: process.env.R2_PUBLIC_URL,
  };
}

// File type validation
// NOTE: SVG is intentionally rejected (inline <script>/event handlers execute
// when served same-origin). Allowed: jpg/jpeg, png, gif, webp, avif + pdf/doc.
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
];

const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// Video: conservative allowlist limited to formats every modern browser can
// play natively via <video> and that have unambiguous magic numbers.
// QuickTime (.mov) files that start with a non-"ftyp" atom (moov/mdat-first)
// are intentionally NOT accepted — their signatures are ambiguous.
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"];

const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES, ...ALLOWED_VIDEO_TYPES];

// Size limits (bytes). The video limit is configurable through the
// MAX_VIDEO_SIZE_MB environment variable (clamped to 1–1024 MB) so operators
// can tune it for their storage backend without a code change.
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_DOCUMENT_SIZE = 50 * 1024 * 1024; // 50MB
const DEFAULT_MAX_VIDEO_SIZE_MB = 100;

export function getMaxVideoSizeBytes(): number {
  const raw = Number(process.env.MAX_VIDEO_SIZE_MB);
  const mb = Number.isFinite(raw) && raw > 0 ? Math.min(Math.max(Math.floor(raw), 1), 1024) : DEFAULT_MAX_VIDEO_SIZE_MB;
  return mb * 1024 * 1024;
}

export function validateFileType(mimeType: string): boolean {
  return ALLOWED_TYPES.includes(mimeType);
}

// ============================================================
// Content sniffing — never trust the browser-declared MIME type.
// A file's declared Content-Type can lie (e.g. an HTML file named
// "image.png"). Verify the first bytes against known magic numbers.
// SVG remains forbidden everywhere as a script-execution vector.
// ============================================================

const MAGIC_SIGNATURES: Array<{ mime: string; test: (b: Buffer) => boolean }> = [
  { mime: "image/jpeg", test: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: "image/png", test: (b) => b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a },
  { mime: "image/gif", test: (b) => b.length >= 6 && b.toString("ascii", 0, 6).startsWith("GIF8") },
  { mime: "image/webp", test: (b) => b.length >= 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP" },
  { mime: "image/avif", test: (b) => b.length >= 12 && b.toString("ascii", 4, 8) === "ftyp" && (b.toString("ascii", 8, 12).startsWith("avif") || b.toString("ascii", 8, 12).startsWith("avis")) },
  { mime: "application/pdf", test: (b) => b.length >= 5 && b.toString("ascii", 0, 5) === "%PDF-" },
  { mime: "application/msword", test: (b) => b.length >= 8 && b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0 },
  { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", test: (b) => b.length >= 4 && b.toString("hex", 0, 4) === "504b" }, // zip/office-open-xml
  // MP4 family: ISO BMFF files carry the "ftyp" box header at offset 4
  // (size field occupies the first 4 bytes). Covers isom/mp42/avc1/dash brands.
  { mime: "video/mp4", test: (b) => b.length >= 12 && b.toString("ascii", 4, 8) === "ftyp" },
  // WebM/Matroska: EBML header 0x1A45DFA3.
  { mime: "video/webm", test: (b) => b.length >= 4 && b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3 },
];

/** Detect the true file type from magic bytes, or null when unknown. */
export function sniffMimeType(buffer: Buffer): string | null {
  for (const sig of MAGIC_SIGNATURES) {
    try {
      if (sig.test(buffer)) return sig.mime;
    } catch {
      // keep scanning
    }
  }
  return null;
}

/**
 * Validate that the declared type is allowed AND consistent with the file's
 * actual bytes. Returns the effective (sniffed) type or an error.
 */
export function verifyUploadContent(
  declaredType: string,
  buffer: Buffer
): { ok: boolean; effectiveType?: string; error?: string } {
  if (!validateFileType(declaredType)) {
    return { ok: false, error: "File type not allowed" };
  }
  const sniffed = sniffMimeType(buffer);
  if (!sniffed) {
    return { ok: false, error: "Unrecognized file content — upload rejected" };
  }
  // Same family check: declared images must sniff as any image, declared
  // documents must sniff as pdf/zip-office (MS Word legacy and open-xml both
  // pass their own sniff), declared videos must sniff as video. Content is
  // never stored when families disagree.
  const declaredImage = ALLOWED_IMAGE_TYPES.includes(declaredType);
  const sniffedImage = ALLOWED_IMAGE_TYPES.includes(sniffed);
  const declaredDoc = ALLOWED_DOCUMENT_TYPES.includes(declaredType);
  const sniffedDoc = ALLOWED_DOCUMENT_TYPES.includes(sniffed);
  const declaredVideo = ALLOWED_VIDEO_TYPES.includes(declaredType);
  const sniffedVideo = ALLOWED_VIDEO_TYPES.includes(sniffed);
  if (declaredImage && !sniffedImage) {
    return { ok: false, error: `Declared ${declaredType} but file content is ${sniffed}` };
  }
  if (declaredDoc && !sniffedDoc) {
    return { ok: false, error: `Declared ${declaredType} but file content is ${sniffed}` };
  }
  if (declaredVideo && !sniffedVideo) {
    return { ok: false, error: `Declared ${declaredType} but file content is ${sniffed}` };
  }
  return { ok: true, effectiveType: declaredType };
}

/**
 * Best-effort intrinsic image dimensions (PNG/JPEG/GIF/WebP).
 * Never fails: unknown formats return undefined dimensions.
 */
export async function sniffImageDimensions(
  buffer: Buffer,
  mime: string
): Promise<{ width?: number; height?: number }> {
  try {
    const readU16BE = (b: Buffer, o: number) => (b[o] << 8) | b[o + 1];
    const readU32LE = (b: Buffer, o: number) => b.readUInt32LE(o);

    if (mime === "image/png" && buffer.length >= 24 && buffer[12] === 0x49 && buffer[13] === 0x48 && buffer[14] === 0x44 && buffer[15] === 0x52) {
      return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
    }
    if (mime === "image/gif" && buffer.length >= 10) {
      return { width: readU16BE(buffer, 6), height: readU16BE(buffer, 8) };
    }
    if (mime === "image/jpeg") {
      // Walk APP0/SOF segments to find the frame header (0xFFC0/0xFFC2).
      let offset = 2;
      while (offset + 9 < buffer.length) {
        if (buffer[offset] !== 0xff) { offset++; continue; }
        const marker = buffer[offset + 1];
        if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
          return { height: readU16BE(buffer, offset + 5), width: readU16BE(buffer, offset + 7) };
        }
        const segLen = readU16BE(buffer, offset + 2);
        if (segLen <= 0) break;
        offset += 2 + segLen;
      }
      return {};
    }
    if (mime === "image/webp" && buffer.length >= 30) {
      const chunk = buffer.toString("ascii", 12, 16);
      if (chunk === "VP8X" && buffer.length >= 30) {
        return { width: 1 + readU32LE(buffer, 24) & 0xffffff, height: 1 + readU32LE(buffer, 27) & 0xffffff };
      }
      if (chunk === "VP8 " && buffer.length >= 30 && buffer[23] === 0x9d && buffer[24] === 0x01 && buffer[25] === 0x2a) {
        return { width: readU16BE(buffer, 26) & 0x3fff, height: readU16BE(buffer, 28) & 0x3fff };
      }
      if (chunk === "VP8L" && buffer.length >= 25) {
        const b = buffer[21] | (buffer[22] << 8) | (buffer[23] << 16);
        return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 };
      }
      return {};
    }
    return {};
  } catch {
    return {};
  }
}

export function validateFileSize(mimeType: string, size: number): { valid: boolean; error?: string } {
  if (ALLOWED_IMAGE_TYPES.includes(mimeType)) {
    if (size > MAX_IMAGE_SIZE) {
      return { valid: false, error: `Image size must be less than ${MAX_IMAGE_SIZE / 1024 / 1024}MB` };
    }
  } else if (ALLOWED_DOCUMENT_TYPES.includes(mimeType)) {
    if (size > MAX_DOCUMENT_SIZE) {
      return { valid: false, error: `Document size must be less than ${MAX_DOCUMENT_SIZE / 1024 / 1024}MB` };
    }
  } else if (ALLOWED_VIDEO_TYPES.includes(mimeType)) {
    const maxVideo = getMaxVideoSizeBytes();
    if (size > maxVideo) {
      return { valid: false, error: `Video size must be less than ${Math.floor(maxVideo / 1024 / 1024)}MB` };
    }
  } else {
    return { valid: false, error: "File type not allowed" };
  }
  return { valid: true };
}

export function generateStorageKey(originalName: string): string {
  const ext = originalName.split(".").pop() || "";
  const date = new Date();
  const datePath = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}`;
  const randomId = crypto.randomUUID().slice(0, 8);
  const safeName = originalName
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 100);
  return `uploads/${datePath}/${randomId}_${safeName}`;
}

export function getPublicUrl(key: string): string {
  const config = getConfig();
  if (config.cdnUrl) {
    return `${config.cdnUrl}/${key}`;
  }
  if (config.endpoint) {
    return `${config.endpoint}/${config.bucket}/${key}`;
  }
  return `/${key}`;
}

export async function deleteFromStorage(key: string): Promise<void> {
  // For local storage, this would delete the file
  // For R2 (S3-compatible), this would call DeleteObjectCommand
  // Implementation depends on storage backend
  console.log(`[Storage] Would delete: ${key}`);
}

export async function getSignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string> {
  // For R2 (S3-compatible), generate presigned PUT URL
  const config = getConfig();

  if (!config.accessKeyId) {
    // In production, fail clearly if R2 is not configured rather than silently
    // falling back to ephemeral local storage. In development, allow the
    // local fallback so the UI remains functional without credentials.
    if (process.env.NEXT_PUBLIC_NODE_ENV === "production") {
      throw new Error(
        "R2 storage is not configured (R2_ACCESS_KEY_ID missing) and is required in production."
      );
    }
    // Local storage fallback for development
    return `/api/upload?key=${encodeURIComponent(key)}`;
  }

  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

  // Cloudflare R2 is S3-compatible; the SDK works with the R2 endpoint.
  const client = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(client, command, { expiresIn });
}

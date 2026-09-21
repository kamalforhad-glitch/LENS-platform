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
    bucket: process.env.S3_BUCKET || "lens-media",
    region: process.env.S3_REGION || "us-east-1",
    endpoint: process.env.S3_ENDPOINT,
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
    cdnUrl: process.env.CDN_URL,
  };
}

// File type validation
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
  "image/svg+xml",
];

const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];

// Size limits (bytes)
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_DOCUMENT_SIZE = 50 * 1024 * 1024; // 50MB

export function validateFileType(mimeType: string): boolean {
  return ALLOWED_TYPES.includes(mimeType);
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
  return `/api/media/${key}`;
}

export async function deleteFromStorage(key: string): Promise<void> {
  // For local storage, this would delete the file
  // For S3, this would call DeleteObjectCommand
  // Implementation depends on storage backend
  console.log(`[Storage] Would delete: ${key}`);
}

export async function getSignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string> {
  // For S3, generate presigned PUT URL
  const config = getConfig();

  if (!config.accessKeyId) {
    // Local storage fallback
    return `/api/upload?key=${encodeURIComponent(key)}`;
  }

  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

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

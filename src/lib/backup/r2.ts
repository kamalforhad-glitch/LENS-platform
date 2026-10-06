// ============================================================
// Cloudflare R2 backup artifact persistence.
//
// R2 exposes an S3-compatible API, so the already-installed
// `@aws-sdk/client-s3` is reused as the transport. All product
// configuration, environment variables, and documentation here are
// Cloudflare R2 — no AWS infrastructure is involved.
//
// Env (all R2-specific, never hardcoded, never logged):
//   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
//   R2_BUCKET, R2_ENDPOINT (optional), R2_PUBLIC_URL (optional)
// ============================================================
import { basename } from "path";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  endpoint: string;
  publicUrl?: string;
}

// Structural client type so unit tests can inject a mock without credentials.
export interface R2ClientLike {
  send(command: unknown): Promise<unknown>;
}

/** Returns null when R2 is entirely unconfigured (local-only mode). */
export function getR2Config(): R2Config | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;

  if (!accountId && !accessKeyId && !secretAccessKey && !bucket && !process.env.R2_ENDPOINT) {
    return null;
  }

  // Fail closed on partial configuration — variable NAMES only, never values.
  const missing: string[] = [];
  if (!accountId) missing.push("R2_ACCOUNT_ID");
  if (!accessKeyId) missing.push("R2_ACCESS_KEY_ID");
  if (!secretAccessKey) missing.push("R2_SECRET_ACCESS_KEY");
  if (!bucket) missing.push("R2_BUCKET");
  if (missing.length > 0) {
    throw new Error(`Cloudflare R2 misconfigured, missing: ${missing.join(", ")}`);
  }

  // Cloudflare account endpoint convention; explicit R2_ENDPOINT wins.
  const endpoint =
    process.env.R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`;

  return {
    accountId: accountId!,
    accessKeyId: accessKeyId!,
    secretAccessKey: secretAccessKey!,
    bucket: bucket!,
    endpoint,
    publicUrl: process.env.R2_PUBLIC_URL,
  };
}

/** Deterministic, traversal-safe object key for a generated backup filename. */
export function r2ObjectKey(filename: string): string {
  return `backups/${basename(filename)}`;
}

/** Public URL for an object key, or null when no public URL is configured. */
export function r2PublicUrl(config: R2Config, key: string): string | null {
  if (!config.publicUrl) return null;
  return `${config.publicUrl.replace(/\/+$/, "")}/${key}`;
}

export function createR2Client(
  config: R2Config,
  S3ClientImpl: new (opts: unknown) => R2ClientLike = S3Client as unknown as new (
    opts: unknown
  ) => R2ClientLike
): R2ClientLike {
  return new S3ClientImpl({
    region: "auto",
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

/** Uploads backup bytes. Throws R2UploadError on failure — never reports success. */
export class R2UploadError extends Error {
  readonly key: string;
  constructor(key: string, cause?: unknown) {
    // Bucket/key are non-secret identifiers safe for logs; cause message only.
    const detail = cause instanceof Error ? `: ${cause.message}` : "";
    super(`Cloudflare R2 upload failed for key "${key}"${detail}`);
    this.name = "R2UploadError";
    this.key = key;
  }
}

export async function uploadToR2(
  client: R2ClientLike,
  bucket: string,
  key: string,
  body: Buffer,
  contentType = "application/sql"
): Promise<void> {
  try {
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }));
  } catch (error) {
    throw new R2UploadError(key, error);
  }
}

export async function downloadFromR2(
  client: R2ClientLike,
  bucket: string,
  key: string
): Promise<Buffer> {
  const result = (await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }))) as {
    Body?: { transformToByteArray?: () => Promise<Uint8Array> } | AsyncIterable<Uint8Array>;
  };
  const body = result.Body;
  if (!body) throw new Error(`Cloudflare R2 object not found for key "${key}"`);
  if (typeof (body as { transformToByteArray?: unknown }).transformToByteArray === "function") {
    const bytes = await (body as { transformToByteArray: () => Promise<Uint8Array> }).transformToByteArray();
    return Buffer.from(bytes);
  }
  const chunks: Uint8Array[] = [];
  for await (const chunk of body as AsyncIterable<Uint8Array>) chunks.push(chunk);
  return Buffer.concat(chunks);
}

export async function deleteFromR2(
  client: R2ClientLike,
  bucket: string,
  key: string
): Promise<void> {
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

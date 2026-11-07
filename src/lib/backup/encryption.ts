// ============================================================
// Backup encryption — AES-256-GCM authenticated encryption.
//
// Format (version 1, binary):
//
//   [4 bytes]  magic   = "LBK1"  (version identifier)
//   [12 bytes] nonce   = random IV for GCM
//   [16 bytes] authTag = GCM authentication tag
//   [N bytes]  ciphertext = AES-256-GCM encrypted gzip-compressed SQL
//
// The encryption key is BASE64-encoded and must decode to exactly
// 32 bytes (AES-256). The key is never stored in the database,
// never logged, and never included in the backup artifact.
//
// Uses Node.js `crypto` only — server-side, never exposed to the
// browser or client components.
// ============================================================

import { createCipheriv, createDecipheriv, randomBytes, timingSafeEqual } from "crypto";
import { gzipSync, gunzipSync } from "zlib";

const FORMAT_VERSION = 1;
const MAGIC = Buffer.from("LBK1");
const NONCE_LENGTH = 12; // GCM recommended nonce size
const AUTH_TAG_LENGTH = 16; // GCM tag size
const KEY_LENGTH_BYTES = 32; // AES-256

/**
 * Parses and validates the BACKUP_ENCRYPTION_KEY environment variable.
 * Returns the raw 32-byte key Buffer, or null if unset (development only).
 * Throws in production if the key is missing or invalid.
 */
export function loadEncryptionKey(isProduction: boolean): Buffer | null {
  const raw = process.env.BACKUP_ENCRYPTION_KEY;
  if (!raw) {
    if (isProduction) {
      throw new Error("BACKUP_ENCRYPTION_KEY is required in production");
    }
    return null;
  }

  let key: Buffer;
  try {
    key = Buffer.from(raw, "base64");
  } catch {
    throw new Error("BACKUP_ENCRYPTION_KEY must be valid Base64");
  }

  if (key.length !== KEY_LENGTH_BYTES) {
    throw new Error(
      `BACKUP_ENCRYPTION_KEY must decode to exactly ${KEY_LENGTH_BYTES} bytes (AES-256), got ${key.length}`
    );
  }

  // Reject development-only placeholder keys in production.
  if (isProduction && raw.startsWith("dev-")) {
    throw new Error("BACKUP_ENCRYPTION_KEY development value must not be used in production");
  }

  return key;
}

/**
 * Encryption result: versioned, authenticated, encrypted backup artifact.
 */
export interface EncryptedBackup {
  version: number;
  data: Buffer; // complete binary artifact: magic + nonce + tag + ciphertext
}

/**
 * Compresses and encrypts a SQL backup using AES-256-GCM.
 * Throws if encryption or authentication tag generation fails.
 */
export function encryptBackup(plaintext: Buffer, key: Buffer): EncryptedBackup {
  // Compress first (gzip), then encrypt.
  const compressed = gzipSync(plaintext);

  const nonce = randomBytes(NONCE_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", key, nonce);

  const ciphertext = Buffer.concat([
    cipher.update(compressed),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // Assemble: magic + nonce + authTag + ciphertext
  const data = Buffer.concat([MAGIC, nonce, authTag, ciphertext]);

  return {
    version: FORMAT_VERSION,
    data,
  };
}

/**
 * Decrypts and authenticates an encrypted backup artifact.
 * Verifies the GCM authentication tag before decompression.
 * Throws if the format is unsupported, the tag is invalid (tampered),
 * or decryption fails for any reason.
 */
export function decryptBackup(artifact: Buffer, key: Buffer): Buffer {
  // Validate minimum length: magic + nonce + authTag
  const minLength =
    MAGIC.length + NONCE_LENGTH + AUTH_TAG_LENGTH;
  if (artifact.length < minLength) {
    throw new Error("Unsupported backup format: artifact too short");
  }

  // Validate magic bytes (version identifier).
  const magic = artifact.subarray(0, MAGIC.length);
  if (!magic.equals(MAGIC)) {
    throw new Error("Unsupported backup format: unrecognized magic header");
  }

  // Parse version from magic (currently only "LBK1" = version 1).
  // Future versions would use a different magic.
  const _version = 1;

  const nonce = artifact.subarray(
    MAGIC.length,
    MAGIC.length + NONCE_LENGTH
  );
  const authTag = artifact.subarray(
    MAGIC.length + NONCE_LENGTH,
    MAGIC.length + NONCE_LENGTH + AUTH_TAG_LENGTH
  );
  const ciphertext = artifact.subarray(
    MAGIC.length + NONCE_LENGTH + AUTH_TAG_LENGTH
  );

  try {
    const decipher = createDecipheriv("aes-256-gcm", key, nonce);
    decipher.setAuthTag(authTag);

    const decompressed = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    // Decompress (gunzip) after successful decryption + authentication.
    return gunzipSync(decompressed);
  } catch {
    // GCM tag mismatch = tampered or corrupted ciphertext.
    // Never leak details about the failure beyond a generic rejection.
    throw new Error(
      "Backup decryption failed: authentication tag invalid or artifact corrupted"
    );
  }
}

/**
 * Constant-time comparison for key validation (not used for ciphertext
 * comparison — GCM already provides authentication).
 */
export function keysEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

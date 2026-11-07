// ============================================================
// Scheduled backup encryption helper.
//
// Used by the GitHub Actions "Scheduled database backup" workflow
// to encrypt `pg_dump` output with the same AES-256-GCM LBK1
// format as application backups, before uploading to Cloudflare R2.
//
// This reuses `encryptBackup()` from "@/lib/backup/encryption" so
// the scheduled backup and application backup share exactly one
// encryption implementation and format.
//
// Usage:
//   npx tsx src/lib/backup/scheduled-backup.ts <input.sql> <output.sql.enc>
//
// Environment:
//   BACKUP_ENCRYPTION_KEY — required, Base64-encoded 32-byte key
// ============================================================

import { readFile, unlink, writeFile } from "fs/promises";
import { encryptBackup, loadEncryptionKey } from "@/lib/backup/encryption";

/**
 * Encrypts a plaintext SQL backup file using AES-256-GCM (LBK1 format)
 * and writes the encrypted artifact to outputPath. The plaintext input
 * file is deleted after successful encryption.
 *
 * Throws if the encryption key is missing/invalid or encryption fails.
 * Never returns or logs plaintext, keys, or credentials.
 */
export async function encryptBackupFile(inputPath: string, outputPath: string): Promise<void> {
  // Production-only key validation. The scheduled backup workflow always
  // produces encrypted artifacts, so the key is required.
  const key = loadEncryptionKey(true);
  if (!key) {
    throw new Error("BACKUP_ENCRYPTION_KEY is required for scheduled backup encryption");
  }

  // Read plaintext SQL dump.
  const plaintext = await readFile(inputPath);

  // Compress (gzip) + encrypt with AES-256-GCM, LBK1 format.
  const encrypted = encryptBackup(plaintext, key);

  // Write encrypted artifact.
  await writeFile(outputPath, encrypted.data);

  // Clean up plaintext SQL dump — never leave plaintext on disk.
  await unlink(inputPath).catch(() => {
    // Best-effort; the encrypted artifact is the durable output.
  });
}

async function main(): Promise<void> {
  const inputPath = process.argv[2];
  const outputPath = process.argv[3];

  if (!inputPath || !outputPath) {
    console.error("Usage: tsx scheduled-backup.ts <input.sql> <output.sql.enc>");
    process.exit(1);
  }

  try {
    await encryptBackupFile(inputPath, outputPath);
  } catch (error) {
    // Never print secrets, keys, or database URLs.
    console.error(
      error instanceof Error
        ? `Scheduled backup encryption failed: ${error.message}`
        : "Scheduled backup encryption failed"
    );
    process.exit(1);
  }
}

// Only run when executed directly as a CLI script, not when imported as a module.
if (process.argv[1] && process.argv[1].includes("scheduled-backup")) {
  main();
}

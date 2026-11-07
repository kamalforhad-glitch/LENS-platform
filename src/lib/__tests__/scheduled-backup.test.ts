import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { encryptBackupFile } from "@/lib/backup/scheduled-backup";
import { decryptBackup, loadEncryptionKey } from "@/lib/backup/encryption";
import { readFile, unlink, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

function makeTestKey(): string {
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) bytes[i] = i + 1;
  return Buffer.from(bytes).toString("base64");
}

const TEST_KEY = makeTestKey();
const TEST_PLAINTEXT = Buffer.from(
  "SELECT * FROM users; SELECT * FROM audit_logs; -- scheduled backup content"
);

describe("Scheduled backup encryption helper", () => {
  const key = Buffer.from(TEST_KEY, "base64");

  beforeEach(() => {
    vi.stubEnv("BACKUP_ENCRYPTION_KEY", TEST_KEY);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("encrypts a file and produces an artifact decryptable by decryptBackup", async () => {
    const dir = tmpdir();
    const inputPath = join(dir, `lens-backup-test-${Date.now()}.sql`);
    const outputPath = join(dir, `lens-backup-test-${Date.now()}.sql.enc`);

    await writeFile(inputPath, TEST_PLAINTEXT);

    try {
      await encryptBackupFile(inputPath, outputPath);

      // Input plaintext must be removed.
      let inputExists = false;
      try {
        await readFile(inputPath);
        inputExists = true;
      } catch {
        inputExists = false;
      }
      expect(inputExists).toBe(false);

      // Output encrypted artifact must exist.
      const encrypted = await readFile(outputPath);
      expect(encrypted.length).toBeGreaterThan(0);

      // Must start with LBK1 magic header.
      expect(encrypted.subarray(0, 4).toString("latin1")).toBe("LBK1");

      // Must be decryptable by the application's decryptBackup().
      const decrypted = decryptBackup(encrypted, key);
      expect(decrypted.equals(TEST_PLAINTEXT)).toBe(true);
    } finally {
      await unlink(outputPath).catch(() => {});
    }
  });

  it("throws when BACKUP_ENCRYPTION_KEY is missing", async () => {
    vi.unstubAllEnvs();
    const dir = tmpdir();
    const inputPath = join(dir, `lens-backup-test-${Date.now()}.sql`);
    const outputPath = join(dir, `lens-backup-test-${Date.now()}.sql.enc`);
    await writeFile(inputPath, TEST_PLAINTEXT);
    try {
      await expect(encryptBackupFile(inputPath, outputPath)).rejects.toThrow(
        /required/
      );
    } finally {
      await unlink(inputPath).catch(() => {});
      await unlink(outputPath).catch(() => {});
    }
  });

  it("throws when BACKUP_ENCRYPTION_KEY has invalid length", async () => {
    vi.stubEnv("BACKUP_ENCRYPTION_KEY", Buffer.from("short").toString("base64"));
    const dir = tmpdir();
    const inputPath = join(dir, `lens-backup-test-${Date.now()}.sql`);
    const outputPath = join(dir, `lens-backup-test-${Date.now()}.sql.enc`);
    await writeFile(inputPath, TEST_PLAINTEXT);
    try {
      await expect(encryptBackupFile(inputPath, outputPath)).rejects.toThrow(
        /exactly 32 bytes/
      );
    } finally {
      await unlink(inputPath).catch(() => {});
      await unlink(outputPath).catch(() => {});
    }
  });

  it("loadEncryptionKey validates 32-byte key", () => {
    vi.stubEnv("BACKUP_ENCRYPTION_KEY", TEST_KEY);
    try {
      const k = loadEncryptionKey(true);
      expect(k).toBeInstanceOf(Buffer);
      expect(k!.length).toBe(32);
    } finally {
      vi.unstubAllEnvs();
    }
  });
});

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { join } from "path";
import { writeFile, unlink, mkdir } from "fs/promises";
import { sanitizeBackupError } from "@/lib/backup/index";
import { encryptBackup } from "@/lib/backup/encryption";

// Mock the database module.
vi.mock("@/lib/db", () => ({
  db: {
    backupRecord: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock child_process execFile. execFile is wrapped with promisify() in
// backup/index.ts, so the mock must call the callback (error-first) rather
// than returning a Promise.
type ExecFileCallback = (err: Error | null, stdout: string | Buffer) => void;

vi.mock("child_process", () => ({
  execFile: vi.fn(
    (_file: string, _args: string[], callback: ExecFileCallback) => {
      callback(null, "");
    }
  ),
}));

import { db } from "@/lib/db";
import { execFile } from "child_process";
import { restoreBackup } from "@/lib/backup/index";

function makeTestKey(): string {
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) bytes[i] = i + 1;
  return Buffer.from(bytes).toString("base64");
}

const TEST_KEY = makeTestKey();
const TEST_PLAINTEXT = Buffer.from("SELECT * FROM users; -- test backup");
const BACKUP_DIR = join(process.cwd(), "backups");
const TEST_BACKUP_ID = "restore-test-id-123";

const mockedDb = db.backupRecord as unknown as {
  findUnique: ReturnType<typeof vi.fn>;
};

const mockedExecFile = execFile as unknown as {
  mockImplementation: (
    fn: (_file: string, _args: string[], callback: ExecFileCallback) => void
  ) => void;
};

function mockDbRecord(filename: string): void {
  mockedDb.findUnique.mockResolvedValue({
    id: TEST_BACKUP_ID,
    filename,
    status: "completed",
    storage: "local",
    remoteKey: null,
  });
}

function mockExecFileFail(): void {
  mockedExecFile.mockImplementation(
    (_file: string, _args: string[], callback: ExecFileCallback) => {
      callback(new Error("psql error"), "");
    }
  );
}

describe("sanitizeBackupError", () => {
  it("redacts postgresql connection strings", () => {
    const err = new Error("failed: postgresql://user:pass@host:5432/db");
    const result = sanitizeBackupError(err);
    expect(result).toContain("[REDACTED_CONNECTION_STRING]");
    expect(result).not.toContain("postgresql://");
    expect(result).not.toContain("user:pass");
  });

  it("redacts postgres connection strings", () => {
    const err = new Error("failed: postgres://user:pass@host:5432/db");
    const result = sanitizeBackupError(err);
    expect(result).toContain("[REDACTED_CONNECTION_STRING]");
    expect(result).not.toContain("postgres://");
  });

  it("redacts Supabase pooler hosts", () => {
    const err = new Error("failed: aws-0-ap-northeast-2.pooler.supabase.com");
    const result = sanitizeBackupError(err);
    expect(result).toContain("[REDACTED_HOST]");
    expect(result).not.toContain("pooler.supabase.com");
  });

  it("redacts R2 hosts", () => {
    const err = new Error("failed: account.r2.cloudflarestorage.com");
    const result = sanitizeBackupError(err);
    expect(result).toContain("[REDACTED_HOST]");
    expect(result).not.toContain("r2.cloudflarestorage.com");
  });

  it("redacts AWS access keys", () => {
    const err = new Error("failed with AKIAIOSFODNN7EXAMPLE");
    const result = sanitizeBackupError(err);
    expect(result).toContain("[REDACTED_ACCESS_KEY]");
    expect(result).not.toContain("AKIAIOSFODNN7EXAMPLE");
  });

  it("redacts AWS secret keys", () => {
    const err = new Error("failed with deadbeefdeadbeefdeadbeefdeadbeefdeadbeef");
    const result = sanitizeBackupError(err);
    expect(result).toContain("[REDACTED_SECRET_KEY]");
    expect(result).not.toContain("deadbeefdeadbeefdeadbeefdeadbeefdeadbeef");
  });

  it("redacts nested error causes", () => {
    const cause = new Error("postgresql://user:pass@host:5432/db");
    const err = new Error("outer error", { cause });
    const result = sanitizeBackupError(err);
    expect(result).toContain("[REDACTED_CONNECTION_STRING]");
    expect(result).not.toContain("postgresql://");
  });

  it("returns generic message for unknown errors", () => {
    expect(sanitizeBackupError("something went wrong")).toBe("Operation failed");
    expect(sanitizeBackupError(null)).toBe("Operation failed");
    expect(sanitizeBackupError(undefined)).toBe("Operation failed");
    expect(sanitizeBackupError({})).toBe("Operation failed");
  });

  it("preserves non-sensitive error messages", () => {
    const err = new Error("pg_dump binary not found");
    expect(sanitizeBackupError(err)).toBe("pg_dump binary not found");
  });
});

describe("restoreBackup temporary-file cleanup", () => {
  const key = Buffer.from(TEST_KEY, "base64");

  beforeEach(() => {
    vi.stubEnv("BACKUP_ENCRYPTION_KEY", TEST_KEY);
    vi.stubEnv("DATABASE_URL", "postgresql://test:test@localhost:5432/test");
    // Default execFile mock: callback-based success (for promisify).
    mockedExecFile.mockImplementation(
      (_file: string, _args: string[], callback: ExecFileCallback) => {
        callback(null, "");
      }
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    mockedDb.findUnique.mockReset();
    mockedExecFile.mockImplementation(
      (_file: string, _args: string[], callback: ExecFileCallback) => {
        callback(null, "");
      }
    );
  });

  async function writeEncryptedBackup(filename: string): Promise<string> {
    const realFilePath = join(BACKUP_DIR, filename);
    await mkdir(BACKUP_DIR, { recursive: true });
    const encrypted = encryptBackup(TEST_PLAINTEXT, key);
    await writeFile(realFilePath, encrypted.data);
    return realFilePath;
  }

  async function cleanupTestFiles(filename: string): Promise<void> {
    const realFilePath = join(BACKUP_DIR, filename);
    await unlink(realFilePath).catch(() => {});
    const plaintextPath = join(BACKUP_DIR, `restore-plaintext-${TEST_BACKUP_ID}.sql`);
    await unlink(plaintextPath).catch(() => {});
    const downloadPath = join(BACKUP_DIR, `restore-${TEST_BACKUP_ID}.sql`);
    await unlink(downloadPath).catch(() => {});
  }

  it("cleans up temp files on successful restore", async () => {
    const filename = "lens-backup-success.sql";
    await writeEncryptedBackup(filename);
    mockDbRecord(filename);

    try {
      const result = await restoreBackup(TEST_BACKUP_ID);
      expect(result.success).toBe(true);
    } finally {
      await cleanupTestFiles(filename);
    }
  });

  it("cleans up temp files when psql fails", async () => {
    const filename = "lens-backup-psql-fail.sql";
    await writeEncryptedBackup(filename);
    mockDbRecord(filename);
    mockExecFileFail();

    try {
      const result = await restoreBackup(TEST_BACKUP_ID);
      expect(result.success).toBe(false);
    } finally {
      await cleanupTestFiles(filename);
    }
  });

  it("cleans up temp files when decryption fails", async () => {
    const filename = "lens-backup-decrypt-fail.sql";
    // Write a valid LBK1 header with corrupted ciphertext.
    const encrypted = encryptBackup(TEST_PLAINTEXT, key);
    const corrupted = Buffer.from(encrypted.data);
    corrupted[corrupted.length - 1] ^= 0xff;
    await mkdir(BACKUP_DIR, { recursive: true });
    await writeFile(join(BACKUP_DIR, filename), corrupted);

    mockDbRecord(filename);

    try {
      const result = await restoreBackup(TEST_BACKUP_ID);
      expect(result.success).toBe(false);
      expect(result.error).toContain("authentication tag invalid");
    } finally {
      await cleanupTestFiles(filename);
    }
  });

  it("rejects legacy unencrypted backups in production", async () => {
    vi.stubEnv("NODE_ENV", "production");

    const filename = "lens-backup-legacy.sql";
    const realFilePath = join(BACKUP_DIR, filename);
    await mkdir(BACKUP_DIR, { recursive: true });
    await writeFile(realFilePath, TEST_PLAINTEXT);

    mockDbRecord(filename);

    try {
      const result = await restoreBackup(TEST_BACKUP_ID);
      expect(result.success).toBe(false);
      expect(result.error).toContain("not supported for restore");
    } finally {
      vi.unstubAllEnvs();
      await unlink(realFilePath).catch(() => {});
    }
  });
});

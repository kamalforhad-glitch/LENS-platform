import { db } from "@/lib/db";
import { execFile } from "child_process";
import { promisify } from "util";
import { writeFile, readdir, stat, unlink, readFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join, basename } from "path";
import { sendBackupReport } from "@/lib/email";
import { requireDatabaseUrl, requireBackupBucket, assertBucketsDistinct } from "@/lib/env";
import { sanitizeError } from "@/lib/sanitize-error";
import {
  createR2Client,
  downloadFromR2,
  getR2Config,
  r2ObjectKey,
  uploadToR2,
} from "@/lib/backup/r2";
import { encryptBackup, decryptBackup, loadEncryptionKey } from "@/lib/backup/encryption";

const execFileAsync = promisify(execFile);

const BACKUP_DIR = join(process.cwd(), "backups");
const MAX_BACKUPS = 30; // 30 days retention

/** Resolves postgres client binary taking into account standard local and server installation paths */
function resolvePostgresBinary(binary: string): string {
  if (process.env.PG_BIN_PATH) {
    const custom = join(process.env.PG_BIN_PATH, process.platform === "win32" ? `${binary}.exe` : binary);
    if (existsSync(/*turbopackIgnore: true*/ custom)) return custom;
  }
  if (process.platform === "win32") {
    const candidates = [
      `C:\\Program Files\\PostgreSQL\\18\\bin\\${binary}.exe`,
      `C:\\Program Files\\PostgreSQL\\17\\bin\\${binary}.exe`,
      `C:\\Program Files\\PostgreSQL\\16\\bin\\${binary}.exe`,
      `C:\\Program Files\\PostgreSQL\\15\\bin\\${binary}.exe`,
    ];
    for (const p of candidates) {
      if (existsSync(/*turbopackIgnore: true*/ p)) return p;
    }
  }
  return binary;
}

/** True when the child process failed to spawn because the binary is absent. */
function isMissingBinary(error: unknown): boolean {
  return (
    !!error &&
    typeof error === "object" &&
    (error as NodeJS.ErrnoException).code === "ENOENT"
  );
}

/** Shared, safe guidance for hosts without the PostgreSQL client tools. */
function missingBinaryMessage(binary: string): string {
  return (
    `${binary} is not available on this runtime. Vercel serverless functions ` +
    "cannot run PostgreSQL client tools: scheduled backups run from the " +
    "GitHub Actions `Scheduled database backup` workflow (pg_dump → Cloudflare R2) " +
    "instead. When the backend moves to Render, use a runtime with the " +
    "postgresql-client package there."
  );
}

/**
 * Sanitizes backup error messages before persisting to the database or
 * returning to the admin UI. Delegates to the shared sanitizeError()
 * utility so that backup and upload error handling use one source of
 * truth for secret redaction.
 */
export function sanitizeBackupError(error: unknown): string {
  return sanitizeError(error);
}


export interface BackupResult {
  id: string;
  filename: string;
  size: number;
  status: "completed" | "failed";
  duration: string;
  error?: string;
  /** Where the artifact durably lives: local disk or Cloudflare R2. */
  storage: "local" | "r2";
  /** Backups never have public URLs. Remote URL is intentionally omitted. */
}

export async function createBackup(type: "manual" | "scheduled" = "manual"): Promise<BackupResult> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `lens-backup-${timestamp}.sql`;
  const id = crypto.randomUUID();
  const isProduction = process.env.NODE_ENV === "production";

  // Create backup record
  await db.backupRecord.create({
    data: { id, filename, type, status: "pending" },
  });

  try {
    const databaseUrl = requireDatabaseUrl();

    // Production backup bucket validation — fail closed before pg_dump.
    // requireBackupBucket() throws in production if R2_BACKUP_BUCKET is missing.
    // assertBucketsDistinct() rejects identical media/backup bucket names.
    requireBackupBucket();
    assertBucketsDistinct();

    // Load encryption key — fail closed in production if missing.
    const encryptionKey = loadEncryptionKey(isProduction);

    // Ensure backup directory exists before dumping (pg_dump won't create it).
    await mkdir(BACKUP_DIR, { recursive: true });

    // Plain SQL format matches the .sql extension and the cleanup filter.
    // execFile (no shell) prevents DATABASE_URL shell injection.
    const filePath = join(BACKUP_DIR, basename(filename));
    try {
      await execFileAsync(resolvePostgresBinary("pg_dump"), [
        databaseUrl,
        "--no-owner",
        "--no-acl",
        "--format=plain",
        `--file=${filePath}`,
      ]);
    } catch (error) {
      if (isMissingBinary(error)) {
        // Clear, actionable failure signal (recorded in BackupRecord + email
        // report) instead of a bare ENOENT — no secret values are included.
        throw new Error(missingBinaryMessage("pg_dump"));
      }
      throw error;
    }
    const fileStat = await stat(filePath);
    const plaintext = await readFile(filePath);

    // Cloudflare R2 persistence.
    // getR2Config() throws on partial configuration — caught below as failure.
    const r2 = getR2Config();
    let storage: "local" | "r2" = "local";
    let remoteKey: string | null = null;

    if (r2) {
      // Encrypt before upload — never store plaintext SQL in R2.
      // Encryption key is required whenever R2 backup storage is configured.
      if (!encryptionKey) {
        throw new Error(
          "BACKUP_ENCRYPTION_KEY is required when R2 backup storage is configured"
        );
      }
      const encrypted = encryptBackup(plaintext, encryptionKey);
      const key = r2ObjectKey(filename);
      // Throws R2UploadError on failure → backup is marked failed, never
      // reported as a successful persistent backup. No silent local fallback.
      await uploadToR2(createR2Client(r2), r2.bucket, key, encrypted.data);
      remoteKey = key;
      storage = "r2";

      // Safe local cleanup: encrypted artifact now durable in R2. A cleanup
      // failure must not fail the backup — retention sweep removes stragglers later.
      await unlink(filePath).catch((e) => {
        console.warn(`[Backup] R2 upload ok but local cleanup failed for ${filename}`, e);
      });
    } else if (isProduction) {
      // In production, R2 backup storage is required. Do not silently fall
      // back to ephemeral local disk, which does not survive redeployments.
      throw new Error(
        "R2 backup storage is required in production (R2_BACKUP_BUCKET not configured)."
      );
    }

    await db.backupRecord.update({
      where: { id },
      data: {
        status: "completed",
        size: fileStat.size,
        storage,
        remoteKey,
      },
    });

    // Clean old backups
    await cleanOldBackups();

    const duration = `${((Date.now() - startTime) / 1000).toFixed(1)}s`;
    const sizeMB = (fileStat.size / 1024 / 1024).toFixed(2);

    // Send email report
    await sendBackupReport({
      status: "completed",
      filename,
      size: `${sizeMB} MB`,
      duration,
    });

    return { id, filename, size: fileStat.size, status: "completed", duration, storage };
  } catch (error) {
    // Sanitize error messages — never expose connection strings, credentials,
    // host details, or raw subprocess output to the caller or admin UI.
    const errorMsg = sanitizeBackupError(error);

    await db.backupRecord.update({
      where: { id },
      data: { status: "failed", error: errorMsg },
    });

    const duration = `${((Date.now() - startTime) / 1000).toFixed(1)}s`;

    await sendBackupReport({
      status: "failed",
      filename,
      size: "0 MB",
      duration,
    });

    // Failed backups are never reported as persistent: storage stays "local"
    // (a partial local file may remain for diagnosis; nothing is in R2).
    return { id, filename, size: 0, status: "failed", duration, error: errorMsg, storage: "local" };
  }
}

export async function restoreBackup(backupId: string): Promise<{ success: boolean; error?: string }> {
  const record = await db.backupRecord.findUnique({ where: { id: backupId } });
  if (!record) return { success: false, error: "Backup record not found" };
  if (record.status !== "completed") return { success: false, error: "Backup is not completed" };

  const isProduction = process.env.NODE_ENV === "production";

  // basename() prevents directory traversal if the DB record was tampered with.
  const filePath = join(BACKUP_DIR, basename(record.filename));
  let downloadTempPath: string | null = null;   // R2 download target (encrypted artifact)
  let plaintextTempPath: string | null = null;  // Decrypted SQL for psql (never the original file)

  try {
    // Load encryption key — required to decrypt encrypted backups.
    const encryptionKey = loadEncryptionKey(isProduction);

    // Determine the source of the backup artifact.
    let sourcePath: string;

    if (record.storage === "r2") {
      const r2 = getR2Config();
      if (!r2) throw new Error("Backup is stored in Cloudflare R2 but R2 is not configured");
      const key = record.remoteKey || r2ObjectKey(record.filename);
      downloadTempPath = join(BACKUP_DIR, `restore-${record.id}.sql`);
      await mkdir(BACKUP_DIR, { recursive: true });
      const data = await downloadFromR2(createR2Client(r2), r2.bucket, key);
      await writeFile(downloadTempPath, data);
      sourcePath = downloadTempPath;
    } else {
      sourcePath = filePath;
    }

    // Read the artifact and detect format.
    const data = await readFile(sourcePath);

    if (data.length >= 4 && data.subarray(0, 4).toString("latin1") === "LBK1") {
      if (!encryptionKey) {
        throw new Error("Backup is encrypted but BACKUP_ENCRYPTION_KEY is not configured");
      }
      const decrypted = decryptBackup(data, encryptionKey);
      // Write decrypted SQL to a separate unpredictable temp file.
      // Never overwrite the original encrypted backup file.
      plaintextTempPath = join(BACKUP_DIR, `restore-plaintext-${record.id}.sql`);
      await writeFile(plaintextTempPath, decrypted);
    } else {
      // Legacy unencrypted backup — reject in production.
      if (isProduction) {
        throw new Error("Legacy unencrypted backups are not supported for restore");
      }
      // In development, write legacy plaintext to a temp file for psql.
      plaintextTempPath = join(BACKUP_DIR, `restore-plaintext-${record.id}.sql`);
      await writeFile(plaintextTempPath, data);
    }

    const databaseUrl = requireDatabaseUrl();

    // psql restores from the temp plaintext file (never the original encrypted artifact).
    const psqlFilePath = plaintextTempPath ?? sourcePath;

    // Plain-format dumps restore with psql (no shell — args array only).
    try {
      await execFileAsync(resolvePostgresBinary("psql"), [
        databaseUrl,
        "--quiet",
        "--file",
        psqlFilePath,
      ]);
    } catch (error) {
      if (isMissingBinary(error)) {
        return { success: false, error: missingBinaryMessage("psql") };
      }
      throw error;
    }
    return { success: true };
  } catch (error) {
    const errorMsg = sanitizeBackupError(error);
    return { success: false, error: errorMsg };
  } finally {
    // Clean up all temporary files — success or failure.
    // The original encrypted backup file (filePath) is never touched.
    if (downloadTempPath) await unlink(downloadTempPath).catch(() => {});
    if (plaintextTempPath) await unlink(plaintextTempPath).catch(() => {});
  }
}

export async function listBackups(limit: number = 50) {
  return db.backupRecord.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getBackupStats() {
  const [total, completed, failed, latest] = await Promise.all([
    db.backupRecord.count(),
    db.backupRecord.count({ where: { status: "completed" } }),
    db.backupRecord.count({ where: { status: "failed" } }),
    db.backupRecord.findFirst({
      where: { status: "completed" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return { total, completed, failed, latest };
}

async function cleanOldBackups() {
  try {
    // Ensure backup directory exists
    const { mkdir } = await import("fs/promises");
    await mkdir(BACKUP_DIR, { recursive: true });

    const files = await readdir(BACKUP_DIR);
    const backupFiles = files
      .filter((f) => f.startsWith("lens-backup-") && f.endsWith(".sql"))
      .sort()
      .reverse();

    // Keep only MAX_BACKUPS files
    if (backupFiles.length > MAX_BACKUPS) {
      const toDelete = backupFiles.slice(MAX_BACKUPS);
      for (const file of toDelete) {
        await unlink(join(BACKUP_DIR, file)).catch(() => {});
      }
    }

    // Also clean backup records
    const records = await db.backupRecord.findMany({
      orderBy: { createdAt: "desc" },
      skip: MAX_BACKUPS,
    });

    if (records.length > 0) {
      await db.backupRecord.deleteMany({
        where: { id: { in: records.map((r) => r.id) } },
      });
    }
  } catch (error) {
    console.error("[Backup Cleanup Error]", sanitizeBackupError(error));
  }
}

export async function downloadBackup(backupId: string): Promise<{ data?: Buffer; filename?: string; error?: string }> {
  const record = await db.backupRecord.findUnique({ where: { id: backupId } });
  if (!record) return { error: "Backup not found" };
  if (record.status !== "completed") return { error: "Backup not completed" };

  const isProduction = process.env.NODE_ENV === "production";

  // Load encryption key — required to decrypt encrypted backups.
  const encryptionKey = loadEncryptionKey(isProduction);

  const filePath = join(BACKUP_DIR, basename(record.filename));
  try {
    const data = await readFile(filePath);
    const decrypted = maybeDecrypt(data, encryptionKey, isProduction);
    return { data: decrypted, filename: basename(record.filename) };
  } catch {
    // Fall through to R2 for r2-persisted artifacts (local file cleaned up).
  }

  if (record.storage === "r2") {
    try {
      const r2 = getR2Config();
      if (!r2) return { error: "Backup is stored in Cloudflare R2 but R2 is not configured" };
      const key = record.remoteKey || r2ObjectKey(record.filename);
      const data = await downloadFromR2(createR2Client(r2), r2.bucket, key);
      const decrypted = maybeDecrypt(data, encryptionKey, isProduction);
      return { data: decrypted, filename: basename(record.filename) };
    } catch {
      return { error: "Backup file not found in Cloudflare R2" };
    }
  }

  return { error: "Backup file not found on disk" };
}

/**
 * Detects the LBK1 encrypted format and decrypts if present.
 * Legacy unencrypted backups are returned as-is in development, but
 * rejected in production.
 */
function maybeDecrypt(
  data: Buffer,
  encryptionKey: Buffer | null,
  isProduction: boolean
): Buffer {
  if (data.length >= 4 && data.subarray(0, 4).toString("latin1") === "LBK1") {
    if (!encryptionKey) {
      throw new Error("Backup is encrypted but BACKUP_ENCRYPTION_KEY is not configured");
    }
    return decryptBackup(data, encryptionKey);
  }
  // Legacy unencrypted backup.
  if (isProduction) {
    throw new Error("Legacy unencrypted backups are not supported for download");
  }
  return data;
}

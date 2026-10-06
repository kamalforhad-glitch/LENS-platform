import { db } from "@/lib/db";
import { execFile } from "child_process";
import { promisify } from "util";
import { writeFile, readdir, stat, unlink, readFile, mkdir } from "fs/promises";
import { join, basename } from "path";
import { sendBackupReport } from "@/lib/email";
import { requireDatabaseUrl } from "@/lib/env";
import {
  createR2Client,
  downloadFromR2,
  getR2Config,
  r2ObjectKey,
  r2PublicUrl,
  uploadToR2,
} from "@/lib/backup/r2";

const execFileAsync = promisify(execFile);

const BACKUP_DIR = join(process.cwd(), "backups");
const MAX_BACKUPS = 30; // 30 days retention
const MAX_BACKUP_SIZE_MB = 500;

export interface BackupResult {
  id: string;
  filename: string;
  size: number;
  status: "completed" | "failed";
  duration: string;
  error?: string;
  /** Where the artifact durably lives: local disk or Cloudflare R2. */
  storage: "local" | "r2";
  /** R2 public URL when storage === "r2" and a public URL is configured. */
  remoteUrl?: string;
}

export async function createBackup(type: "manual" | "scheduled" = "manual"): Promise<BackupResult> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `lens-backup-${timestamp}.sql`;
  const id = crypto.randomUUID();

  // Create backup record
  const record = await db.backupRecord.create({
    data: { id, filename, type, status: "pending" },
  });

  try {
    const databaseUrl = requireDatabaseUrl();

    // Ensure backup directory exists before dumping (pg_dump won't create it).
    await mkdir(BACKUP_DIR, { recursive: true });

    // Plain SQL format matches the .sql extension and the cleanup filter.
    // execFile (no shell) prevents DATABASE_URL shell injection.
    const filePath = join(BACKUP_DIR, basename(filename));
    await execFileAsync("pg_dump", [
      databaseUrl,
      "--no-owner",
      "--no-acl",
      "--format=plain",
      `--file=${filePath}`,
    ]);
    const fileStat = await stat(filePath);

    // Cloudflare R2 persistence (null = R2 unconfigured → explicit local mode).
    // getR2Config() throws on partial configuration — caught below as failure.
    const r2 = getR2Config();
    let storage: "local" | "r2" = "local";
    let remoteKey: string | null = null;
    let remoteUrl: string | null = null;

    if (r2) {
      const key = r2ObjectKey(filename);
      const body = await readFile(filePath);
      // Throws R2UploadError on failure → backup is marked failed, never
      // reported as a successful persistent backup. No silent local fallback.
      await uploadToR2(createR2Client(r2), r2.bucket, key, body);
      remoteKey = key;
      remoteUrl = r2PublicUrl(r2, key);
      storage = "r2";

      // Safe local cleanup: artifact now durable in R2. A cleanup failure
      // must not fail the backup — retention sweep removes stragglers later.
      await unlink(filePath).catch((e) => {
        console.warn(`[Backup] R2 upload ok but local cleanup failed for ${filename}`, e);
      });
    }

    await db.backupRecord.update({
      where: { id },
      data: {
        status: "completed",
        size: fileStat.size,
        storage,
        remoteKey,
        remoteUrl,
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

    return { id, filename, size: fileStat.size, status: "completed", duration, storage, remoteUrl: remoteUrl ?? undefined };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";

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

  // basename() prevents directory traversal if the DB record was tampered with.
  let filePath = join(BACKUP_DIR, basename(record.filename));
  let tempPath: string | null = null;

  try {
    // R2-persisted artifacts have no local file (cleaned up after upload):
    // fetch to a temp file first. Local/legacy rows restore from disk.
    if (record.storage === "r2") {
      const r2 = getR2Config();
      if (!r2) throw new Error("Backup is stored in Cloudflare R2 but R2 is not configured");
      const key = record.remoteKey || r2ObjectKey(record.filename);
      tempPath = join(BACKUP_DIR, `restore-${record.id}.sql`);
      await mkdir(BACKUP_DIR, { recursive: true });
      const data = await downloadFromR2(createR2Client(r2), r2.bucket, key);
      await writeFile(tempPath, data);
      filePath = tempPath;
    }

    const databaseUrl = requireDatabaseUrl();

    // Plain-format dumps restore with psql (no shell — args array only).
    await execFileAsync("psql", [
      databaseUrl,
      "--no-owner",
      "--quiet",
      "--file",
      filePath,
    ]);
    if (tempPath) await unlink(tempPath).catch(() => {});
    return { success: true };
  } catch (error) {
    if (tempPath) await unlink(tempPath).catch(() => {});
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: errorMsg };
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
    console.error("[Backup Cleanup Error]", error);
  }
}

export async function downloadBackup(backupId: string): Promise<{ data?: Buffer; filename?: string; error?: string }> {
  const record = await db.backupRecord.findUnique({ where: { id: backupId } });
  if (!record) return { error: "Backup not found" };
  if (record.status !== "completed") return { error: "Backup not completed" };

  const filePath = join(BACKUP_DIR, basename(record.filename));
  try {
    const data = await readFile(filePath);
    return { data, filename: basename(record.filename) };
  } catch {
    // Fall through to R2 for r2-persisted artifacts (local file cleaned up).
  }

  if (record.storage === "r2") {
    try {
      const r2 = getR2Config();
      if (!r2) return { error: "Backup is stored in Cloudflare R2 but R2 is not configured" };
      const key = record.remoteKey || r2ObjectKey(record.filename);
      const data = await downloadFromR2(createR2Client(r2), r2.bucket, key);
      return { data, filename: basename(record.filename) };
    } catch {
      return { error: "Backup file not found in Cloudflare R2" };
    }
  }

  return { error: "Backup file not found on disk" };
}

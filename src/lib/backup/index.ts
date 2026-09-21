import { db } from "@/lib/db";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, readdir, stat, unlink, readFile } from "fs/promises";
import { join } from "path";
import { sendBackupReport } from "@/lib/email";

const execAsync = promisify(exec);

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
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL not configured");
    }

    // Use pg_dump for PostgreSQL
    const dumpCmd = `pg_dump "${databaseUrl}" --no-owner --no-acl --format=custom --file="${join(BACKUP_DIR, filename)}"`;

    await execAsync(dumpCmd);

    const filePath = join(BACKUP_DIR, filename);
    const fileStat = await stat(filePath);

    await db.backupRecord.update({
      where: { id },
      data: {
        status: "completed",
        size: fileStat.size,
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

    return { id, filename, size: fileStat.size, status: "completed", duration };
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

    return { id, filename, size: 0, status: "failed", duration, error: errorMsg };
  }
}

export async function restoreBackup(backupId: string): Promise<{ success: boolean; error?: string }> {
  const record = await db.backupRecord.findUnique({ where: { id: backupId } });
  if (!record) return { success: false, error: "Backup record not found" };
  if (record.status !== "completed") return { success: false, error: "Backup is not completed" };

  const filePath = join(BACKUP_DIR, record.filename);

  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL not configured");
    }

    // For custom format dumps, use pg_restore
    const restoreCmd = `pg_restore --no-owner --no-acl --dbname="${databaseUrl}" "${filePath}"`;

    await execAsync(restoreCmd);
    return { success: true };
  } catch (error) {
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

  const filePath = join(BACKUP_DIR, record.filename);
  try {
    const data = await readFile(filePath);
    return { data, filename: record.filename };
  } catch {
    return { error: "Backup file not found on disk" };
  }
}

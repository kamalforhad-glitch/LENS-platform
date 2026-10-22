import { db } from "../src/lib/db";
import { createBackup } from "../src/lib/backup";
import { PrismaClient } from "@prisma/client";
import { execFile } from "child_process";
import { promisify } from "util";
import { existsSync, readFileSync, unlinkSync } from "fs";
import { join } from "path";

const execFileAsync = promisify(execFile);

function getPsqlPath(): string {
  if (process.platform === "win32") {
    const candidates = [
      "C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe",
      "C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe",
      "C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe",
    ];
    for (const c of candidates) {
      if (existsSync(c)) return c;
    }
  }
  return "psql";
}

async function runTest() {
  console.log("=== STARTING BACKUP & ISOLATED RESTORE AUDIT ===");

  // 1. Run backup
  console.log("Step 1: Creating database backup...");
  const backupResult = await createBackup("manual");
  console.log("Backup result:", {
    id: backupResult.id,
    filename: backupResult.filename,
    status: backupResult.status,
    size: backupResult.size,
    duration: backupResult.duration,
    storage: backupResult.storage,
  });

  if (backupResult.status !== "completed") {
    throw new Error(`Backup failed: ${backupResult.error}`);
  }

  const backupFilePath = join(process.cwd(), "backups", backupResult.filename);
  if (!existsSync(backupFilePath)) {
    throw new Error(`Backup file does not exist on disk: ${backupFilePath}`);
  }

  // 2. Integrity check on SQL file
  console.log("Step 2: Checking backup file integrity...");
  const content = readFileSync(backupFilePath, "utf8");
  const hasCreateTable = content.includes("CREATE TABLE");
  const hasUsers = content.includes("users");
  const hasPages = content.includes("pages");
  const hasMenuItems = content.includes("menu_items");
  console.log("Backup integrity check:", {
    sizeBytes: content.length,
    hasCreateTable,
    hasUsers,
    hasPages,
    hasMenuItems,
  });

  if (!hasCreateTable || !hasUsers || !hasPages) {
    throw new Error("Backup file failed integrity checks!");
  }

  // 3. Create isolated database
  const TEST_DB_NAME = "lens_restore_test_temp";
  console.log(`Step 3: Creating isolated database '${TEST_DB_NAME}'...`);
  await db.$queryRawUnsafe(`DROP DATABASE IF EXISTS ${TEST_DB_NAME}`);
  await db.$queryRawUnsafe(`CREATE DATABASE ${TEST_DB_NAME}`);

  try {
    // 4. Restore into isolated database
    console.log(`Step 4: Restoring backup into isolated database '${TEST_DB_NAME}'...`);
    const baseUrl = process.env.DATABASE_URL || "";
    // Construct isolated DB url
    const isolatedDbUrl = baseUrl.replace(/\/lens(\?.*)?$/, `/${TEST_DB_NAME}$1`);

    const psqlPath = getPsqlPath();
    await execFileAsync(psqlPath, [
      isolatedDbUrl,
      "--quiet",
      "--file",
      backupFilePath,
    ]);

    // 5. Verify restored schema and records
    console.log("Step 5: Verifying restored schema and record counts in isolated database...");
    const testDb = new PrismaClient({
      datasources: { db: { url: isolatedDbUrl } },
    });

    const [userCount, pageCount, menuItemCount] = await Promise.all([
      testDb.user.count(),
      testDb.page.count(),
      testDb.menuItem.count(),
    ]);

    console.log("Restored isolated database counts:", {
      users: userCount,
      pages: pageCount,
      menuItems: menuItemCount,
    });

    // Check primary database counts to compare
    const [origUserCount, origPageCount, origMenuItemCount] = await Promise.all([
      db.user.count(),
      db.page.count(),
      db.menuItem.count(),
    ]);

    console.log("Original database counts:", {
      users: origUserCount,
      pages: origPageCount,
      menuItems: origMenuItemCount,
    });

    if (userCount !== origUserCount || pageCount !== origPageCount || menuItemCount !== origMenuItemCount) {
      throw new Error("Mismatch in restored record counts!");
    }

    console.log("✅ Isolated restore verification SUCCEEDED! Record counts match 100%.");

    await testDb.$disconnect();
  } finally {
    // 6. Cleanup isolated database
    console.log(`Step 6: Dropping isolated database '${TEST_DB_NAME}'...`);
    await db.$queryRawUnsafe(`DROP DATABASE IF EXISTS ${TEST_DB_NAME}`);

    // Cleanup backup file and test DB record
    console.log("Step 7: Cleaning up test backup artifact...");
    if (existsSync(backupFilePath)) {
      unlinkSync(backupFilePath);
    }
    await db.backupRecord.delete({ where: { id: backupResult.id } });
    console.log("Cleaned up successfully.");
  }

  console.log("=== BACKUP & RESTORE AUDIT COMPLETE: 100% PASS ===");
}

runTest()
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

import { NextResponse } from "next/server";
import { createBackup, listBackups, getBackupStats } from "@/lib/backup";
import { getCurrentUser, requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    requireAdmin(user);

    const [backups, stats] = await Promise.all([
      listBackups(50),
      getBackupStats(),
    ]);

    return NextResponse.json({ backups, stats });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    if (msg === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (msg === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to load backups" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const user = await getCurrentUser();
    requireAdmin(user);

    const result = await createBackup("manual");

    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    if (msg === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (msg === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Backup failed" }, { status: 500 });
  }
}

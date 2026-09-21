import { NextResponse } from "next/server";
import { createBackup } from "@/lib/backup";

// This endpoint can be called by a cron job (e.g., Vercel Cron, GitHub Actions, or a scheduled task)
// GET /api/cron/backup - triggers daily backup
// Add to vercel.json: { "crons": [{ "path": "/api/cron/backup", "schedule": "0 2 * * *" }] }

export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await createBackup("scheduled");

    if (result.status === "completed") {
      console.log(`[Cron Backup] Success: ${result.filename} (${result.size} bytes)`);
    } else {
      console.error(`[Cron Backup] Failed: ${result.error}`);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Cron Backup] Error:", error);
    return NextResponse.json({ error: "Backup failed" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/health — load-balancer / uptime probe.
// Returns integration status WITHOUT secret values.
export async function GET() {
  const checks: Record<string, "ok" | "degraded" | "down"> = {
    app: "ok",
    database: "down",
    storage: process.env.S3_ACCESS_KEY_ID ? "ok" : "degraded",
    email: process.env.RESEND_API_KEY ? "ok" : "degraded",
    ai: process.env.OPENAI_API_KEY ? "ok" : "degraded",
    cron: process.env.CRON_SECRET ? "ok" : "down",
  };

  try {
    await db.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch {
    checks.database = "down";
  }

  const status = checks.database === "down" || checks.cron === "down" ? 503 : 200;
  return NextResponse.json(
    { status: status === 200 ? "healthy" : "degraded", checks, version: "0.2.0" },
    { status }
  );
}

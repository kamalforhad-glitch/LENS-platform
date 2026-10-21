import { NextResponse } from "next/server";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { runCmsMigration } from "@/lib/actions/cms-migrate";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      requireAdmin(user);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unauthorized";
      if (msg === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { slug?: string; dryRun?: boolean };
    try {
      body = (await request.json()) ?? {};
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Dry-run by default: report proposed pages/sections before any write.
    const dryRun = body.dryRun !== false;

    const result = await runCmsMigration({ slug: body.slug, dryRun });
    return NextResponse.json(result);
  } catch (error) {
    console.error("[CMS Migrate API Error]", error);
    const errorMessage = error instanceof Error ? error.message : "Migration failed";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

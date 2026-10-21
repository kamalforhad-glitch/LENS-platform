import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, requireEditor } from "@/lib/auth";
import { reorderSections } from "@/lib/actions/cms";

/**
 * Reorder the sections of a page via REST.
 *
 * Delegates to the `reorderSections` server action, which only accepts ids of
 * sections that actually belong to the given page (ownership check) and
 * renumbers their sortOrder. Mirrors what the PageSectionEditor's drag
 * controls do, so scripted migrations can place sections in a chosen order.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    requireEditor(user);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unauthorized";
    if (msg === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { pageId, sectionIds } = await req.json();
    if (!pageId || typeof pageId !== "string") {
      return NextResponse.json({ error: "pageId is required" }, { status: 400 });
    }
    if (!Array.isArray(sectionIds) || sectionIds.some((id: unknown) => typeof id !== "string")) {
      return NextResponse.json({ error: "sectionIds must be an array of strings" }, { status: 400 });
    }
    await reorderSections(pageId, sectionIds);
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Reorder failed";
    if (msg === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (msg === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

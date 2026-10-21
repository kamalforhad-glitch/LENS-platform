import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, requireEditor } from "@/lib/auth";
import { createSection, updateSection } from "@/lib/actions/cms";

/**
 * Whitelisted section updates via REST.
 *
 * The payload is delegated to the `updateSection` server action, which
 * applies the field whitelist (title/titleBn/description/descriptionBn/
 * visible/content/contentBn/settings), clamps text lengths, sanitizes
 * section JSON strings, writes the audit log, and revalidates affected
 * paths. Raw body fields such as `type`, `pageId`, `sortOrder` or
 * `id` inside the payload can no longer be mass-assigned, and saved
 * JSON can no longer bypass sanitization.
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
    const { pageId, ...payload } = await req.json();
    if (!pageId || typeof pageId !== "string") {
      return NextResponse.json({ error: "pageId is required" }, { status: 400 });
    }
    const section = await createSection(pageId, payload);
    return NextResponse.json({ section }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Create failed";
    if (msg === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (msg === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "Page not found") return NextResponse.json({ error: msg }, { status: 404 });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
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
    const { id, ...payload } = await req.json();
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    const section = await updateSection(id, payload);
    return NextResponse.json({ section });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Update failed";
    if (msg === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (msg === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "Section not found") return NextResponse.json({ error: msg }, { status: 404 });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

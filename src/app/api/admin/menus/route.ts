import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, requireAuth, requireAdmin, requireEditor } from "@/lib/auth";
import { sanitizeUrl, clampText } from "@/lib/cms-validation";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";

function authErrorResponse(error: unknown) {
  const msg = error instanceof Error ? error.message : "Unauthorized";
  if (msg === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// Fields a REST caller may set on a menu item.
const MENU_MUTABLE = new Set([
  "label", "labelBn", "url", "visible", "target", "parentId", "location",
]);

/** Whitelist + validate a menu payload. Throws with a readable message. */
function buildMenuData(raw: unknown, selfId?: string): Record<string, unknown> {
  if (!raw || typeof raw !== "object") return {};
  const src = raw as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(src)) {
    if (MENU_MUTABLE.has(key)) data[key] = value;
  }
  if (typeof data.label === "string") data.label = clampText(data.label, 100);
  if (typeof data.labelBn === "string") data.labelBn = clampText(data.labelBn, 100);
  if (data.url !== undefined) {
    const check = sanitizeUrl(data.url);
    if (!check.ok) throw new Error(check.error || "Invalid URL");
    data.url = check.url || "/";
  }
  if (data.target !== undefined) {
    const t = String(data.target);
    if (!["_self", "_blank"].includes(t)) throw new Error("Invalid target");
    data.target = t;
  }
  if (data.visible !== undefined) data.visible = Boolean(data.visible);
  // Empty parent means "no parent" (top level).
  if (data.parentId === "") delete data.parentId;
  if (data.parentId !== undefined) {
    if (typeof data.parentId === "string" && data.parentId === selfId) {
      throw new Error("A menu item cannot be its own parent");
    }
  }
  return data;
}

export async function GET(req: NextRequest) {
  try {
    requireAuth(await getCurrentUser());
  } catch (error) {
    return authErrorResponse(error);
  }
  const location = req.nextUrl.searchParams.get("location") || "header";
  const items = await db.menuItem.findMany({
    where: { location: location === "*" ? undefined : location },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    requireEditor(user);
  } catch (error) {
    return authErrorResponse(error);
  }
  try {
    const data = buildMenuData(await req.json());
    if (!data.location) data.location = "header";
    if (!["header", "footer"].includes(String(data.location))) {
      return NextResponse.json({ error: "Invalid location" }, { status: 400 });
    }
    const maxOrder = await db.menuItem.findFirst({
      where: { location: String(data.location) },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    const item = await db.menuItem.create({
      data: { ...data, sortOrder: (maxOrder?.sortOrder ?? 0) + 1 } as never,
    });
    await logAudit({
      action: AUDIT_ACTIONS.MENU_CREATED,
      actor: user,
      targetType: "menu_item",
      targetId: item.id,
      meta: { location: item.location, label: item.label },
    });
    return NextResponse.json({ item });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Create failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    requireEditor(user);
  } catch (error) {
    return authErrorResponse(error);
  }
  try {
    const body = await req.json();
    const { id, ...payload } = body as { id?: string } & Record<string, unknown>;
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    const data = buildMenuData(payload, id);
    const item = await db.menuItem.update({ where: { id }, data: data as never });
    await logAudit({
      action: AUDIT_ACTIONS.MENU_UPDATED,
      actor: user,
      targetType: "menu_item",
      targetId: id,
      meta: { location: item.location, label: item.label },
    });
    return NextResponse.json({ item });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Update failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    requireAdmin(user);
  } catch (error) {
    return authErrorResponse(error);
  }
  try {
    const { id } = await req.json();
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    const existing = await db.menuItem.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
    // Reparent children before deleting (avoid orphan references).
    await db.menuItem.updateMany({ where: { parentId: id }, data: { parentId: null } });
    await db.menuItem.delete({ where: { id } });
    await logAudit({
      action: AUDIT_ACTIONS.MENU_DELETED,
      actor: user,
      targetType: "menu_item",
      targetId: id,
      meta: { location: existing.location, label: existing.label },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Delete failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

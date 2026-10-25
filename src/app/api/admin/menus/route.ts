import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser, requireAuth, requireAdmin, requireEditor } from "@/lib/auth";
import { sanitizeUrl, clampText } from "@/lib/cms-validation";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";
import { assertValidMenuParent, assertValidMenuParentInput } from "@/lib/menu-validation";
import { seedDefaultNavigation } from "@/lib/actions/cms";

function authErrorResponse(error: unknown) {
  const msg = error instanceof Error ? error.message : "Unauthorized";
  if (msg === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function isTableMissingError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as Record<string, unknown>;
  if (err.code === "42P01") return true;
  const message = String(err.message || "");
  return (
    (message.includes("relation") && message.includes("does not exist")) ||
    (message.includes("table") && message.includes("does not exist")) ||
    message.includes("UndefinedTable")
  );
}

export function isSchemaColumnMissingError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as Record<string, unknown>;
  if (err.code === "P2022" || err.code === "42703") return true;
  const message = String(err.message || "");
  return (
    (message.includes("column") && message.includes("does not exist")) ||
    message.includes("UndefinedColumn") ||
    message.includes("P2022")
  );
}

export function isDatabaseConnectionError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as Record<string, unknown>;
  const name = String(err.name || "");
  const code = String(err.code || "");
  const message = String(err.message || "");

  if (name === "PrismaClientInitializationError") return true;
  if (["P1000", "P1001", "P1002", "P1008", "P1017"].includes(code)) return true;
  return (
    message.includes("Can't reach database server") ||
    message.includes("connection closed") ||
    message.includes("Connection terminated")
  );
}

// Fields a REST caller may set on a menu item.
const MENU_MUTABLE = new Set([
  "label",
  "labelBn",
  "description",
  "descriptionBn",
  "url",
  "externalUrl",
  "visible",
  "status",
  "isClickable",
  "openSubmenu",
  "badgeText",
  "badgeTextBn",
  "badgeStyle",
  "icon",
  "target",
  "parentId",
  "location",
  "desktopVisible",
  "mobileVisible",
  "roles",
  "sortOrder",
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
  if (typeof data.description === "string") data.description = clampText(data.description, 300);
  if (typeof data.descriptionBn === "string") data.descriptionBn = clampText(data.descriptionBn, 300);
  if (data.url !== undefined) {
    const check = sanitizeUrl(String(data.url));
    if (!check.ok) throw new Error(check.error || "Invalid URL");
    data.url = check.url || "/";
  }
  if (data.externalUrl !== undefined && data.externalUrl !== null && data.externalUrl !== "") {
    const check = sanitizeUrl(String(data.externalUrl));
    if (!check.ok) throw new Error(check.error || "Invalid external URL");
    data.externalUrl = check.url;
  } else if (data.externalUrl === "") {
    data.externalUrl = null;
  }
  if (data.status !== undefined) {
    const s = String(data.status);
    if (!["active", "soon", "draft", "disabled"].includes(s)) {
      throw new Error("Invalid status");
    }
    data.status = s;
  }
  if (data.isClickable !== undefined) data.isClickable = Boolean(data.isClickable);
  if (data.openSubmenu !== undefined) data.openSubmenu = Boolean(data.openSubmenu);
  if (data.desktopVisible !== undefined) data.desktopVisible = Boolean(data.desktopVisible);
  if (data.mobileVisible !== undefined) data.mobileVisible = Boolean(data.mobileVisible);
  if (data.badgeText !== undefined) {
    data.badgeText = data.badgeText ? clampText(String(data.badgeText), 40) : null;
  }
  if (data.badgeTextBn !== undefined) {
    data.badgeTextBn = data.badgeTextBn ? clampText(String(data.badgeTextBn), 40) : null;
  }
  if (data.badgeStyle !== undefined) {
    data.badgeStyle = data.badgeStyle ? clampText(String(data.badgeStyle), 30) : "gold";
  }
  if (data.icon !== undefined) {
    data.icon = data.icon ? clampText(String(data.icon), 50) : null;
  }
  if (data.target !== undefined) {
    const t = String(data.target);
    if (!["_self", "_blank"].includes(t)) throw new Error("Invalid target");
    data.target = t;
  }
  if (data.visible !== undefined) data.visible = Boolean(data.visible);
  if (data.sortOrder !== undefined) data.sortOrder = Number(data.sortOrder) || 0;

  // Empty parent means "no parent" (top level).
  if (data.parentId === "") data.parentId = null;
  if (data.parentId !== undefined && data.parentId !== null) {
    if (typeof data.parentId === "string" && data.parentId === selfId) {
      throw new Error("A menu item cannot be its own parent");
    }
  }
  return data;
}

/**
 * Referential validation for parents.
 */
async function validateMenuParent(
  rawParentId: unknown,
  location: string,
  selfId?: string,
): Promise<void> {
  const parentId = assertValidMenuParentInput(rawParentId, selfId);
  if (parentId) await assertValidMenuParent(parentId, location, selfId);
}

export async function GET(req: NextRequest) {
  try {
    requireAuth(await getCurrentUser());
  } catch (error) {
    return authErrorResponse(error);
  }
  const location = req.nextUrl.searchParams.get("location") || "header";
  try {
    const items = await db.menuItem.findMany({
      where: { location: location === "*" ? undefined : location },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ items: items || [] });
  } catch (error) {
    if (isTableMissingError(error)) {
      console.warn("[Menu API Table Missing Error]", error);
      return NextResponse.json(
        {
          error: "Navigation database table is not initialized. Database migrations must be run before managing menus.",
          items: [],
          tableMissing: true,
        },
        { status: 503 }
      );
    }
    if (isSchemaColumnMissingError(error)) {
      console.warn("[Menu API Schema Drift Warning - falling back to base columns]", error);
      try {
        const rawItems = location === "*"
          ? await db.$queryRaw<any[]>`
              SELECT id, location, label, COALESCE(label_bn, '') as "labelBn",
                     '' as description, '' as "descriptionBn", url, NULL as "externalUrl",
                     sort_order as "sortOrder", visible, 'active' as status,
                     true as "isClickable", true as "openSubmenu", NULL as "badgeText",
                     NULL as "badgeTextBn", 'gold' as "badgeStyle", NULL as icon,
                     target, parent_id as "parentId", true as "desktopVisible",
                     true as "mobileVisible", 'all' as roles,
                     created_at as "dateCreated", updated_at as "dateModified"
              FROM menu_items
              ORDER BY sort_order ASC
            `
          : await db.$queryRaw<any[]>`
              SELECT id, location, label, COALESCE(label_bn, '') as "labelBn",
                     '' as description, '' as "descriptionBn", url, NULL as "externalUrl",
                     sort_order as "sortOrder", visible, 'active' as status,
                     true as "isClickable", true as "openSubmenu", NULL as "badgeText",
                     NULL as "badgeTextBn", 'gold' as "badgeStyle", NULL as icon,
                     target, parent_id as "parentId", true as "desktopVisible",
                     true as "mobileVisible", 'all' as roles,
                     created_at as "dateCreated", updated_at as "dateModified"
              FROM menu_items
              WHERE location = ${location}
              ORDER BY sort_order ASC
            `;
        return NextResponse.json({
          items: rawItems || [],
          warning: "Database migration pending: running in legacy schema compatibility mode.",
        });
      } catch (rawError) {
        if (isTableMissingError(rawError)) {
          return NextResponse.json(
            {
              error: "Navigation database table is not initialized. Database migrations must be run before managing menus.",
              items: [],
              tableMissing: true,
            },
            { status: 503 }
          );
        }
        console.warn("[Menu API Legacy Fallback Error - returning 500]", rawError);
        return NextResponse.json(
          {
            error: "Failed to read navigation items from database.",
            items: [],
          },
          { status: 500 }
        );
      }
    }
    if (isDatabaseConnectionError(error)) {
      console.error("[Menu API Database Connection Error]", error);
      return NextResponse.json({ error: "Database connection unavailable", items: [] }, { status: 503 });
    }
    console.error("[Menu API Unexpected Error]", error);
    return NextResponse.json({ error: "Failed to fetch menu items", items: [] }, { status: 500 });
  }
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
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Special action: Seed defaults
    if (body.action === "seed_defaults") {
      requireAdmin(user);
      const loc = body.location === "header" || body.location === "footer" ? body.location : "all";
      await seedDefaultNavigation(loc);
      const items = await db.menuItem.findMany({
        where: { location: loc === "all" ? undefined : loc },
        orderBy: { sortOrder: "asc" },
      });
      return NextResponse.json({ success: true, items });
    }

    // Special action: Reorder multiple items
    if (body.action === "reorder") {
      const { items: reorderedItems, location } = body as {
        items: Array<{ id: string; sortOrder: number; parentId?: string | null }>;
        location: string;
      };
      if (!Array.isArray(reorderedItems) || !location) {
        return NextResponse.json({ error: "Invalid reorder payload" }, { status: 400 });
      }
      await db.$transaction(
        reorderedItems.map((item) =>
          db.menuItem.update({
            where: { id: item.id },
            data: {
              sortOrder: item.sortOrder,
              ...(item.parentId !== undefined ? { parentId: item.parentId || null } : {}),
            },
          })
        )
      );
      await logAudit({
        action: AUDIT_ACTIONS.MENU_REORDERED,
        actor: user,
        targetType: "menu",
        meta: { location, count: reorderedItems.length },
      });
      revalidatePath("/", "layout");
      return NextResponse.json({ success: true });
    }

    const data = buildMenuData(body);
    if (!data.location) data.location = "header";
    if (!["header", "footer"].includes(String(data.location))) {
      return NextResponse.json({ error: "Invalid location" }, { status: 400 });
    }
    try {
      await validateMenuParent(data.parentId, String(data.location));
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Invalid parent";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    const maxOrder = await db.menuItem.findFirst({
      where: { location: String(data.location) },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    const item = await db.menuItem.create({
      data: {
        ...data,
        sortOrder: data.sortOrder !== undefined ? Number(data.sortOrder) : (maxOrder?.sortOrder ?? 0) + 1,
      } as never,
    });
    await logAudit({
      action: AUDIT_ACTIONS.MENU_CREATED,
      actor: user,
      targetType: "menu",
      targetId: item.id,
      meta: { location: item.location, label: item.label },
    });
    revalidatePath("/", "layout");
    return NextResponse.json({ item });
  } catch (error) {
    if (isTableMissingError(error) || isSchemaColumnMissingError(error)) {
      return NextResponse.json(
        { error: "Database migration required before updating navigation fields." },
        { status: 503 }
      );
    }
    if (isDatabaseConnectionError(error)) {
      return NextResponse.json({ error: "Database connection unavailable" }, { status: 503 });
    }
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
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const { id, ...payload } = body as { id?: string } & Record<string, unknown>;
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    const data = buildMenuData(payload, id);
    const existing = await db.menuItem.findUnique({ where: { id }, select: { location: true } });
    if (!existing) return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
    const effectiveLocation =
      data.location !== undefined ? String(data.location) : existing.location;
    if (!["header", "footer"].includes(effectiveLocation)) {
      return NextResponse.json({ error: "Invalid location" }, { status: 400 });
    }
    try {
      await validateMenuParent(data.parentId, effectiveLocation, id);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Invalid parent";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    const item = await db.menuItem.update({ where: { id }, data: data as never });
    await logAudit({
      action: AUDIT_ACTIONS.MENU_UPDATED,
      actor: user,
      targetType: "menu",
      targetId: id,
      meta: { location: item.location, label: item.label, status: item.status },
    });
    revalidatePath("/", "layout");
    return NextResponse.json({ item });
  } catch (error) {
    if (isTableMissingError(error) || isSchemaColumnMissingError(error)) {
      return NextResponse.json(
        { error: "Database migration required before updating navigation fields." },
        { status: 503 }
      );
    }
    if (isDatabaseConnectionError(error)) {
      return NextResponse.json({ error: "Database connection unavailable" }, { status: 503 });
    }
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
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const { id, cascade } = body;
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    const existing = await db.menuItem.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Menu item not found" }, { status: 404 });

    if (cascade) {
      // Cascade delete all descendants
      const getDescendantIds = async (parentId: string): Promise<string[]> => {
        const children = await db.menuItem.findMany({ where: { parentId }, select: { id: true } });
        let result: string[] = [];
        for (const child of children) {
          result.push(child.id);
          const deeper = await getDescendantIds(child.id);
          result = result.concat(deeper);
        }
        return result;
      };
      const descIds = await getDescendantIds(id);
      if (descIds.length > 0) {
        await db.menuItem.deleteMany({ where: { id: { in: descIds } } });
      }
    } else {
      // Reparent children to parent's parent before deleting
      await db.menuItem.updateMany({ where: { parentId: id }, data: { parentId: existing.parentId || null } });
    }

    await db.menuItem.delete({ where: { id } });
    await logAudit({
      action: AUDIT_ACTIONS.MENU_DELETED,
      actor: user,
      targetType: "menu",
      targetId: id,
      meta: { location: existing.location, label: existing.label },
    });
    revalidatePath("/", "layout");
    return NextResponse.json({ success: true });
  } catch (error) {
    if (isTableMissingError(error) || isSchemaColumnMissingError(error)) {
      return NextResponse.json(
        { error: "Database migration required before updating navigation fields." },
        { status: 503 }
      );
    }
    if (isDatabaseConnectionError(error)) {
      return NextResponse.json({ error: "Database connection unavailable" }, { status: 503 });
    }
    const msg = error instanceof Error ? error.message : "Delete failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

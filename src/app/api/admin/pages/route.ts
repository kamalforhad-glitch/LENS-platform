import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, requireAuth, requireAdmin, requireEditor } from "@/lib/auth";
import { validateSlug, sanitizeUrl } from "@/lib/cms-validation";
import { serializeSectionJson } from "@/lib/cms-validation";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";
import { revalidatePath } from "next/cache";

function authErrorResponse(error: unknown) {
  const msg = error instanceof Error ? error.message : "Unauthorized";
  if (msg === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(req: NextRequest) {
  try {
    requireAuth(await getCurrentUser());
  } catch (error) {
    return authErrorResponse(error);
  }
  const slug = req.nextUrl.searchParams.get("slug");
  const id = req.nextUrl.searchParams.get("id");
  if (slug) {
    const page = await db.page.findUnique({ where: { slug }, include: { sections: { orderBy: { sortOrder: "asc" } } } });
    return NextResponse.json({ page });
  }
  if (id) {
    const page = await db.page.findUnique({ where: { id }, include: { sections: { orderBy: { sortOrder: "asc" } } } });
    return NextResponse.json({ page });
  }
  const pages = await db.page.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ pages });
}

// Fields a REST caller may set on a page record.
const REST_PAGE_FIELDS = new Set([
  "slug", "title", "titleBn", "description", "descriptionBn", "status",
  "scheduledAt", "sortOrder", "template", "parentId",
  "metaTitle", "metaTitleBn", "metaDescription", "metaDescriptionBn",
  "ogImage", "keywords", "canonicalUrl",
]);

function buildPageData(raw: unknown): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  if (raw && typeof raw === "object") {
    for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
      if (REST_PAGE_FIELDS.has(key)) data[key] = value;
    }
  }
  // Empty string is not a valid parent reference — treat as "no parent".
  if (data.parentId === "") delete data.parentId;
  return data;
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  try {
    if (!user) throw new Error("Unauthorized");
    requireEditor(user);
  } catch (error) {
    return authErrorResponse(error);
  }
  try {
    const raw = buildPageData(await req.json());
    if (typeof raw.slug === "string") {
      const check = validateSlug(raw.slug);
      if (!check.valid) return NextResponse.json({ error: check.error }, { status: 400 });
    } else {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }
    if (raw.ogImage) {
      const check = sanitizeUrl(String(raw.ogImage));
      if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });
    }
    const page = await db.page.create({
      data: {
        ...raw,
        slug: String(raw.slug).trim().toLowerCase(),
        createdBy: user.id,
        publishedAt: raw.status === "published" ? new Date() : null,
      } as never,
    });
    await logAudit({
      action: AUDIT_ACTIONS.PAGE_CREATED,
      actor: user,
      targetType: "page",
      targetId: page.id,
      meta: { slug: page.slug, via: "api" },
    });
    revalidatePath("/");
    revalidatePath(`/${page.slug}`);
    return NextResponse.json({ page });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Create failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  try {
    if (!user) throw new Error("Unauthorized");
    requireEditor(user);
  } catch (error) {
    return authErrorResponse(error);
  }
  try {
    const payload = await req.json();
    const { id } = payload as { id?: string };
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    const existing = await db.page.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Page not found" }, { status: 404 });

    const raw = buildPageData(payload);
    // Slug guard
    if (typeof raw.slug === "string") {
      const nextSlug = raw.slug.trim().toLowerCase();
      if (nextSlug !== existing.slug) {
        if (existing.slug === "home") {
          return NextResponse.json({ error: "The homepage slug cannot be changed" }, { status: 400 });
        }
        const check = validateSlug(nextSlug);
        if (!check.valid) return NextResponse.json({ error: check.error }, { status: 400 });
        const taken = await db.page.findFirst({ where: { slug: nextSlug, NOT: { id } } });
        if (taken) return NextResponse.json({ error: "Slug is already in use" }, { status: 409 });
      }
    }
    if (raw.ogImage) {
      const check = sanitizeUrl(String(raw.ogImage));
      if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });
    }
    if (raw.parentId === id) {
      return NextResponse.json({ error: "A page cannot be its own parent" }, { status: 400 });
    }

    // Status transition audit
    let auditAction: string = AUDIT_ACTIONS.PAGE_UPDATED;
    if (typeof raw.status === "string" && raw.status !== existing.status && ["draft", "published", "archived"].includes(raw.status)) {
      if (existing.status === "published" && raw.status !== "published") auditAction = AUDIT_ACTIONS.PAGE_UNPUBLISHED;
      else if (raw.status === "published") {
        auditAction = AUDIT_ACTIONS.PAGE_PUBLISHED;
        if (!existing.publishedAt) raw.publishedAt = new Date();
      } else if (raw.status === "archived") auditAction = AUDIT_ACTIONS.PAGE_ARCHIVED;
    }

    const page = await db.page.update({ where: { id }, data: raw });
    await logAudit({
      action: auditAction,
      actor: user,
      targetType: "page",
      targetId: id,
      meta: { slug: page.slug, status: page.status, via: "api" },
    });
    revalidatePath("/");
    revalidatePath(`/${page.slug}`);
    return NextResponse.json({ page });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Update failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  try {
    if (!user) throw new Error("Unauthorized");
    requireAdmin(user);
  } catch (error) {
    return authErrorResponse(error);
  }
  try {
    const { id } = await req.json();
    const page = await db.page.findUnique({ where: { id } });
    if (page?.slug === "home") {
      return NextResponse.json({ error: "The homepage cannot be deleted" }, { status: 400 });
    }
    await db.page.delete({ where: { id } });
    await logAudit({
      action: AUDIT_ACTIONS.PAGE_DELETED,
      actor: user,
      targetType: "page",
      targetId: String(id),
      meta: { slug: page?.slug },
    });
    revalidatePath("/");
    if (page) revalidatePath(`/${page.slug}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Delete failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

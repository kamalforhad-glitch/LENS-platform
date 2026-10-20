"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";import { getCurrentUser, requireAuth, requireAdmin } from "@/lib/auth";
import { DEFAULT_SITE_SETTINGS, DEFAULT_HOME_SECTIONS } from "@/lib/cms-defaults";
import { validateSlug, sanitizeUrl } from "@/lib/cms-validation";
import { serializeSectionJson, toJson, clampText } from "@/lib/cms-validation";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";

async function checkAuth() {
  const user = await getCurrentUser();
  return user ? requireAuth(user, "editor") : null;
}

// ============================================================
// Public Safe CMS Accessors (No Auth Required, Safe Fallbacks)
// ============================================================

export interface PublicSiteSettingsMap {
  [key: string]: { value: string; valueBn: string };
}

export async function getPublicSiteSettings(): Promise<PublicSiteSettingsMap> {
  try {
    const rows = await db.siteSetting.findMany();
    const map: PublicSiteSettingsMap = {};
    for (const r of rows) {
      map[r.key] = { value: r.value, valueBn: r.valueBn };
    }
    // Fill in any defaults not present in DB
    for (const d of DEFAULT_SITE_SETTINGS) {
      if (!map[d.key]) {
        map[d.key] = { value: d.value, valueBn: d.valueBn };
      }
    }
    return map;
  } catch {
    const fallback: PublicSiteSettingsMap = {};
    for (const d of DEFAULT_SITE_SETTINGS) {
      fallback[d.key] = { value: d.value, valueBn: d.valueBn };
    }
    return fallback;
  }
}

export interface PublicSectionData {
  id: string;
  type: string;
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  sortOrder: number;
  visible: boolean;
  settings: Record<string, unknown>;
  content: Record<string, unknown>;
  contentBn: Record<string, unknown>;
}

export interface PublicPageData {
  id: string;
  slug: string;
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  template: string;
  metaTitle: string | null;
  metaTitleBn: string | null;
  metaDescription: string | null;
  metaDescriptionBn: string | null;
  ogImage: string | null;
  sections: PublicSectionData[];
}

function fallbackHome(id: string): PublicPageData {
  return {
    id,
    slug: "home",
    title: "Home",
    titleBn: "হোম",
    description: "LENS Homepage",
    descriptionBn: "লেন্স হোমপেজ",
    template: "home",
    metaTitle: "LENS — Lighthouse for Evolving Narrative Systems",
    metaTitleBn: "লেন্স — লাইটহাউস ফর ইভলভিং ন্যারেটিভ সিস্টেমস",
    metaDescription: "Evidence-based research on media literacy, press freedom, narrative analysis and cybersecurity in Bangladesh.",
    metaDescriptionBn: null,
    ogImage: null,
    sections: DEFAULT_HOME_SECTIONS.map((s, idx) => ({
      id: `${id}-${s.type}-${idx}`,
      type: s.type,
      title: s.title,
      titleBn: s.titleBn,
      description: s.description,
      descriptionBn: s.descriptionBn,
      sortOrder: s.sortOrder,
      visible: s.visible,
      settings: s.settings,
      content: s.content,
      contentBn: s.contentBn,
    })),
  };
}

export async function getPublicPage(slug: string): Promise<PublicPageData | null> {
  try {
    const page = await db.page.findFirst({
      where: { slug, status: "published" },
      include: {
        sections: {
          where: { visible: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!page) {
      return slug === "home" ? fallbackHome("default-home") : null;
    }

    return sectionsToPublicPage(page as unknown as PublicPageRow);
  } catch {
    return slug === "home" ? fallbackHome("fallback-home") : null;
  }
}

interface PublicPageRow {
  id: string;
  slug: string;
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  template: string;
  metaTitle: string | null;
  metaTitleBn: string | null;
  metaDescription: string | null;
  metaDescriptionBn: string | null;
  ogImage: string | null;
  sections: Array<{
    id: string;
    type: string;
    title: string;
    titleBn: string;
    description: string;
    descriptionBn: string;
    sortOrder: number;
    visible: boolean;
    settings: string;
    content: string;
    contentBn: string;
  }>;
}

function sectionsToPublicPage(page: PublicPageRow): PublicPageData {
  const parsedSections: PublicSectionData[] = page.sections.map((sec) => ({
    id: sec.id,
    type: sec.type,
    title: sec.title,
    titleBn: sec.titleBn,
    description: sec.description,
    descriptionBn: sec.descriptionBn,
    sortOrder: sec.sortOrder,
    visible: sec.visible,
    settings: safeParse(sec.settings),
    content: safeParse(sec.content),
    contentBn: safeParse(sec.contentBn),
  }));

  return {
    id: page.id,
    slug: page.slug,
    title: page.title,
    titleBn: page.titleBn,
    description: page.description,
    descriptionBn: page.descriptionBn,
    template: page.template,
    metaTitle: page.metaTitle,
    metaTitleBn: page.metaTitleBn,
    metaDescription: page.metaDescription,
    metaDescriptionBn: page.metaDescriptionBn,
    ogImage: page.ogImage,
    sections: parsedSections,
  };
}

function safeParse(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

// ============================================================
// Pages CRUD (server-action: editor+ writes, admin deletes)
// ============================================================

export async function getPages(filters?: { status?: string }) {
  requireAuth(await getCurrentUser(), "viewer");

  // groupBy returns grouped tree info used by the list UI
  const where = filters?.status ? { status: filters.status } : {};
  const pages = await db.page.findMany({
    where,
    orderBy: { sortOrder: "asc" },
    include: {
      sections: { orderBy: { sortOrder: "asc" } },
      parent: { select: { id: true, slug: true, title: true } },
    },
  });
  return pages;
}

export async function getPage(id: string) {
  requireAuth(await getCurrentUser(), "viewer");
  return db.page.findUnique({
    where: { id },
    include: { sections: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function getPageBySlug(slug: string) {
  requireAuth(await getCurrentUser(), "viewer");
  return db.page.findUnique({
    where: { slug },
    include: { sections: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function createPage(data: {
  slug: string;
  title: string;
  titleBn?: string;
  description?: string;
  descriptionBn?: string;
  status?: string;
  template?: string;
  metaTitle?: string;
  metaTitleBn?: string;
  metaDescription?: string;
  metaDescriptionBn?: string;
  ogImage?: string;
  keywords?: string;
  canonicalUrl?: string;
}) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");

  const slugCheck = validateSlug(data.slug);
  if (!slugCheck.valid) throw new Error(slugCheck.error || "Invalid slug");
  const ogCheck = data.ogImage ? sanitizeUrl(data.ogImage) : { ok: true as const };
  if (!ogCheck.ok) throw new Error(ogCheck.error || "Invalid OG image URL");

  const page = await db.page.create({
    data: {
      ...data,
      slug: data.slug.trim().toLowerCase(),
      status: data.status === "published" ? "published" : "draft",
      createdBy: auth.id,
      publishedAt: data.status === "published" ? new Date() : null,
    },
  });

  await logAudit({
    action: AUDIT_ACTIONS.PAGE_CREATED,
    actor: auth,
    targetType: "page",
    targetId: page.id,
    meta: { slug: page.slug, title: page.title, status: page.status },
  });

  revalidatePath("/");
  revalidatePath(`/${page.slug}`);
  return page;
}

const PAGE_MUTABLE_FIELDS = [
  "title",
  "titleBn",
  "description",
  "descriptionBn",
  "status",
  "scheduledAt",
  "sortOrder",
  "template",
  "parentId",
  "metaTitle",
  "metaTitleBn",
  "metaDescription",
  "metaDescriptionBn",
  "ogImage",
  "keywords",
  "canonicalUrl",
] as const;

/** Shared mutation core used by updatePage and publish actions. */
async function mutatePage(id: string, raw: Record<string, unknown>) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");

  const existing = await db.page.findUnique({ where: { id } });
  if (!existing) throw new Error("Page not found");

  const data: Record<string, unknown> = {};
  for (const field of PAGE_MUTABLE_FIELDS) {
    if (raw[field] !== undefined) data[field] = raw[field];
  }

  // Slug rules
  if (raw.slug !== undefined && typeof raw.slug === "string") {
    const nextSlug = raw.slug.trim().toLowerCase();
    if (nextSlug !== existing.slug) {
      if (existing.slug === "home") throw new Error("The homepage slug cannot be changed");
      const slugCheck = validateSlug(nextSlug);
      if (!slugCheck.valid) throw new Error(slugCheck.error || "Invalid slug");
      const taken = await db.page.findFirst({ where: { slug: nextSlug, NOT: { id } } });
      if (taken) throw new Error("Slug is already in use by another page");
      data.slug = nextSlug;
    }
  }

  // URL fields
  if (typeof data.ogImage === "string") {
    const check = data.ogImage ? sanitizeUrl(data.ogImage) : { ok: true as const };
    if (!check.ok) throw new Error(check.error || "Invalid OG image URL");
  }
  if (typeof data.canonicalUrl === "string") {
    const check = data.canonicalUrl ? sanitizeUrl(data.canonicalUrl) : { ok: true as const };
    if (!check.ok) throw new Error(check.error || "Invalid canonical URL");
  }

  // Self parent guard
  if (data.parentId === id) {
    return { error: "A page cannot be its own parent" as string };
  }

  // Status transitions (single clean switch)
  let auditAction: string = AUDIT_ACTIONS.PAGE_UPDATED;
  if (typeof data.status === "string" && data.status !== existing.status) {
    const next = data.status;
    if (!["draft", "published", "archived"].includes(next)) {
      throw new Error("Invalid status");
    }
    if (existing.publishedAt) data.publishedAt = existing.publishedAt; // preserve first publish date
    if (next === "published" && !("publishedAt" in data && data.publishedAt)) {
      data.publishedAt = new Date();
    }
    if (existing.status === "published" && next !== "published") {
      auditAction = AUDIT_ACTIONS.PAGE_UNPUBLISHED;
    } else if (next === "published") {
      auditAction = AUDIT_ACTIONS.PAGE_PUBLISHED;
    } else if (next === "archived") {
      auditAction = AUDIT_ACTIONS.PAGE_ARCHIVED;
    } else if (next === "draft" && existing.status === "archived") {
      auditAction = AUDIT_ACTIONS.PAGE_RESTORED;
    }
  }

  const page = await db.page.update({ where: { id }, data });
  await logAudit({
    action: auditAction,
    actor: auth,
    targetType: "page",
    targetId: page.id,
    meta: { slug: page.slug, status: page.status },
  });

  revalidatePath("/");
  revalidatePath(`/${existing.slug}`);
  if (typeof data.slug === "string" && data.slug !== existing.slug) {
    revalidatePath(`/${data.slug}`);
  }
  return { page, action: auditAction as string };
}

export async function updatePage(id: string, data: Record<string, unknown>) {
  const result = await mutatePage(id, data);
  if ("error" in result && result.error) throw new Error(result.error);
  return result.page;
}

export async function deletePage(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  requireAdmin(user);

  const page = await db.page.findUnique({ where: { id } });
  if (!page) throw new Error("Page not found");
  if (page.slug === "home") throw new Error("The homepage cannot be deleted");

  await db.page.delete({ where: { id } });
  await logAudit({
    action: AUDIT_ACTIONS.PAGE_DELETED,
    actor: user,
    targetType: "page",
    targetId: id,
    meta: { slug: page.slug, title: page.title },
  });
  revalidatePath("/");
  revalidatePath(`/${page.slug}`);
  return page;
}

/** Duplicate a page: copies meta + sections as draft. */
export async function duplicatePage(id: string, opts?: { newSlug?: string; newTitle?: string }) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");

  const source = await db.page.findUnique({
    where: { id },
    include: { sections: true },
  });
  if (!source) throw new Error("Page not found");

  const desiredSlug = opts?.newSlug ?? `${source.slug}-copy`;
  const slugCheck = validateSlug(desiredSlug);
  if (!slugCheck.valid) throw new Error(slugCheck.error || "Invalid slug");
  const taken = await db.page.findFirst({ where: { slug: desiredSlug } });
  if (taken) throw new Error("Slug is already in use by another page");

  const copy = await db.page.create({
    data: {
      slug: desiredSlug,
      title: opts?.newTitle ?? `${source.title} (Copy)`,
      titleBn: source.titleBn,
      description: source.description,
      descriptionBn: source.descriptionBn,
      status: "draft",
      template: source.template,
      parentId: source.parentId,
      metaTitle: source.metaTitle,
      metaTitleBn: source.metaTitleBn,
      metaDescription: source.metaDescription,
      metaDescriptionBn: source.metaDescriptionBn,
      ogImage: source.ogImage,
      keywords: source.keywords,
      canonicalUrl: source.canonicalUrl,
      createdBy: auth.id,
      sections: {
        create: source.sections.map((s) => ({
          type: s.type,
          title: s.title,
          titleBn: s.titleBn,
          description: s.description,
          descriptionBn: s.descriptionBn,
          sortOrder: s.sortOrder,
          visible: s.visible,
          settings: s.settings,
          content: s.content,
          contentBn: s.contentBn,
        })),
      },
    },
    include: { sections: true },
  });

  await logAudit({
    action: AUDIT_ACTIONS.PAGE_DUPLICATED,
    actor: auth,
    targetType: "page",
    targetId: copy.id,
    meta: { fromId: id, fromSlug: source.slug, toSlug: copy.slug },
  });
  revalidatePath("/");
  revalidatePath(`/${copy.slug}`);
  return copy;
}

// ============================================================
// Page Sections CRUD
// ============================================================

export async function createSection(
  pageId: string,
  data: {
    type: string;
    title?: string;
    titleBn?: string;
    description?: string;
    descriptionBn?: string;
    settings?: string;
    content?: string;
    contentBn?: string;
    visible?: boolean;
  }
) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");

  const page = await db.page.findUnique({ where: { id: pageId }, select: { id: true, slug: true } });
  if (!page) throw new Error("Page not found");

  const { settings, content, contentBn } = {
    settings: data.settings === undefined ? "{}" : sanitizeSectionString(data.settings),
    content: data.content === undefined ? "{}" : sanitizeSectionString(data.content),
    contentBn: data.contentBn === undefined ? "{}" : sanitizeSectionString(data.contentBn),
  };

  const maxOrder = await db.pageSection.findFirst({
    where: { pageId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const section = await db.pageSection.create({
    data: {
      pageId,
      type: data.type,
      title: clampText(data.title, 200),
      titleBn: clampText(data.titleBn, 200),
      description: clampText(data.description, 500),
      descriptionBn: clampText(data.descriptionBn, 500),
      sortOrder: (maxOrder?.sortOrder ?? 0) + 1,
      visible: data.visible ?? true,
      settings,
      content,
      contentBn,
    },
    include: { page: true },
  });

  await logAudit({
    action: AUDIT_ACTIONS.SECTION_CREATED,
    actor: auth,
    targetType: "page",
    targetId: page.id,
    meta: { slug: page.slug, sectionId: section.id, type: section.type },
  });

  revalidatePath("/");
  if (section.page) revalidatePath(`/${section.page.slug}`);
  return section;
}

function sanitizeSectionString(raw: string): string {
  const res = serializeSectionJson(raw);
  if (!res.ok) throw new Error(res.error || "Invalid section data");
  return res.value as string;
}

export async function updateSection(id: string, data: Record<string, unknown>) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");

  const existing = await db.pageSection.findUnique({ where: { id }, include: { page: true } });
  if (!existing) throw new Error("Section not found");

  const writable: Record<string, unknown> = {};
  if (data.title !== undefined) writable.title = clampText(String(data.title), 200);
  if (data.titleBn !== undefined) writable.titleBn = clampText(String(data.titleBn), 200);
  if (data.description !== undefined) writable.description = clampText(String(data.description), 500);
  if (data.descriptionBn !== undefined) writable.descriptionBn = clampText(String(data.descriptionBn), 500);
  if (data.visible !== undefined) writable.visible = Boolean(data.visible);
  if (typeof data.content === "string") writable.content = sanitizeSectionString(data.content);
  if (typeof data.contentBn === "string") writable.contentBn = sanitizeSectionString(data.contentBn);
  if (typeof data.settings === "string") writable.settings = sanitizeSectionString(data.settings);

  const section = await db.pageSection.update({
    where: { id },
    data: writable,
    include: { page: true },
  });

  await logAudit({
    action: AUDIT_ACTIONS.SECTION_UPDATED,
    actor: auth,
    targetType: "page",
    targetId: section.page?.id ?? null,
    meta: { slug: section.page?.slug ?? null, sectionId: section.id, type: section.type },
  });

  revalidatePath("/");
  if (section.page) revalidatePath(`/${section.page.slug}`);
  return section;
}

export async function deleteSection(id: string) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");

  const section = await db.pageSection.delete({
    where: { id },
    include: { page: true },
  });

  await logAudit({
    action: AUDIT_ACTIONS.SECTION_DELETED,
    actor: auth,
    targetType: "page",
    targetId: section.page?.id ?? null,
    meta: { slug: section.page?.slug ?? null, sectionId: section.id, type: section.type },
  });

  revalidatePath("/");
  if (section.page) revalidatePath(`/${section.page.slug}`);
  return section;
}

export async function duplicateSection(id: string) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");

  const source = await db.pageSection.findUnique({ where: { id }, include: { page: true } });
  if (!source) throw new Error("Section not found");

  const maxOrder = await db.pageSection.findFirst({
    where: { pageId: source.pageId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const section = await db.pageSection.create({
    data: {
      pageId: source.pageId,
      type: source.type,
      title: source.title,
      titleBn: source.titleBn,
      description: source.description,
      descriptionBn: source.descriptionBn,
      sortOrder: (maxOrder?.sortOrder ?? 0) + 1,
      visible: source.visible,
      settings: source.settings,
      content: source.content,
      contentBn: source.contentBn,
    },
    include: { page: true },
  });

  await logAudit({
    action: AUDIT_ACTIONS.SECTION_CREATED,
    actor: auth,
    targetType: "page",
    targetId: source.pageId,
    meta: {
      slug: source.page?.slug ?? null,
      sectionId: section.id,
      type: section.type,
      duplicatedFrom: source.id,
    },
  });

  revalidatePath("/");
  if (section.page) revalidatePath(`/${section.page.slug}`);
  return section;
}

export async function reorderSections(pageId: string, sectionIds: string[]) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");

  // Only sections that actually belong to the given page may be reordered.
  const owned = await db.pageSection.findMany({
    where: { pageId, id: { in: sectionIds.slice(0, 200) } },
    select: { id: true, sortOrder: true },
  });
  const ownedIds = new Set(owned.map((s) => s.id));
  const validIds = Array.from(ownedIds);
  if (validIds.length === 0) throw new Error("No valid sections to reorder");

  await db.$transaction(
    validIds.map((id, i) =>
      db.pageSection.update({ where: { id }, data: { sortOrder: i } })
    )
  );

  const page = await db.page.findUnique({ where: { id: pageId }, select: { slug: true } });
  await logAudit({
    action: AUDIT_ACTIONS.SECTION_REORDERED,
    actor: auth,
    targetType: "page",
    targetId: pageId,
    meta: { slug: page?.slug ?? null, count: sectionIds.length },
  });
  revalidatePath("/");
  if (page) revalidatePath(`/${page.slug}`);
}

// ============================================================
// Page Revisions (snapshot / list / restore)
// ============================================================

export async function savePageRevision(pageId: string, label?: string) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");

  const page = await db.page.findUnique({ where: { id: pageId } });
  if (!page) throw new Error("Page not found");
  const sections = await db.pageSection.findMany({
    where: { pageId },
    orderBy: { sortOrder: "asc" },
  });

  const pageSnapshot: Record<string, unknown> = {
    slug: page.slug,
  };
  for (const field of PAGE_MUTABLE_FIELDS) {
    pageSnapshot[field] = (page as unknown as Record<string, unknown>)[field] ?? null;
  }

  const revision = await db.pageRevision.create({
    data: {
      pageId,
      label: clampText(label ?? "", 120),
      pageSnapshot: toJson(pageSnapshot),
      sectionsSnapshot: toJson(
        sections.map((s) => ({
          type: s.type,
          title: s.title,
          titleBn: s.titleBn,
          description: s.description,
          descriptionBn: s.descriptionBn,
          sortOrder: s.sortOrder,
          visible: s.visible,
          settings: s.settings,
          content: s.content,
          contentBn: s.contentBn,
        }))
      ),
      createdBy: auth.id,
    },
  });

  await logAudit({
    action: AUDIT_ACTIONS.PAGE_REVISION_SAVED,
    actor: auth,
    targetType: "page",
    targetId: pageId,
    meta: { slug: page.slug, revisionId: revision.id, label: revision.label, sections: sections.length },
  });
  return revision;
}

export async function getPageRevisions(pageId: string) {
  requireAuth(await getCurrentUser(), "viewer");

  const rows = await db.pageRevision.findMany({
    where: { pageId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const creatorIds = [...new Set(rows.map((r) => r.createdBy).filter((v): v is string => Boolean(v)))];
  const creators = creatorIds.length
    ? await db.user.findMany({ where: { id: { in: creatorIds } }, select: { id: true, name: true } })
    : [];
  const creatorNames = new Map(creators.map((c) => [c.id, c.name]));

  return rows.map((r) => {
    let sectionsCount = 0;
    try {
      const parsed = JSON.parse(r.sectionsSnapshot);
      if (Array.isArray(parsed)) sectionsCount = parsed.length;
    } catch { /* ignore */ }
    return {
      id: r.id,
      label: r.label,
      createdAt: r.createdAt,
      sectionsCount,
      createdBy: r.createdBy,
      createdByName: r.createdBy ? creatorNames.get(r.createdBy) ?? null : null,
      status: (safeParse(r.pageSnapshot) as Record<string, unknown>).status ?? null,
    };
  });
}

export async function restorePageRevision(revisionId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  requireAdmin(user);

  const revision = await db.pageRevision.findUnique({ where: { id: revisionId } });
  if (!revision) throw new Error("Revision not found");

  const pageSnapshot = safeParse(revision.pageSnapshot);
  const sectionsSnapshot = JSON.parse(revision.sectionsSnapshot || "[]") as Array<Record<string, unknown>>;

  // Snapshot the CURRENT state before overwriting (undo-able).
  await savePageRevision(revision.pageId, "auto: before restore");

  await db.$transaction(async (tx) => {
    const pageData: Record<string, unknown> = {};
    for (const field of PAGE_MUTABLE_FIELDS) {
      const value = pageSnapshot[field];
      if (value !== undefined && value !== null) {
        pageData[field] = value;
      }
    }
    if (typeof pageSnapshot.slug === "string") {
      // Restoring the historical slug is allowed only if free or unchanged.
      const current = await tx.page.findUnique({ where: { id: revision.pageId }, select: { slug: true } });
      if (current && pageSnapshot.slug !== current.slug) {
        const slugCheck = validateSlug(pageSnapshot.slug);
        if (slugCheck.valid) {
          const taken = await tx.page.findFirst({ where: { slug: pageSnapshot.slug, NOT: { id: revision.pageId } } });
          if (!taken) pageData.slug = pageSnapshot.slug;
        }
      }
    }
    if (Object.keys(pageData).length > 0) {
      await tx.page.update({ where: { id: revision.pageId }, data: pageData });
    }

    await tx.pageSection.deleteMany({ where: { pageId: revision.pageId } });
    if (Array.isArray(sectionsSnapshot) && sectionsSnapshot.length > 0) {
      await tx.pageSection.createMany({
        data: sectionsSnapshot.map((s, i) => ({
          pageId: revision.pageId,
          type: String(s.type ?? "text"),
          title: typeof s.title === "string" ? s.title : "",
          titleBn: typeof s.titleBn === "string" ? s.titleBn : "",
          description: typeof s.description === "string" ? s.description : "",
          descriptionBn: typeof s.descriptionBn === "string" ? s.descriptionBn : "",
          sortOrder: typeof s.sortOrder === "number" ? s.sortOrder : i,
          visible: s.visible !== false,
          settings: typeof s.settings === "string" ? s.settings : "{}",
          content: typeof s.content === "string" ? s.content : "{}",
          contentBn: typeof s.contentBn === "string" ? s.contentBn : "{}",
        })),
      });
    }
  });

  await logAudit({
    action: AUDIT_ACTIONS.PAGE_REVISION_RESTORED,
    actor: user,
    targetType: "page",
    targetId: revision.pageId,
    meta: { revisionId, label: revision.label },
  });

  const page = await db.page.findUnique({ where: { id: revision.pageId }, select: { slug: true } });
  revalidatePath("/");
  if (page) revalidatePath(`/${page.slug}`);
  return { success: true };
}

// ============================================================
// Site Settings
// ============================================================

export async function getSiteSettings(group?: string) {
  requireAuth(await getCurrentUser(), "viewer");
  const where = group ? { group } : {};
  return db.siteSetting.findMany({ where, orderBy: { sortOrder: "asc" } });
}

export async function getSiteSetting(key: string) {
  requireAuth(await getCurrentUser(), "viewer");
  return db.siteSetting.findUnique({ where: { key } });
}

export async function upsertSiteSetting(
  key: string,
  data: {
    value: string;
    valueBn?: string;
    type?: string;
    group?: string;
    label?: string;
    labelBn?: string;
    sortOrder?: number;
  }
) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");

  if (typeof key !== "string" || !/^[a-z0-9_]{1,60}$/.test(key)) {
    throw new Error("Invalid setting key");
  }

  const setting = await db.siteSetting.upsert({
    where: { key },
    update: data,
    create: { key, ...data },
  });

  await logAudit({
    action: AUDIT_ACTIONS.SETTING_SAVED,
    actor: auth,
    targetType: "setting",
    targetId: setting.id,
    meta: { key: setting.key, group: setting.group },
  });

  revalidatePath("/", "layout");
  return setting;
}

export async function updateSiteSettingsBulk(
  settings: {
    key: string;
    value: string;
    valueBn?: string;
    type?: string;
    group?: string;
    label?: string;
    labelBn?: string;
  }[]
) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");

  const keys = settings.map((s) => s.key);
  if (keys.some((k) => typeof k !== "string" || !/^[a-z0-9_]{1,60}$/.test(k))) {
    throw new Error("Invalid setting key");
  }

  await Promise.all(
    settings.map((s) =>
      db.siteSetting.upsert({
        where: { key: s.key },
        update: {
          value: s.value,
          valueBn: s.valueBn,
          type: s.type,
          group: s.group,
          label: s.label,
          labelBn: s.labelBn,
        },
        create: {
          key: s.key,
          value: s.value,
          valueBn: s.valueBn,
          type: s.type,
          group: s.group,
          label: s.label,
          labelBn: s.labelBn,
        },
      })
    )
  );

  if (settings.length > 0) {
    await logAudit({
      action: AUDIT_ACTIONS.SETTING_SAVED,
      actor: auth,
      targetType: "setting",
      meta: { keys: keys.slice(0, 25), count: keys.length },
    });
  }

  revalidatePath("/", "layout");
  return { success: true };
}

// ============================================================
// Menu Items
// ============================================================

export async function getMenuItems(location: string) {
  requireAuth(await getCurrentUser(), "viewer");
  return db.menuItem.findMany({
    where: { location, visible: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getAllMenuItems(location: string) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");
  return db.menuItem.findMany({
    where: { location },
    orderBy: { sortOrder: "asc" },
  });
}

const MENU_LOCATIONS = new Set(["header", "footer"]);

async function validatedMenuData(data: {
  label?: string;
  labelBn?: string;
  url?: string;
  parentId?: string | null;
}) {
  const clean: Record<string, unknown> = {};
  if (data.label !== undefined) clean.label = clampText(data.label, 60);
  if (data.labelBn !== undefined) clean.labelBn = clampText(data.labelBn, 60);
  if (data.url !== undefined) {
    const check = sanitizeUrl(data.url);
    if (!check.ok) throw new Error(`Menu URL rejected: ${check.error}`);
    clean.url = check.url ?? "";
  }
  if (data.parentId !== undefined) clean.parentId = data.parentId || null;
  return clean;
}

export async function createMenuItem(data: {
  location: string;
  label: string;
  labelBn?: string;
  url: string;
  sortOrder?: number;
  visible?: boolean;
  target?: string;
  parentId?: string | null;
}) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");

  if (!MENU_LOCATIONS.has(data.location)) throw new Error("Invalid menu location");
  const clean = await validatedMenuData(data);

  const maxOrder = await db.menuItem.findFirst({
    where: { location: data.location },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const item = await db.menuItem.create({
    data: {
      ...data,
      ...clean,
      sortOrder: data.sortOrder ?? (maxOrder?.sortOrder ?? 0) + 1,
    },
  });

  await logAudit({
    action: AUDIT_ACTIONS.MENU_CREATED,
    actor: auth,
    targetType: "menu",
    targetId: item.id,
    meta: { location: item.location, label: item.label, url: item.url },
  });

  revalidatePath("/", "layout");
  return item;
}

export async function updateMenuItem(id: string, data: Record<string, unknown>) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");

  const clean = await validatedMenuData({
    label: typeof data.label === "string" ? data.label : undefined,
    labelBn: typeof data.labelBn === "string" ? data.labelBn : undefined,
    url: typeof data.url === "string" ? data.url : undefined,
    parentId: data.parentId as string | null | undefined,
  } as { label?: string; labelBn?: string; url?: string; parentId?: string | null });

  const extra: Record<string, unknown> = {};
  if (data.location !== undefined) {
    if (!MENU_LOCATIONS.has(String(data.location))) throw new Error("Invalid menu location");
    extra.location = data.location;
  }
  if (data.visible !== undefined) extra.visible = Boolean(data.visible);
  if (data.target !== undefined) {
    const t = String(data.target);
    if (t !== "_self" && t !== "_blank") throw new Error("Invalid target");
    extra.target = t;
  }
  if (data.sortOrder !== undefined && typeof data.sortOrder === "number") {
    extra.sortOrder = data.sortOrder;
  }

  const item = await db.menuItem.update({ where: { id }, data: { ...extra, ...clean } });
  await logAudit({
    action: AUDIT_ACTIONS.MENU_UPDATED,
    actor: auth,
    targetType: "menu",
    targetId: item.id,
    meta: { location: item.location, label: item.label, url: item.url, visible: item.visible },
  });
  revalidatePath("/", "layout");
  return item;
}

export async function deleteMenuItem(id: string) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");

  // Detach children first so the menu tree does not orphan.
  await db.menuItem.updateMany({ where: { parentId: id }, data: { parentId: null } });
  const item = await db.menuItem.delete({ where: { id } });

  await logAudit({
    action: AUDIT_ACTIONS.MENU_DELETED,
    actor: auth,
    targetType: "menu",
    targetId: id,
    meta: { location: item.location, label: item.label },
  });
  revalidatePath("/", "layout");
  return item;
}

export async function reorderMenuItems(location: string, itemIds: string[]) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");

  await db.$transaction(
    itemIds.map((id, i) => db.menuItem.update({ where: { id }, data: { sortOrder: i } }))
  );

  await logAudit({
    action: AUDIT_ACTIONS.MENU_REORDERED,
    actor: auth,
    targetType: "menu",
    meta: { location, count: itemIds.length },
  });
  revalidatePath("/", "layout");
  return { success: true };
}

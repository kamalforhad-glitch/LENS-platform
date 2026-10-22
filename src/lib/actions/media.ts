"use server";

// ============================================================
// Media library actions — reference scans, safe deletion, metadata.
// The reference scan prevents deleting a file that is still in use
// anywhere on the site (content tables, CMS sections, settings, menus).
// ============================================================

import { db } from "@/lib/db";
import { getCurrentUser, requireAuth, requireEditor } from "@/lib/auth";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";
import { deleteFromStorage } from "@/lib/storage";

export interface MediaReference {
  source: string;
  label: string;
  id: string;
  field: string;
}

function pushKeep(
  refs: MediaReference[],
  source: string,
  label: string | null,
  id: string,
  fields: Array<[string, unknown]>
) {
  // A field counts as a hit when it holds a non-empty string value, or when
  // the caller passes `true` to mark a substring-level match (JSON columns
  // and settings rows are matched by `contains` on the whole payload, so the
  // exact field is identified by the caller rather than the row value).
  const hits = fields
    .filter(([, v]) => (typeof v === "string" ? !!v : v === true))
    .map(([f]) => f);
  if (hits.length > 0) refs.push({ source, label: label ?? "", id, field: hits.join(", ") });
}

/**
 * Find every place a media file is referenced. Scans the URL-ish columns
 * of all content-bearing tables plus JSON section payloads and settings.
 * Every scan is caught independently — partial results are still returned.
 */
export async function getMediaReferences(id: string): Promise<MediaReference[]> {
  requireAuth(await getCurrentUser(), "viewer");

  const file = await db.mediaFile.findUnique({ where: { id } });
  if (!file) throw new Error("File not found");

  const refs: MediaReference[] = [];

  try {
    const rows = await db.researchArticle.findMany({
      where: { OR: [{ image: { contains: file.filename } }, { pdfUrl: { contains: file.filename } }] },
      select: { id: true, title: true, image: true, pdfUrl: true },
      take: 25,
    });
    for (const r of rows) pushKeep(refs, "research", r.title, r.id, [["image", r.image], ["pdfUrl", r.pdfUrl]]);
  } catch { /* best-effort */ }

  try {
    const rows = await db.publication.findMany({
      where: { pdfUrl: { contains: file.filename } },
      select: { id: true, title: true, pdfUrl: true },
      take: 25,
    });
    for (const r of rows) pushKeep(refs, "publications", r.title, r.id, [["pdfUrl", r.pdfUrl]]);
  } catch { /* best-effort */ }

  try {
    const rows = await db.teamMember.findMany({
      where: { image: { contains: file.filename } },
      select: { id: true, name: true, image: true },
      take: 25,
    });
    for (const r of rows) pushKeep(refs, "team", r.name, r.id, [["image", r.image]]);
  } catch { /* best-effort */ }

  try {
    const rows = await db.authorProfile.findMany({
      where: { image: { contains: file.filename } },
      select: { id: true, name: true, image: true },
      take: 25,
    });
    for (const r of rows) pushKeep(refs, "authors", r.name, r.id, [["image", r.image]]);
  } catch { /* best-effort */ }

  try {
    const rows = await db.researcherProfile.findMany({
      where: { image: { contains: file.filename } },
      select: { id: true, name: true, image: true },
      take: 25,
    });
    for (const r of rows) pushKeep(refs, "researchers", r.name, r.id, [["image", r.image]]);
  } catch { /* best-effort */ }

  try {
    const rows = await db.program.findMany({
      where: { image: { contains: file.filename } },
      select: { id: true, title: true, image: true },
      take: 25,
    });
    for (const r of rows) pushKeep(refs, "programs", r.title, r.id, [["image", r.image]]);
  } catch { /* best-effort */ }

  try {
    const rows = await db.blogPost.findMany({
      where: { image: { contains: file.filename } },
      select: { id: true, title: true, image: true },
      take: 25,
    });
    for (const r of rows) pushKeep(refs, "blog", r.title, r.id, [["image", r.image]]);
  } catch { /* best-effort */ }

  try {
    const rows = await db.mediaItem.findMany({
      where: { OR: [{ image: { contains: file.filename } }, { sourceUrl: { contains: file.filename } }] },
      select: { id: true, title: true, image: true, sourceUrl: true },
      take: 25,
    });
    for (const r of rows) pushKeep(refs, "media items", r.title, r.id, [["image", r.image], ["sourceUrl", r.sourceUrl]]);
  } catch { /* best-effort */ }

  try {
    const rows = await db.resource.findMany({
      where: { OR: [{ image: { contains: file.filename } }, { fileUrl: { contains: file.filename } }] },
      select: { id: true, title: true, image: true, fileUrl: true },
      take: 25,
    });
    for (const r of rows) pushKeep(refs, "resources", r.title, r.id, [["image", r.image], ["fileUrl", r.fileUrl]]);
  } catch { /* best-effort */ }

  try {
    const rows = await db.page.findMany({
      where: { ogImage: { contains: file.filename } },
      select: { id: true, slug: true, title: true, ogImage: true },
      take: 25,
    });
    for (const r of rows) pushKeep(refs, "pages", `${r.title} (/${r.slug})`, r.id, [["ogImage", r.ogImage]]);
  } catch { /* best-effort */ }

  try {
    const sections = await db.pageSection.findMany({
      where: {
        OR: [
          { content: { contains: file.filename } },
          { contentBn: { contains: file.filename } },
          { settings: { contains: file.filename } },
        ],
      },
      select: { id: true, title: true, type: true, pageId: true },
      take: 25,
    });
    for (const s of sections)
      pushKeep(refs, "page sections", `${s.title || s.type} (page ${s.pageId})`, s.id, [
        ["content", true], ["settings", true],
      ]);
  } catch { /* best-effort */ }

  try {
    const settings = await db.siteSetting.findMany({
      where: { value: { contains: file.filename } },
      select: { id: true, key: true },
      take: 25,
    });
    for (const s of settings) pushKeep(refs, "site settings", s.key, s.id, [["value", true]]);
  } catch { /* best-effort */ }

  try {
    const menus = await db.menuItem.findMany({
      where: { url: { contains: file.filename } },
      select: { id: true, label: true },
      take: 25,
    });
    for (const m of menus) pushKeep(refs, "menus", m.label, m.id, [["url", true]]);
  } catch { /* best-effort */ }

  return refs;
}

/** Update editorial metadata of a media file (bilingual). */
export async function updateMediaFile(
  id: string,
  data: {
    title?: string;
    titleBn?: string;
    description?: string;
    descriptionBn?: string;
    alt?: string;
    altBn?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const auth = requireEditor(user);

  const existing = await db.mediaFile.findUnique({ where: { id } });
  if (!existing) {
    // Returned rather than thrown — Next.js redacts Server Action throws
    // across the RSC boundary (client would only see React #441).
    return { success: false, error: "File not found" };
  }

  const writable: Record<string, unknown> = {};
  if (typeof data.title === "string") writable.title = data.title.slice(0, 200);
  if (typeof data.titleBn === "string") writable.titleBn = data.titleBn.slice(0, 200);
  if (typeof data.description === "string") writable.description = data.description.slice(0, 1000);
  if (typeof data.descriptionBn === "string") writable.descriptionBn = data.descriptionBn.slice(0, 1000);
  if (typeof data.alt === "string") writable.alt = data.alt.slice(0, 300);
  if (typeof data.altBn === "string") writable.altBn = data.altBn.slice(0, 300);

  const updated = await db.mediaFile.update({ where: { id }, data: writable });

  await logAudit({
    action: AUDIT_ACTIONS.MEDIA_UPDATED,
    actor: auth,
    targetType: "media_file",
    targetId: id,
    meta: { filename: existing.originalName, fields: Object.keys(writable).join(",") },
  });

  return { success: true };
}

/**
 * Safe delete: refuses when the file is referenced anywhere in the site.
 * Goes through the same scan the UI displays.
 * NOTE: the "blocked" case is RETURNED, not thrown — Next.js redacts thrown
 * Server Action errors across the RSC boundary (the client would only see
 * React #441), so expected failures must travel as values.
 */
export async function deleteMediaFile(
  id: string
): Promise<{ success: boolean; blocked?: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const auth = requireEditor(user);

  const existing = await db.mediaFile.findUnique({ where: { id } });
  if (!existing) throw new Error("File not found");

  const refs = await getMediaReferences(id);
  if (refs.length > 0) {
    const summary = refs.slice(0, 6).map((r) => `${r.source}: ${r.label || r.id}`).join("; ");
    try {
      await logAudit({
        action: AUDIT_ACTIONS.MEDIA_DELETED_BLOCKED,
        actor: auth,
        targetType: "media_file",
        targetId: id,
        meta: { filename: existing.originalName, references: refs.length },
      });
    } catch { /* best-effort audit */ }
    return {
      success: false,
      blocked: true,
      error: `This file is still referenced in ${refs.length} place${refs.length === 1 ? "" : "s"} (${summary}${refs.length > 6 ? "; …" : ""}). Remove those references first.`,
    };
  }

  // Delete underlying storage object (Cloudflare R2 or local disk)
  try {
    await deleteFromStorage(existing.filename);
  } catch (storageErr) {
    console.error("[Storage Delete Error]", storageErr);
  }

  await db.mediaFile.delete({ where: { id } });

  await logAudit({
    action: AUDIT_ACTIONS.MEDIA_DELETED,
    actor: auth,
    targetType: "media_file",
    targetId: id,
    meta: { filename: existing.originalName, url: existing.url },
  });

  return { success: true };
}

/** Paginated library listing (searchable). */
export async function getMediaLibrary(
  page: number = 1,
  limit: number = 24,
  search?: string
) {
  requireAuth(await getCurrentUser(), "viewer");

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { filename: { contains: search, mode: "insensitive" } },
      { originalName: { contains: search, mode: "insensitive" } },
      { title: { contains: search, mode: "insensitive" } },
      { alt: { contains: search, mode: "insensitive" } },
    ];
  }

  const [total, items] = await Promise.all([
    db.mediaFile.count({ where }),
    db.mediaFile.findMany({
      where,
      orderBy: { dateCreated: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { items, total, page, limit, pages: Math.ceil(total / limit) };
}

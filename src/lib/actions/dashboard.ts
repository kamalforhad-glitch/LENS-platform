"use server";

import { db } from "@/lib/db";
import { getCurrentUser, requireAuth, requireEditor } from "@/lib/auth";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";
import type { DashboardStats, PaginatedResult, AdminMediaFile } from "@/lib/admin-types";

export async function getDashboardStats(): Promise<DashboardStats> {
  requireAuth(await getCurrentUser(), "viewer");

  // The fourteen independent count() queries below previously ran in parallel
  // (Promise.all), which still opens fourteen database connections per dashboard
  // load. Combine them into a single aggregated query so every dashboard metric
  // is fetched in one round trip. No metric definition changes and no count is
  // omitted; a query failure propagates (it is never turned into an empty
  // success response).
  interface CountRow {
    research: number;
    published_research: number;
    draft_research: number;
    publications: number;
    events: number;
    upcoming_events: number;
    team: number;
    media: number;
    downloads: number;
    pending_reviews: number;
    total_authors: number;
    cms_pages: number;
    published_cms_pages: number;
    media_files: number;
  }

  const rows = (await db.$queryRawUnsafe(`
    SELECT
      (SELECT count(*) FROM "research_articles") AS research,
      (SELECT count(*) FROM "research_articles" WHERE "status" = 'published') AS published_research,
      (SELECT count(*) FROM "research_articles" WHERE "status" = 'draft') AS draft_research,
      (SELECT count(*) FROM "publications") AS publications,
      (SELECT count(*) FROM "events") AS events,
      (SELECT count(*) FROM "events" WHERE "start_date" >= NOW() AND "status" = 'published') AS upcoming_events,
      (SELECT count(*) FROM "team_members") AS team,
      (SELECT count(*) FROM "media_items") AS media,
      (SELECT count(*) FROM "download_logs") AS downloads,
      (SELECT count(*) FROM "review_assignments" WHERE "status" IN ('pending', 'in_progress')) AS pending_reviews,
      (SELECT count(*) FROM "author_profiles") AS total_authors,
      (SELECT count(*) FROM "pages") AS cms_pages,
      (SELECT count(*) FROM "pages" WHERE "status" = 'published') AS published_cms_pages,
      (SELECT count(*) FROM "media_files") AS media_files
  `)) as unknown as CountRow[];

  const r = rows[0];

  return {
    totalResearch: Number(r?.research ?? 0),
    publishedResearch: Number(r?.published_research ?? 0),
    draftResearch: Number(r?.draft_research ?? 0),
    totalPublications: Number(r?.publications ?? 0),
    totalEvents: Number(r?.events ?? 0),
    upcomingEvents: Number(r?.upcoming_events ?? 0),
    totalTeam: Number(r?.team ?? 0),
    totalMedia: Number(r?.media ?? 0),
    totalDownloads: Number(r?.downloads ?? 0),
    pendingReviews: Number(r?.pending_reviews ?? 0),
    totalAuthors: Number(r?.total_authors ?? 0),
    totalCmsPages: Number(r?.cms_pages ?? 0),
    publishedCmsPages: Number(r?.published_cms_pages ?? 0),
    totalMediaFiles: Number(r?.media_files ?? 0),
  };
}

/** Latest audit entries for the dashboard activity panel. */
export async function getAuditFeed(limit: number = 12) {
  requireAuth(await getCurrentUser(), "viewer");

  const entries = await db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: Math.min(50, Math.max(1, limit)),
    select: {
      id: true,
      action: true,
      actorEmail: true,
      actorRole: true,
      targetType: true,
      targetId: true,
      meta: true,
      createdAt: true,
    },
  });
  return entries.map((e) => ({
    ...e,
    meta: typeof e.meta === "string" ? (safeParseMeta(e.meta)) : null,
  }));

  function safeParseMeta(raw: string): Record<string, unknown> | null {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
}

export async function getMediaFiles(
  page: number = 1,
  limit: number = 20,
  search?: string
): Promise<PaginatedResult<AdminMediaFile>> {
  requireAuth(await getCurrentUser(), "viewer");

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { filename: { contains: search, mode: "insensitive" } },
      { originalName: { contains: search, mode: "insensitive" } },
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

export async function logMediaUpload(
  filename: string,
  originalName: string,
  mimeType: string,
  size: number,
  url: string,
  alt?: string,
  extra?: { width?: number; height?: number }
) {
  const editor = requireEditor(await getCurrentUser());

  const file = await db.mediaFile.create({
    data: {
      filename,
      originalName,
      mimeType,
      size,
      url,
      alt: alt || "",
      width: extra?.width,
      height: extra?.height,
      uploadedBy: editor.id,
    },
  });

  await logAudit({
    action: AUDIT_ACTIONS.MEDIA_UPLOADED,
    actor: editor,
    targetType: "media_file",
    targetId: file.id,
    meta: {
      filename: originalName,
      mimeType,
      size,
      storage: process.env.R2_MEDIA_ACCESS_KEY_ID ? "r2" : "local",
    },
  });

  return { id: file.id, url: file.url };
}

/** Safe delete — delegates to the reference-checked library action. */
export async function deleteMediaFile(id: string) {
  const { deleteMediaFile: safeDelete } = await import("./media");
  return safeDelete(id);
}

export async function getRecentActivity() {
  requireAuth(await getCurrentUser(), "viewer");

  const [research, publications, events] = await Promise.all([
    db.researchArticle.findMany({
      select: { id: true, title: true, status: true, dateCreated: true, dateModified: true },
      orderBy: { dateModified: "desc" },
      take: 5,
    }),
    db.publication.findMany({
      select: { id: true, title: true, status: true, dateCreated: true, dateModified: true },
      orderBy: { dateModified: "desc" },
      take: 5,
    }),
    db.event.findMany({
      select: { id: true, name: true, status: true, dateCreated: true, dateModified: true },
      orderBy: { dateModified: "desc" },
      take: 5,
    }),
  ]);

  return { research, publications, events };
}

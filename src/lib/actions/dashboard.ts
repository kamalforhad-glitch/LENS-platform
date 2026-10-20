"use server";

import { db } from "@/lib/db";
import { getCurrentUser, requireAuth, requireEditor } from "@/lib/auth";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";
import type { DashboardStats, PaginatedResult, AdminMediaFile } from "@/lib/admin-types";

export async function getDashboardStats(): Promise<DashboardStats> {
  requireAuth(await getCurrentUser(), "viewer");

  const [
    research,
    publishedResearch,
    draftResearch,
    publications,
    events,
    upcomingEvents,
    team,
    media,
    downloads,
    pendingReviews,
    totalAuthors,
    cmsPages,
    publishedCmsPages,
    mediaFiles,
  ] = await Promise.all([
    db.researchArticle.count(),
    db.researchArticle.count({ where: { status: "published" } }),
    db.researchArticle.count({ where: { status: "draft" } }),
    db.publication.count(),
    db.event.count(),
    db.event.count({ where: { startDate: { gte: new Date() }, status: "published" } }),
    db.teamMember.count(),
    db.mediaItem.count(),
    db.downloadLog.count(),
    db.reviewAssignment.count({ where: { status: { in: ["pending", "in_progress"] } } }),
    db.authorProfile.count(),
    db.page.count(),
    db.page.count({ where: { status: "published" } }),
    db.mediaFile.count(),
  ]);

  return {
    totalResearch: research,
    publishedResearch,
    draftResearch,
    totalPublications: publications,
    totalEvents: events,
    upcomingEvents,
    totalTeam: team,
    totalMedia: media,
    totalDownloads: downloads,
    pendingReviews,
    totalAuthors,
    totalCmsPages: cmsPages,
    publishedCmsPages,
    totalMediaFiles: mediaFiles,
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
      storage: process.env.S3_ACCESS_KEY_ID ? "s3" : "local",
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

"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type { DashboardStats, PaginatedResult, AdminMediaFile } from "@/lib/admin-types";

export async function getDashboardStats(): Promise<DashboardStats> {
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
  ] = await Promise.all([
    db.researchArticle.count(),
    db.researchArticle.count({ where: { status: "published" } }),
    db.researchArticle.count({ where: { status: "draft" } }),
    db.publication.count(),
    db.event.count(),
    db.event.count({ where: { startDate: { gte: new Date() }, status: "published" } }),
    db.teamMember.count(),
    db.mediaFile.count(),
    db.downloadLog.count(),
    db.reviewAssignment.count({ where: { status: { in: ["pending", "in_progress"] } } }),
    db.authorProfile.count(),
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
  };
}

export async function getMediaFiles(
  page: number = 1,
  limit: number = 20,
  search?: string
): Promise<PaginatedResult<AdminMediaFile>> {
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
  alt?: string
) {
  const user = await getCurrentUser();

  const file = await db.mediaFile.create({
    data: {
      filename,
      originalName,
      mimeType,
      size,
      url,
      alt: alt || "",
      uploadedBy: user?.id || null,
    },
  });

  return { id: file.id, url: file.url };
}

export async function deleteMediaFile(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  await db.mediaFile.delete({ where: { id } });
  return { success: true };
}

export async function getRecentActivity() {
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

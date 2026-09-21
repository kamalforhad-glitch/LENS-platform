"use server";

import { db, slugify } from "@/lib/db";
import { getCurrentUser, requireAuth } from "@/lib/auth";
import type { PaginatedResult, ContentStatus, ReviewStatus, AdminResearchArticle } from "@/lib/admin-types";

// ============================================================
// Research Articles — Server Actions
// ============================================================

export async function getResearchArticles(
  page: number = 1,
  limit: number = 20,
  filters: { status?: string; category?: string; search?: string; reviewStatus?: string } = {}
): Promise<PaginatedResult<AdminResearchArticle>> {
  const where: Record<string, unknown> = {};

  if (filters.status && filters.status !== "all") {
    where.status = filters.status;
  }
  if (filters.category && filters.category !== "all") {
    where.category = filters.category;
  }
  if (filters.reviewStatus && filters.reviewStatus !== "all") {
    where.reviewStatus = filters.reviewStatus;
  }
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
      { tags: { contains: filters.search, mode: "insensitive" } },
      { doi: { contains: filters.search, mode: "insensitive" } },
      { author: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const [total, items] = await Promise.all([
    db.researchArticle.count({ where }),
    db.researchArticle.findMany({
      where,
      orderBy: { dateCreated: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { items: items as AdminResearchArticle[], total, page, limit, pages: Math.ceil(total / limit) };
}

export async function getResearchArticle(idOrSlug: string): Promise<AdminResearchArticle | null> {
  const item = await db.researchArticle.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    include: {
      versions: { orderBy: { version: "desc" }, take: 10 },
      reviewAssignments: {
        include: {
          reviewer: { select: { id: true, name: true, email: true } },
          _count: { select: { comments: true } },
        },
      },
      citationRecords: true,
      authorProfileLinks: {
        include: { authorProfile: true },
        orderBy: { authorOrder: "asc" },
      },
    },
  });
  return (item as AdminResearchArticle) || null;
}

export async function createResearchArticle(data: {
  title: string;
  description: string;
  content?: string;
  category?: string;
  author?: string;
  tags?: string[];
  image?: string;
  pdf_url?: string;
  status?: ContentStatus;
  featured?: boolean;
  abstract?: string;
  methodology?: string;
  doi?: string;
  submitterName?: string;
  submitterEmail?: string;
  submitterAffiliation?: string;
}) {
  const user = await getCurrentUser();
  requireAuth(user, "editor");

  const id = crypto.randomUUID();
  let slug = slugify(data.title);

  const existing = await db.researchArticle.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${id.slice(0, 8)}`;

  await db.researchArticle.create({
    data: {
      id,
      slug,
      title: data.title,
      description: data.description,
      content: data.content || "",
      category: data.category || "Research Report",
      author: data.author || "LENS Research Team",
      tags: JSON.stringify(data.tags || []),
      image: data.image || null,
      pdfUrl: data.pdf_url || null,
      status: data.status || "draft",
      featured: data.featured || false,
      abstract: data.abstract || "",
      methodology: data.methodology || "",
      doi: data.doi || null,
      submitterName: data.submitterName || null,
      submitterEmail: data.submitterEmail || null,
      submitterAffiliation: data.submitterAffiliation || null,
      createdBy: user!.id,
    },
  });

  return { id, slug };
}

export async function updateResearchArticle(
  id: string,
  data: Partial<{
    title: string;
    description: string;
    content: string;
    category: string;
    author: string;
    tags: string[];
    image: string;
    pdf_url: string;
    status: ContentStatus;
    featured: boolean;
    abstract: string;
    methodology: string;
    doi: string;
    submitterName: string;
    submitterEmail: string;
    submitterAffiliation: string;
    reviewStatus: ReviewStatus;
  }>
) {
  const user = await getCurrentUser();
  requireAuth(user, "editor");

  const updateData: Record<string, unknown> = {};

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.content !== undefined) updateData.content = data.content;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.author !== undefined) updateData.author = data.author;
  if (data.tags !== undefined) updateData.tags = JSON.stringify(data.tags);
  if (data.image !== undefined) updateData.image = data.image;
  if (data.pdf_url !== undefined) updateData.pdfUrl = data.pdf_url;
  if (data.status !== undefined) {
    updateData.status = data.status;
    if (data.status === "published") updateData.datePublished = new Date();
  }
  if (data.featured !== undefined) updateData.featured = data.featured;
  if (data.abstract !== undefined) updateData.abstract = data.abstract;
  if (data.methodology !== undefined) updateData.methodology = data.methodology;
  if (data.doi !== undefined) updateData.doi = data.doi;
  if (data.submitterName !== undefined) updateData.submitterName = data.submitterName;
  if (data.submitterEmail !== undefined) updateData.submitterEmail = data.submitterEmail;
  if (data.submitterAffiliation !== undefined) updateData.submitterAffiliation = data.submitterAffiliation;
  if (data.reviewStatus !== undefined) updateData.reviewStatus = data.reviewStatus;

  await db.researchArticle.update({ where: { id }, data: updateData });

  return { success: true };
}

export async function deleteResearchArticle(id: string) {
  const user = await getCurrentUser();
  requireAuth(user, "admin");
  await db.researchArticle.delete({ where: { id } });
  return { success: true };
}

export async function publishResearchArticle(id: string) {
  const article = await db.researchArticle.findUnique({ where: { id } });
  if (!article) throw new Error("Article not found");

  await db.researchArticle.update({
    where: { id },
    data: {
      status: "published",
      datePublished: new Date(),
      publishedVersion: article.version,
    },
  });

  return { success: true };
}

export async function unpublishResearchArticle(id: string) {
  return updateResearchArticle(id, { status: "draft" });
}

// ============================================================
// Version History
// ============================================================

export async function saveVersion(
  articleId: string,
  data: {
    title: string;
    description: string;
    content: string;
    tags?: string[];
    changelog?: string;
  }
) {
  const user = await getCurrentUser();
  requireAuth(user, "editor");

  const article = await db.researchArticle.findUnique({ where: { id: articleId } });
  if (!article) throw new Error("Article not found");

  const nextVersion = article.version + 1;

  // Save version snapshot
  await db.researchVersion.create({
    data: {
      articleId,
      version: article.version,
      title: article.title,
      description: article.description,
      content: article.content,
      tags: article.tags,
      changelog: data.changelog || "",
      createdBy: user!.id,
    },
  });

  // Update article with new version number and content
  await db.researchArticle.update({
    where: { id: articleId },
    data: {
      title: data.title,
      description: data.description,
      content: data.content,
      tags: JSON.stringify(data.tags || []),
      version: nextVersion,
    },
  });

  return { version: nextVersion };
}

export async function getVersions(articleId: string) {
  return db.researchVersion.findMany({
    where: { articleId },
    include: {
      creator: { select: { id: true, name: true, email: true } },
    },
    orderBy: { version: "desc" },
  });
}

export async function restoreVersion(articleId: string, versionId: string) {
  const user = await getCurrentUser();
  requireAuth(user, "admin");

  const version = await db.researchVersion.findUnique({ where: { id: versionId } });
  if (!version || version.articleId !== articleId) throw new Error("Version not found");

  const article = await db.researchArticle.findUnique({ where: { id: articleId } });
  if (!article) throw new Error("Article not found");

  // Save current as version before restoring
  await db.researchVersion.create({
    data: {
      articleId,
      version: article.version,
      title: article.title,
      description: article.description,
      content: article.content,
      tags: article.tags,
      changelog: `Auto-saved before restoring to version ${version.version}`,
      createdBy: user!.id,
    },
  });

  // Restore
  await db.researchArticle.update({
    where: { id: articleId },
    data: {
      title: version.title,
      description: version.description,
      content: version.content,
      tags: version.tags,
      version: article.version + 1,
    },
  });

  return { success: true };
}

// ============================================================
// Citation Management
// ============================================================

export async function getCitations(articleId: string) {
  return db.citationRecord.findMany({
    where: { articleId },
    orderBy: { createdAt: "desc" },
  });
}

export async function addCitation(articleId: string, data: {
  type?: string;
  authors?: string;
  title: string;
  journal?: string;
  year?: number;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  url?: string;
  isbn?: string;
  citationKey?: string;
}) {
  const user = await getCurrentUser();
  requireAuth(user, "editor");

  return db.citationRecord.create({
    data: {
      articleId,
      type: data.type || "journal",
      authors: data.authors || "",
      title: data.title,
      journal: data.journal || null,
      year: data.year || null,
      volume: data.volume || null,
      issue: data.issue || null,
      pages: data.pages || null,
      doi: data.doi || null,
      url: data.url || null,
      isbn: data.isbn || null,
      citationKey: data.citationKey || null,
    },
  });
}

export async function updateCitation(citationId: string, data: Partial<{
  type: string;
  authors: string;
  title: string;
  journal: string;
  year: number;
  volume: string;
  issue: string;
  pages: string;
  doi: string;
  url: string;
  isbn: string;
  citationKey: string;
}>) {
  const user = await getCurrentUser();
  requireAuth(user, "editor");

  return db.citationRecord.update({
    where: { id: citationId },
    data,
  });
}

export async function deleteCitation(citationId: string) {
  const user = await getCurrentUser();
  requireAuth(user, "editor");

  return db.citationRecord.delete({ where: { id: citationId } });
}

export async function trackDownload(contentType: string, contentId: string) {
  await db.downloadLog.create({
    data: { contentType, contentId },
  });

  if (contentType === "research") {
    await db.researchArticle.update({
      where: { id: contentId },
      data: { downloads: { increment: 1 } },
    });
  } else if (contentType === "publication") {
    await db.publication.update({
      where: { id: contentId },
      data: { downloads: { increment: 1 } },
    });
  }
}

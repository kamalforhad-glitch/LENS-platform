"use server";

import { db, slugify } from "@/lib/db";
import { getCurrentUser, requireAuth } from "@/lib/auth";
import type { PaginatedResult, ContentStatus, AdminPublication } from "@/lib/admin-types";

export async function getPublications(
  page: number = 1,
  limit: number = 20,
  filters: { status?: string; type?: string; search?: string } = {}
): Promise<PaginatedResult<AdminPublication>> {
  const where: Record<string, unknown> = {};

  if (filters.status && filters.status !== "all") {
    where.status = filters.status;
  }
  if (filters.type && filters.type !== "all") {
    where.type = filters.type;
  }
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
      { tags: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const [total, items] = await Promise.all([
    db.publication.count({ where }),
    db.publication.findMany({
      where,
      orderBy: { dateCreated: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { items: items as AdminPublication[], total, page, limit, pages: Math.ceil(total / limit) };
}

export async function getPublication(idOrSlug: string): Promise<AdminPublication | null> {
  const item = await db.publication.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
  });
  return (item as AdminPublication) || null;
}

export async function createPublication(data: {
  title: string;
  description: string;
  type?: string;
  author?: string;
  tags?: string[];
  pdf_url?: string;
  pages?: number;
  status?: ContentStatus;
}) {
  const user = await getCurrentUser();
  requireAuth(user, "editor");

  const id = crypto.randomUUID();
  let slug = slugify(data.title);
  const existing = await db.publication.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${id.slice(0, 8)}`;

  await db.publication.create({
    data: {
      id,
      slug,
      title: data.title,
      description: data.description,
      type: data.type || "Research Report",
      author: data.author || "LENS Research Team",
      tags: JSON.stringify(data.tags || []),
      pdfUrl: data.pdf_url || null,
      pages: data.pages || null,
      status: data.status || "draft",
      createdBy: user!.id,
    },
  });

  return { id, slug };
}

export async function updatePublication(
  id: string,
  data: Partial<{
    title: string;
    description: string;
    type: string;
    author: string;
    tags: string[];
    pdf_url: string;
    pages: number;
    status: ContentStatus;
  }>
) {
  const user = await getCurrentUser();
  requireAuth(user, "editor");

  const updateData: Record<string, unknown> = {};

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.author !== undefined) updateData.author = data.author;
  if (data.tags !== undefined) updateData.tags = JSON.stringify(data.tags);
  if (data.pdf_url !== undefined) updateData.pdfUrl = data.pdf_url;
  if (data.pages !== undefined) updateData.pages = data.pages;
  if (data.status !== undefined) {
    updateData.status = data.status;
    if (data.status === "published") updateData.datePublished = new Date();
  }

  await db.publication.update({ where: { id }, data: updateData });
  return { success: true };
}

export async function deletePublication(id: string) {
  const user = await getCurrentUser();
  requireAuth(user, "admin");
  await db.publication.delete({ where: { id } });
  return { success: true };
}

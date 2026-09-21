"use server";

import { db, slugify } from "@/lib/db";
import { getCurrentUser, requireAuth } from "@/lib/auth";
import type { AdminAuthorProfile, PaginatedResult } from "@/lib/admin-types";

export async function getAuthorProfiles(
  page: number = 1,
  limit: number = 50,
  filters: { search?: string } = {}
): Promise<PaginatedResult<AdminAuthorProfile>> {
  const where: Record<string, unknown> = {};

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { affiliation: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const [total, items] = await Promise.all([
    db.authorProfile.count({ where }),
    db.authorProfile.findMany({
      where,
      orderBy: { articleCount: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { items: items as unknown as AdminAuthorProfile[], total, page, limit, pages: Math.ceil(total / limit) };
}

export async function getAuthorProfile(idOrSlug: string): Promise<AdminAuthorProfile | null> {
  const item = await db.authorProfile.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    include: {
      articles: {
        include: {
          article: { select: { id: true, slug: true, title: true, category: true, datePublished: true, status: true } },
        },
        orderBy: { authorOrder: "asc" },
      },
    },
  });
  return (item as unknown as AdminAuthorProfile) || null;
}

export async function createAuthorProfile(data: {
  name: string;
  email?: string;
  affiliation?: string;
  orcid?: string;
  bio?: string;
  expertise?: string[];
  image?: string;
  website?: string;
  social?: Record<string, string>;
}) {
  const user = await getCurrentUser();
  requireAuth(user, "admin");

  const id = crypto.randomUUID();
  let slug = slugify(data.name);
  const existing = await db.authorProfile.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${id.slice(0, 8)}`;

  const profile = await db.authorProfile.create({
    data: {
      id,
      slug,
      name: data.name,
      email: data.email || null,
      affiliation: data.affiliation || "",
      orcid: data.orcid || null,
      bio: data.bio || "",
      expertise: JSON.stringify(data.expertise || []),
      image: data.image || null,
      website: data.website || null,
      social: JSON.stringify(data.social || {}),
    },
  });

  return { id: profile.id, slug: profile.slug };
}

export async function updateAuthorProfile(
  id: string,
  data: Partial<{
    name: string;
    email: string;
    affiliation: string;
    orcid: string;
    bio: string;
    expertise: string[];
    image: string;
    website: string;
    social: Record<string, string>;
  }>
) {
  const user = await getCurrentUser();
  requireAuth(user, "admin");

  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.affiliation !== undefined) updateData.affiliation = data.affiliation;
  if (data.orcid !== undefined) updateData.orcid = data.orcid;
  if (data.bio !== undefined) updateData.bio = data.bio;
  if (data.expertise !== undefined) updateData.expertise = JSON.stringify(data.expertise);
  if (data.image !== undefined) updateData.image = data.image;
  if (data.website !== undefined) updateData.website = data.website;
  if (data.social !== undefined) updateData.social = JSON.stringify(data.social);

  return db.authorProfile.update({ where: { id }, data: updateData });
}

export async function deleteAuthorProfile(id: string) {
  const user = await getCurrentUser();
  requireAuth(user, "admin");
  return db.authorProfile.delete({ where: { id } });
}

export async function linkAuthorToArticle(
  authorProfileId: string,
  articleId: string,
  authorOrder: number = 1,
  isCorresponding: boolean = false
) {
  const user = await getCurrentUser();
  requireAuth(user, "editor");

  const link = await db.authorArticle.upsert({
    where: {
      authorProfileId_articleId: { authorProfileId, articleId },
    },
    update: { authorOrder, isCorresponding },
    create: { authorProfileId, articleId, authorOrder, isCorresponding },
  });

  // Update article count
  const count = await db.authorArticle.count({ where: { authorProfileId } });
  await db.authorProfile.update({
    where: { id: authorProfileId },
    data: { articleCount: count },
  });

  return link;
}

export async function unlinkAuthorFromArticle(authorProfileId: string, articleId: string) {
  const user = await getCurrentUser();
  requireAuth(user, "editor");

  await db.authorArticle.delete({
    where: {
      authorProfileId_articleId: { authorProfileId, articleId },
    },
  });

  const count = await db.authorArticle.count({ where: { authorProfileId } });
  await db.authorProfile.update({
    where: { id: authorProfileId },
    data: { articleCount: count },
  });

  return { success: true };
}

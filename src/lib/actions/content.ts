"use server";

import { db, slugify } from "@/lib/db";
import { getCurrentUser, requireAuth } from "@/lib/auth";

async function checkAuth() {
  const user = await getCurrentUser();
  return user ? requireAuth(user, "editor") : null;
}

// Programs
export async function getPrograms(filters?: { status?: string; category?: string }) {
  const where: Record<string, unknown> = {};
  if (filters?.status) where.status = filters.status;
  if (filters?.category) where.category = filters.category;
  return db.program.findMany({ where, orderBy: { sortOrder: "asc" } });
}

export async function getProgram(slug: string) {
  return db.program.findUnique({ where: { slug } });
}

export async function createProgram(data: { slug?: string; title: string; titleBn?: string; description: string; descriptionBn?: string; content?: string; contentBn?: string; image?: string; category?: string; status?: string; featured?: boolean; metaTitle?: string; metaDescription?: string }) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");
  const slug = data.slug || slugify(data.title);
  return db.program.create({ data: { ...data, slug, createdBy: auth.id } as never });
}

export async function updateProgram(id: string, data: Record<string, unknown>) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");
  return db.program.update({ where: { id }, data });
}

export async function deleteProgram(id: string) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");
  return db.program.delete({ where: { id } });
}

// Blog Posts
export async function getBlogPosts(filters?: { status?: string; category?: string }) {
  const where: Record<string, unknown> = {};
  if (filters?.status) where.status = filters.status;
  if (filters?.category) where.category = filters.category;
  return db.blogPost.findMany({ where, orderBy: { datePublished: "desc" } });
}

export async function getBlogPost(slug: string) {
  return db.blogPost.findUnique({ where: { slug } });
}

export async function createBlogPost(data: { slug?: string; title: string; titleBn?: string; description: string; descriptionBn?: string; content?: string; contentBn?: string; image?: string; author?: string; category?: string; tags?: string; status?: string; featured?: boolean; metaTitle?: string; metaDescription?: string; datePublished?: Date }) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");
  const slug = data.slug || slugify(data.title);
  return db.blogPost.create({ data: { ...data, slug, createdBy: auth.id } as never });
}

export async function updateBlogPost(id: string, data: Record<string, unknown>) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");
  return db.blogPost.update({ where: { id }, data });
}

export async function deleteBlogPost(id: string) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");
  return db.blogPost.delete({ where: { id } });
}

// Media Items
export async function getMediaItems(filters?: { status?: string; type?: string }) {
  const where: Record<string, unknown> = {};
  if (filters?.status) where.status = filters.status;
  if (filters?.type) where.type = filters.type;
  return db.mediaItem.findMany({ where, orderBy: { datePublished: "desc" } });
}

export async function getMediaItem(slug: string) {
  return db.mediaItem.findUnique({ where: { slug } });
}

export async function createMediaItem(data: { slug?: string; title: string; titleBn?: string; description: string; descriptionBn?: string; content?: string; contentBn?: string; image?: string; type?: string; source?: string; sourceUrl?: string; status?: string; featured?: boolean; metaTitle?: string; metaDescription?: string; datePublished?: Date }) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");
  const slug = data.slug || slugify(data.title);
  return db.mediaItem.create({ data: { ...data, slug, createdBy: auth.id } as never });
}

export async function updateMediaItem(id: string, data: Record<string, unknown>) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");
  return db.mediaItem.update({ where: { id }, data });
}

export async function deleteMediaItem(id: string) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");
  return db.mediaItem.delete({ where: { id } });
}

// Resources
export async function getResources(filters?: { status?: string; type?: string; category?: string }) {
  const where: Record<string, unknown> = {};
  if (filters?.status) where.status = filters.status;
  if (filters?.type) where.type = filters.type;
  if (filters?.category) where.category = filters.category;
  return db.resource.findMany({ where, orderBy: { dateCreated: "desc" } });
}

export async function getResource(slug: string) {
  return db.resource.findUnique({ where: { slug } });
}

export async function createResource(data: { slug?: string; title: string; titleBn?: string; description: string; descriptionBn?: string; content?: string; contentBn?: string; image?: string; fileUrl?: string; externalUrl?: string; category?: string; type?: string; tags?: string; status?: string; metaTitle?: string; metaDescription?: string }) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");
  const slug = data.slug || slugify(data.title);
  return db.resource.create({ data: { ...data, slug, createdBy: auth.id } as never });
}

export async function updateResource(id: string, data: Record<string, unknown>) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");
  return db.resource.update({ where: { id }, data });
}

export async function deleteResource(id: string) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");
  return db.resource.delete({ where: { id } });
}

// Careers
export async function getCareers(filters?: { status?: string }) {
  const where = filters?.status ? { status: filters.status } : {};
  return db.career.findMany({ where, orderBy: { dateCreated: "desc" } });
}

export async function getCareer(slug: string) {
  return db.career.findUnique({ where: { slug } });
}

export async function createCareer(data: { slug?: string; title: string; titleBn?: string; department?: string; location?: string; type?: string; description: string; descriptionBn?: string; requirements?: string; requirementsBn?: string; salary?: string; applicationUrl?: string; status?: string }) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");
  const slug = data.slug || slugify(data.title);
  return db.career.create({ data: { ...data, slug, createdBy: auth.id } as never });
}

export async function updateCareer(id: string, data: Record<string, unknown>) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");
  return db.career.update({ where: { id }, data });
}

export async function deleteCareer(id: string) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");
  return db.career.delete({ where: { id } });
}

// Contact Submissions
export async function getContactSubmissions(filters?: { status?: string }) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");
  const where = filters?.status ? { status: filters.status } : {};
  return db.contactSubmission.findMany({ where, orderBy: { createdAt: "desc" } });
}

export async function getContactSubmission(id: string) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");
  return db.contactSubmission.findUnique({ where: { id } });
}

export async function updateContactSubmission(id: string, data: Record<string, unknown>) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");
  return db.contactSubmission.update({ where: { id }, data });
}

export async function deleteContactSubmission(id: string) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");
  return db.contactSubmission.delete({ where: { id } });
}

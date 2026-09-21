"use server";

import { db, slugify } from "@/lib/db";
import { getCurrentUser, requireAuth } from "@/lib/auth";

async function checkAuth() {
  const user = await getCurrentUser();
  return user ? requireAuth(user, "editor") : null;
}

// Pages CRUD
export async function getPages(filters?: { status?: string }) {
  const where = filters?.status ? { status: filters.status } : {};
  return db.page.findMany({ where, orderBy: { sortOrder: "asc" }, include: { sections: { orderBy: { sortOrder: "asc" } } } });
}

export async function getPage(id: string) {
  return db.page.findUnique({ where: { id }, include: { sections: { orderBy: { sortOrder: "asc" } } } });
}

export async function getPageBySlug(slug: string) {
  return db.page.findUnique({ where: { slug }, include: { sections: { where: { visible: true }, orderBy: { sortOrder: "asc" } } } });
}

export async function createPage(data: { slug: string; title: string; titleBn?: string; description?: string; descriptionBn?: string; status?: string; template?: string; metaTitle?: string; metaDescription?: string; keywords?: string; canonicalUrl?: string }) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");
  return db.page.create({ data: { ...data, createdBy: auth.id, publishedAt: data.status === "published" ? new Date() : null } });
}

export async function updatePage(id: string, data: Record<string, unknown>) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");
  if (data.status === "published" && !data.publishedAt) data.publishedAt = new Date();
  return db.page.update({ where: { id }, data });
}

export async function deletePage(id: string) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");
  return db.page.delete({ where: { id } });
}

// Page Sections CRUD
export async function createSection(pageId: string, data: { type: string; title?: string; titleBn?: string; description?: string; descriptionBn?: string; settings?: string; content?: string; contentBn?: string }) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");
  const maxOrder = await db.pageSection.findFirst({ where: { pageId }, orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
  return db.pageSection.create({ data: { pageId, sortOrder: (maxOrder?.sortOrder ?? 0) + 1, ...data } });
}

export async function updateSection(id: string, data: Record<string, unknown>) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");
  return db.pageSection.update({ where: { id }, data });
}

export async function deleteSection(id: string) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");
  return db.pageSection.delete({ where: { id } });
}

export async function reorderSections(pageId: string, sectionIds: string[]) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");
  await Promise.all(sectionIds.map((id, i) => db.pageSection.update({ where: { id }, data: { sortOrder: i } })));
}

// Site Settings
export async function getSiteSettings(group?: string) {
  const where = group ? { group } : {};
  return db.siteSetting.findMany({ where, orderBy: { sortOrder: "asc" } });
}

export async function getSiteSetting(key: string) {
  return db.siteSetting.findUnique({ where: { key } });
}

export async function upsertSiteSetting(key: string, data: { value: string; valueBn?: string; type?: string; group?: string; label?: string; labelBn?: string }) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");
  return db.siteSetting.upsert({ where: { key }, update: data, create: { key, ...data } });
}

// Menu Items
export async function getMenuItems(location: string) {
  return db.menuItem.findMany({ where: { location, visible: true }, orderBy: { sortOrder: "asc" } });
}

export async function getAllMenuItems(location: string) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");
  return db.menuItem.findMany({ where: { location }, orderBy: { sortOrder: "asc" } });
}

export async function createMenuItem(data: { location: string; label: string; labelBn?: string; url: string; sortOrder?: number; visible?: boolean; target?: string; parentId?: string }) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");
  return db.menuItem.create({ data });
}

export async function updateMenuItem(id: string, data: Record<string, unknown>) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");
  return db.menuItem.update({ where: { id }, data });
}

export async function deleteMenuItem(id: string) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");
  return db.menuItem.delete({ where: { id } });
}

export async function reorderMenuItems(location: string, itemIds: string[]) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");
  await Promise.all(itemIds.map((id, i) => db.menuItem.update({ where: { id }, data: { sortOrder: i } })));
}

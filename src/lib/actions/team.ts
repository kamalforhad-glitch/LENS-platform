"use server";

import { db, slugify } from "@/lib/db";
import { getCurrentUser, requireAuth } from "@/lib/auth";
import type { PaginatedResult, AdminTeamMember } from "@/lib/admin-types";

export async function getTeamMembers(
  page: number = 1,
  limit: number = 50,
  filters: { active?: boolean; department?: string; search?: string } = {}
): Promise<PaginatedResult<AdminTeamMember>> {
  const where: Record<string, unknown> = {};

  if (filters.active !== undefined) {
    where.active = filters.active;
  }
  if (filters.department && filters.department !== "all") {
    where.department = filters.department;
  }
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { role: { contains: filters.search, mode: "insensitive" } },
      { department: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const [total, items] = await Promise.all([
    db.teamMember.count({ where }),
    db.teamMember.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { items, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function getTeamMember(idOrSlug: string): Promise<AdminTeamMember | null> {
  const item = await db.teamMember.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
  });
  return item || null;
}

export async function createTeamMember(data: {
  name: string;
  role: string;
  department?: string;
  bio?: string;
  image?: string;
  email?: string;
  social?: Record<string, string>;
  sort_order?: number;
}) {
  const user = await getCurrentUser();
  requireAuth(user, "admin");

  const id = crypto.randomUUID();
  let slug = slugify(data.name);
  const existing = await db.teamMember.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${id.slice(0, 8)}`;

  await db.teamMember.create({
    data: {
      id,
      slug,
      name: data.name,
      role: data.role,
      department: data.department || "General",
      bio: data.bio || "",
      image: data.image || null,
      email: data.email || null,
      social: JSON.stringify(data.social || {}),
      sortOrder: data.sort_order || 0,
      createdBy: user!.id,
    },
  });

  return { id, slug };
}

export async function updateTeamMember(
  id: string,
  data: Partial<{
    name: string;
    role: string;
    department: string;
    bio: string;
    image: string;
    email: string;
    social: Record<string, string>;
    sort_order: number;
    active: boolean;
  }>
) {
  const user = await getCurrentUser();
  requireAuth(user, "admin");

  const updateData: Record<string, unknown> = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.department !== undefined) updateData.department = data.department;
  if (data.bio !== undefined) updateData.bio = data.bio;
  if (data.image !== undefined) updateData.image = data.image;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.social !== undefined) updateData.social = JSON.stringify(data.social);
  if (data.sort_order !== undefined) updateData.sortOrder = data.sort_order;
  if (data.active !== undefined) updateData.active = data.active;

  await db.teamMember.update({ where: { id }, data: updateData });
  return { success: true };
}

export async function deleteTeamMember(id: string) {
  const user = await getCurrentUser();
  requireAuth(user, "admin");
  await db.teamMember.delete({ where: { id } });
  return { success: true };
}

"use server";

import { db, slugify } from "@/lib/db";
import { getCurrentUser, requireAuth } from "@/lib/auth";
import type { PaginatedResult, ContentStatus, AdminEvent } from "@/lib/admin-types";

export async function getEvents(
  page: number = 1,
  limit: number = 20,
  filters: { status?: string; category?: string; search?: string } = {}
): Promise<PaginatedResult<AdminEvent>> {
  const where: Record<string, unknown> = {};

  if (filters.status && filters.status !== "all") {
    where.status = filters.status;
  }
  if (filters.category && filters.category !== "all") {
    where.category = filters.category;
  }
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
      { location: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const [total, items] = await Promise.all([
    db.event.count({ where }),
    db.event.findMany({
      where,
      orderBy: { startDate: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { items: items as AdminEvent[], total, page, limit, pages: Math.ceil(total / limit) };
}

export async function getEvent(idOrSlug: string): Promise<AdminEvent | null> {
  const item = await db.event.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
  });
  return (item as AdminEvent) || null;
}

export async function createEvent(data: {
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  time?: string;
  location: string;
  location_url?: string;
  registration_url?: string;
  category?: string;
  capacity?: number;
  status?: ContentStatus;
}) {
  const user = await getCurrentUser();
  requireAuth(user, "editor");

  const id = crypto.randomUUID();
  let slug = slugify(data.name);
  const existing = await db.event.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${id.slice(0, 8)}`;

  await db.event.create({
    data: {
      id,
      slug,
      name: data.name,
      description: data.description,
      startDate: new Date(data.start_date),
      endDate: new Date(data.end_date),
      time: data.time || "",
      location: data.location,
      locationUrl: data.location_url || null,
      registrationUrl: data.registration_url || null,
      category: data.category || "Workshop",
      capacity: data.capacity || null,
      status: data.status || "draft",
      createdBy: user!.id,
    },
  });

  return { id, slug };
}

export async function updateEvent(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    start_date: string;
    end_date: string;
    time: string;
    location: string;
    location_url: string;
    registration_url: string;
    category: string;
    capacity: number;
    registered: number;
    status: ContentStatus;
  }>
) {
  const user = await getCurrentUser();
  requireAuth(user, "editor");

  const updateData: Record<string, unknown> = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.start_date !== undefined) updateData.startDate = new Date(data.start_date);
  if (data.end_date !== undefined) updateData.endDate = new Date(data.end_date);
  if (data.time !== undefined) updateData.time = data.time;
  if (data.location !== undefined) updateData.location = data.location;
  if (data.location_url !== undefined) updateData.locationUrl = data.location_url;
  if (data.registration_url !== undefined) updateData.registrationUrl = data.registration_url;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.capacity !== undefined) updateData.capacity = data.capacity;
  if (data.registered !== undefined) updateData.registered = data.registered;
  if (data.status !== undefined) updateData.status = data.status;

  await db.event.update({ where: { id }, data: updateData });
  return { success: true };
}

export async function deleteEvent(id: string) {
  const user = await getCurrentUser();
  requireAuth(user, "admin");
  await db.event.delete({ where: { id } });
  return { success: true };
}

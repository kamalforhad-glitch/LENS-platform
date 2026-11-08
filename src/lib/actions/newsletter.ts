"use server";

import { db } from "@/lib/db";
import { getCurrentUser, requireAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export interface NewsletterSubscriberAdmin {
  id: string;
  email: string;
  status: string;
  token: string | null;
  createdAt: Date;
  updatedAt: Date;
  confirmedAt: Date | null;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export async function getNewsletterSubscribers(
  page: number = 1,
  limit: number = 25,
  filters: { status?: string; search?: string } = {}
): Promise<PaginatedResult<NewsletterSubscriberAdmin>> {
  const user = await getCurrentUser();
  requireAuth(user, "editor");

  const where: Record<string, unknown> = {};
  if (filters.status && filters.status !== "all") {
    where.status = filters.status;
  }
  if (filters.search) {
    where.email = { contains: filters.search, mode: "insensitive" };
  }

  const [total, items] = await Promise.all([
    db.newsletterSubscriber.count({ where }),
    db.newsletterSubscriber.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    items: items as NewsletterSubscriberAdmin[],
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
}

export async function updateSubscriberStatus(id: string, status: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  requireAuth(user, "editor");

  await db.newsletterSubscriber.update({
    where: { id },
    data: { status },
  });

  await logAudit({
    actor: user,
    action: "newsletter_subscriber_status_change",
    targetType: "newsletter_subscriber",
    targetId: id,
    meta: { status },
  });

  revalidatePath("/admin/newsletter-subscribers");
  return { success: true };
}

export async function deleteSubscriber(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  requireAuth(user, "admin");

  await db.newsletterSubscriber.delete({
    where: { id },
  });

  await logAudit({
    actor: user,
    action: "newsletter_subscriber_delete",
    targetType: "newsletter_subscriber",
    targetId: id,
    meta: {},
  });

  revalidatePath("/admin/newsletter-subscribers");
  return { success: true };
}

"use server";

import { db } from "@/lib/db";
import { getCurrentUser, requireEditor, requireAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export interface TranslationItem {
  id: string;
  locale: string;
  namespace: string;
  key: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function getTranslations(params?: {
  locale?: string;
  namespace?: string;
  search?: string;
}) {
  const user = await getCurrentUser();
  requireAuth(user, "viewer");

  const where: Record<string, unknown> = {};
  if (params?.locale) where.locale = params.locale;
  if (params?.namespace) where.namespace = params.namespace;
  if (params?.search) {
    where.OR = [
      { key: { contains: params.search, mode: "insensitive" } },
      { value: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const items = await db.translation.findMany({
    where,
    orderBy: [{ namespace: "asc" }, { key: "asc" }],
  });

  return items;
}

export async function upsertTranslation(
  locale: string,
  namespace: string,
  key: string,
  value: string
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const auth = requireEditor(user);

  const cleanLocale = locale.trim().toLowerCase();
  const cleanNamespace = (namespace || "common").trim().toLowerCase();
  const cleanKey = key.trim();
  const cleanValue = value.trim();

  const item = await db.translation.upsert({
    where: {
      locale_namespace_key: {
        locale: cleanLocale,
        namespace: cleanNamespace,
        key: cleanKey,
      },
    },
    create: {
      locale: cleanLocale,
      namespace: cleanNamespace,
      key: cleanKey,
      value: cleanValue,
    },
    update: {
      value: cleanValue,
    },
  });

  await logAudit({
    action: "translation_update",
    actor: auth,
    targetType: "translation",
    targetId: item.id,
    meta: { locale: cleanLocale, namespace: cleanNamespace, key: cleanKey },
  });

  revalidatePath("/", "layout");
  return item;
}

export async function deleteTranslation(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const auth = requireEditor(user);

  const existing = await db.translation.findUnique({ where: { id } });
  if (!existing) throw new Error("Translation not found");

  await db.translation.delete({ where: { id } });

  await logAudit({
    action: "translation_delete",
    actor: auth,
    targetType: "translation",
    targetId: id,
    meta: { locale: existing.locale, key: existing.key },
  });

  revalidatePath("/", "layout");
  return { success: true };
}


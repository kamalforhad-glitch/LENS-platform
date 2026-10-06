import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

// Reuse the client across serverless invocations in every environment.
// Creating a new PrismaClient per request exhausts the Supabase pooler
// (transaction mode, limited connections). globalThis survives module
// reloads on Vercel/Lambda-style runtimes.
globalForPrisma.prisma = db;

// ============================================================
// Generic helpers
// ============================================================
export function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    // Keep Unicode letters/numbers (incl. Bengali U+0980–U+09FF), spaces, hyphens.
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  // Fallback for titles that transliterate to empty (e.g. symbols-only).
  if (!slug) return `item-${crypto.randomUUID().slice(0, 8)}`;
  return slug;
}

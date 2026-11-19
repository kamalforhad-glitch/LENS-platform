// The Prisma singleton lives in ./prisma so the production connection check
// has one canonical home. Re-export it here to preserve every existing
// `@/lib/db` import across the app.
export { db } from "./prisma";

// ============================================================
// Generic helpers
// ============================================================
export function slugify(text: string, options?: { allowSlash?: boolean }): string {
  const pattern = options?.allowSlash
    ? /[^\p{L}\p{N}\s\/-]/gu
    : /[^\p{L}\p{N}\s-]/gu;
  let slug = text
    .toLowerCase()
    // Keep Unicode letters/numbers (incl. Bengali U+0980–U+09FF), spaces, hyphens (and slashes when enabled).
    .replace(pattern, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/\/+/g, "/")
    .replace(/^[\/-]+|[\/-]+$/g, "")
    .slice(0, 120);
  if (options?.allowSlash) {
    slug = slug.split("/").map((s) => s.replace(/^-+|-+$/g, "")).filter(Boolean).join("/");
  }
  // Fallback for titles that transliterate to empty (e.g. symbols-only).
  if (!slug) return `item-${crypto.randomUUID().slice(0, 8)}`;
  return slug;
}

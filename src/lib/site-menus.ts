// ============================================================
// Server-only menu loading: MenuItem CMS rows with static fallback.
//
// - Never throws: any database failure (incl. missing DATABASE_URL
//   at build time) falls back to the static IA navigation, so
//   `next build` and all public pages keep working.
// - Does NOT modify Prisma schema, auth, APIs or the admin CMS —
//   read-only findMany on the existing menu_items table.
// - On-demand revalidation when editors save menus is Phase C work;
//   until then CMS edits apply on next build / dynamic request.
// ============================================================

import { db } from "@/lib/db";
import { unstable_cache } from "next/cache";
import {
  buildMenuTree,
  getFallbackFooterColumns,
  getFallbackHeaderNav,
  menuTreeToFooterColumns,
  menuTreeToNavEntries,
  type FooterColumn,
  type NavEntry,
} from "@/lib/site-navigation";

// Cached header navigation: deduplicated within a render and cached across
// requests. Busted via the `navigation:header` tag when editors save menus.
const cachedHeaderItems = unstable_cache(
  async () =>
    db.menuItem.findMany({
      where: { location: "header", visible: true },
      orderBy: { sortOrder: "asc" },
    }),
  ["header-navigation"],
  { tags: ["navigation:header"] }
);

const cachedFooterItems = unstable_cache(
  async () =>
    db.menuItem.findMany({
      where: { location: "footer", visible: true },
      orderBy: { sortOrder: "asc" },
    }),
  ["footer-navigation"],
  { tags: ["navigation:footer"] }
);

export async function getHeaderNavigation(): Promise<NavEntry[]> {
  try {
    const items = await cachedHeaderItems();
    if (items.length === 0) return getFallbackHeaderNav();
    return menuTreeToNavEntries(buildMenuTree(items));
  } catch {
    return getFallbackHeaderNav();
  }
}

export async function getFooterColumns(): Promise<FooterColumn[]> {
  try {
    const items = await cachedFooterItems();
    if (items.length === 0) return getFallbackFooterColumns();
    return menuTreeToFooterColumns(buildMenuTree(items));
  } catch {
    return getFallbackFooterColumns();
  }
}

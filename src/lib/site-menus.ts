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
import {
  buildMenuTree,
  getFallbackFooterColumns,
  getFallbackHeaderNav,
  menuTreeToFooterColumns,
  menuTreeToNavEntries,
  type FooterColumn,
  type NavEntry,
} from "@/lib/site-navigation";

export async function getHeaderNavigation(): Promise<NavEntry[]> {
  try {
    const items = await db.menuItem.findMany({
      where: { location: "header", visible: true },
      orderBy: { sortOrder: "asc" },
    });
    if (items.length === 0) return getFallbackHeaderNav();
    return menuTreeToNavEntries(buildMenuTree(items));
  } catch {
    return getFallbackHeaderNav();
  }
}

export async function getFooterColumns(): Promise<FooterColumn[]> {
  try {
    const items = await db.menuItem.findMany({
      where: { location: "footer", visible: true },
      orderBy: { sortOrder: "asc" },
    });
    if (items.length === 0) return getFallbackFooterColumns();
    return menuTreeToFooterColumns(buildMenuTree(items));
  } catch {
    return getFallbackFooterColumns();
  }
}

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

export interface SubnavItemData {
  id: string;
  label: string;
  labelBn: string;
  href: string;
  icon?: string | null;
  badge?: string | null;
  badgeBn?: string | null;
}

export async function getSectionSubnavItems(section: string): Promise<SubnavItemData[]> {
  try {
    const items = await cachedHeaderItems();
    if (items.length === 0) return [];

    const sectionSlug = `/${section.replace(/^\/+|\/+$/g, "")}`;
    const parent = items.find(
      (it) => it.url === sectionSlug || it.url === `${sectionSlug}/` || it.label.toLowerCase() === section.toLowerCase()
    );

    if (!parent) return [];

    const children = items
      .filter((it) => it.parentId === parent.id && it.visible !== false)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    if (children.length === 0) return [];

    const result: SubnavItemData[] = [
      {
        id: "overview",
        label: parent.label === "Home" ? "Overview" : (parent.label === "About" ? "Overview" : `All ${parent.label}`),
        labelBn: parent.labelBn || "পরিচিতি",
        href: parent.url,
        icon: parent.icon || undefined,
      },
      ...children.map((child) => ({
        id: child.id,
        label: child.label,
        labelBn: child.labelBn || child.label,
        href: child.url,
        icon: child.icon || undefined,
        badge: child.badgeText || undefined,
        badgeBn: child.badgeTextBn || undefined,
      })),
    ];

    return result;
  } catch {
    return [];
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

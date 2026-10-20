// ============================================================
// Server-side resolution of data-driven page sections.
// Runs on the server only (public published data via public-content).
// ============================================================

import { getPublicResearch, getPublicPublications, getPublicTeamMembers } from "@/lib/public-content";

export interface ResolvedItem {
  title: string;
  description?: string;
  image?: string | null;
  href?: string;
  meta?: string;
}

export interface ResolvedItems {
  items: ResolvedItem[];
}

const EMPTY: ResolvedItems = { items: [] };

/**
 * Fetch public data for section types that render database content.
 */
export async function resolveSectionItems(
  type: string,
  content: Record<string, unknown>
): Promise<ResolvedItems> {
  if (type === "featured") {
    const collection = String(content.collection || "research");
    const limit = Math.min(12, Math.max(1, Number(content.limit) || 3));

    if (collection === "publications") {
      const res = await getPublicPublications();
      return {
        items: res.items.slice(0, limit).map((p) => ({
          title: p.title,
          description: p.description,
          href: `/publications/${p.slug}`,
          meta: p.type,
        })),
      };
    }

    const res = await getPublicResearch();
    return {
      items: res.items.slice(0, limit).map((r) => ({
        title: r.title,
        description: r.description,
        href: `/research/${r.slug}`,
        meta: r.category,
      })),
    };
  }

  if (type === "team") {
    const res = await getPublicTeamMembers();
    const limit = Math.min(24, Math.max(1, Number(content.limit) || 8));
    return {
      items: res.items.slice(0, limit).map((t) => ({
        title: t.name,
        description: t.role,
        image: t.image,
        href: "/about/team",
        meta: t.department,
      })),
    };
  }

  return EMPTY;
}

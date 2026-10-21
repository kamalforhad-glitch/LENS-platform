// ============================================================
// Server-side resolution of data-driven page sections.
// Runs on the server only (public published data via public-content).
// ============================================================

import {
  getPublicResearch,
  getPublicPublications,
  getPublicTeamMembers,
  getPublicEvents,
  getPublicBlogPosts,
  getPublicMediaItems,
  getPublicResources,
  getPublicPrograms,
  getPublicCareerOpenings,
  getPublicResearchers,
} from "@/lib/public-content";

export interface ResolvedItem {
  title: string;
  titleBn?: string;
  description?: string;
  descriptionBn?: string;
  image?: string | null;
  href?: string;
  meta?: string;
  dateLabel?: string;
}

export interface ResolvedItems {
  items: ResolvedItem[];
}

const EMPTY: ResolvedItems = { items: [] };

/**
 * Fetch public data for section types that render database content.
 * Supports collection parameter for "featured" sections to pull from any content type.
 */
export async function resolveSectionItems(
  type: string,
  content: Record<string, unknown>
): Promise<ResolvedItems> {
  if (type === "featured") {
    const collection = String(content.collection || "research");
    const limit = Math.min(24, Math.max(1, Number(content.limit) || 3));

    // Research Articles
    if (collection === "research") {
      const res = await getPublicResearch();
      return {
        items: res.items.slice(0, limit).map((r) => ({
          title: r.title,
          titleBn: r.titleBn,
          description: r.description,
          descriptionBn: r.descriptionBn,
          href: `/research/${r.slug}`,
          meta: r.category,
          dateLabel: r.dateLabel,
        })),
      };
    }

    // Publications
    if (collection === "publications") {
      const res = await getPublicPublications();
      return {
        items: res.items.slice(0, limit).map((p) => ({
          title: p.title,
          titleBn: p.titleBn,
          description: p.description,
          descriptionBn: p.descriptionBn,
          href: `/publications/${p.slug}`,
          meta: p.type,
          dateLabel: p.dateLabel,
        })),
      };
    }

    // Events
    if (collection === "events") {
      const res = await getPublicEvents();
      return {
        items: res.items.slice(0, limit).map((e) => ({
          title: e.name,
          titleBn: e.nameBn,
          description: e.description,
          descriptionBn: e.descriptionBn,
          href: `/events/${e.slug}`,
          meta: e.category,
          dateLabel: e.dateLabel,
        })),
      };
    }

    // Blog Posts
    if (collection === "blog") {
      const res = await getPublicBlogPosts();
      return {
        items: res.items.slice(0, limit).map((b) => ({
          title: b.title,
          titleBn: b.titleBn,
          description: b.description,
          descriptionBn: b.descriptionBn,
          href: `/blog/${b.slug}`,
          meta: b.category,
          dateLabel: b.datePublished
            ? b.datePublished.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : undefined,
        })),
      };
    }

    // Media Items
    if (collection === "media") {
      const res = await getPublicMediaItems();
      return {
        items: res.items.slice(0, limit).map((m) => ({
          title: m.title,
          titleBn: m.titleBn,
          description: m.description,
          descriptionBn: m.descriptionBn,
          href: `/media/${m.slug}`,
          meta: m.type,
          dateLabel: m.datePublished
            ? m.datePublished.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
              })
            : undefined,
        })),
      };
    }

    // Resources
    if (collection === "resources") {
      const res = await getPublicResources();
      return {
        items: res.items.slice(0, limit).map((r) => ({
          title: r.title,
          titleBn: r.titleBn,
          description: r.description,
          descriptionBn: r.descriptionBn,
          href: `/resources/${r.slug}`,
          meta: r.category,
        })),
      };
    }

    // Programs
    if (collection === "programs") {
      const res = await getPublicPrograms();
      return {
        items: res.items.slice(0, limit).map((p) => ({
          title: p.title,
          titleBn: p.titleBn,
          description: p.description,
          descriptionBn: p.descriptionBn,
          href: `/programs/${p.slug}`,
          meta: p.category,
        })),
      };
    }

    // Researchers
    if (collection === "researchers") {
      const res = await getPublicResearchers();
      return {
        items: res.items.slice(0, limit).map((r) => ({
          title: r.name,
          titleBn: r.nameBn,
          description: r.bio,
          descriptionBn: r.bioBn,
          image: r.image,
          href: `/researchers/${r.slug}`,
          meta: r.affiliation,
        })),
      };
    }

    // Default fallback to research
    const res = await getPublicResearch();
    return {
      items: res.items.slice(0, limit).map((r) => ({
        title: r.title,
        titleBn: r.titleBn,
        description: r.description,
        descriptionBn: r.descriptionBn,
        href: `/research/${r.slug}`,
        meta: r.category,
        dateLabel: r.dateLabel,
      })),
    };
  }

  if (type === "team") {
    const res = await getPublicTeamMembers();
    const limit = Math.min(24, Math.max(1, Number(content.limit) || 8));
    return {
      items: res.items.slice(0, limit).map((t) => ({
        title: t.name,
        titleBn: t.nameBn,
        description: t.role,
        descriptionBn: t.roleBn,
        image: t.image,
        href: "/about/team",
        meta: t.department,
      })),
    };
  }

  // Event listing section - renders upcoming events
  if (type === "event_list") {
    const res = await getPublicEvents();
    const limit = Math.min(24, Math.max(1, Number(content.limit) || 6));
    const showPast = Boolean(content.showPast);
    const now = new Date();

    let items = res.items;
    if (!showPast) {
      items = items.filter((e) => new Date(e.startDate) >= now);
    }

    return {
      items: items.slice(0, limit).map((e) => ({
        title: e.name,
        titleBn: e.nameBn,
        description: e.description,
        descriptionBn: e.descriptionBn,
        href: `/events/${e.slug}`,
        meta: e.category,
        dateLabel: e.dateLabel,
      })),
    };
  }

  // Publication listing section
  if (type === "publication_list") {
    const res = await getPublicPublications();
    const limit = Math.min(24, Math.max(1, Number(content.limit) || 6));
    return {
      items: res.items.slice(0, limit).map((p) => ({
        title: p.title,
        titleBn: p.titleBn,
        description: p.description,
        descriptionBn: p.descriptionBn,
        href: `/publications/${p.slug}`,
        meta: p.type,
        dateLabel: p.dateLabel,
      })),
    };
  }

  // Blog listing section
  if (type === "blog_list") {
    const res = await getPublicBlogPosts();
    const limit = Math.min(24, Math.max(1, Number(content.limit) || 6));
    return {
      items: res.items.slice(0, limit).map((b) => ({
        title: b.title,
        titleBn: b.titleBn,
        description: b.description,
        descriptionBn: b.descriptionBn,
        href: `/blog/${b.slug}`,
        meta: b.category,
        dateLabel: b.datePublished
          ? b.datePublished.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : undefined,
      })),
    };
  }

  // Media listing section
  if (type === "media_list") {
    const res = await getPublicMediaItems();
    const limit = Math.min(24, Math.max(1, Number(content.limit) || 6));
    return {
      items: res.items.slice(0, limit).map((m) => ({
        title: m.title,
        titleBn: m.titleBn,
        description: m.description,
        descriptionBn: m.descriptionBn,
        href: `/media/${m.slug}`,
        meta: m.type,
        dateLabel: m.datePublished
          ? m.datePublished.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
            })
          : undefined,
      })),
    };
  }

  // Resource listing section
  if (type === "resource_list") {
    const res = await getPublicResources();
    const limit = Math.min(24, Math.max(1, Number(content.limit) || 6));
    const categoryFilter = content.category ? String(content.category) : null;

    let items = res.items;
    if (categoryFilter) {
      items = items.filter((r) => r.category === categoryFilter);
    }

    return {
      items: items.slice(0, limit).map((r) => ({
        title: r.title,
        titleBn: r.titleBn,
        description: r.description,
        descriptionBn: r.descriptionBn,
        href: `/resources/${r.slug}`,
        meta: r.category,
      })),
    };
  }

  // Program listing section
  if (type === "program_list") {
    const res = await getPublicPrograms();
    const limit = Math.min(24, Math.max(1, Number(content.limit) || 6));
    const categoryFilter = content.category ? String(content.category) : null;

    let items = res.items;
    if (categoryFilter) {
      items = items.filter((p) => p.category === categoryFilter);
    }

    return {
      items: items.slice(0, limit).map((p) => ({
        title: p.title,
        titleBn: p.titleBn,
        description: p.description,
        descriptionBn: p.descriptionBn,
        href: `/programs/${p.slug}`,
        meta: p.category,
      })),
    };
  }

  // Research listing section (alternative to featured with collection=research)
  if (type === "research_list") {
    const res = await getPublicResearch();
    const limit = Math.min(24, Math.max(1, Number(content.limit) || 6));
    const categoryFilter = content.category ? String(content.category) : null;

    let items = res.items;
    if (categoryFilter) {
      items = items.filter((r) => r.category === categoryFilter);
    }

    return {
      items: items.slice(0, limit).map((r) => ({
        title: r.title,
        titleBn: r.titleBn,
        description: r.description,
        descriptionBn: r.descriptionBn,
        href: `/research/${r.slug}`,
        meta: r.category,
        dateLabel: r.dateLabel,
      })),
    };
  }

  // Career listing section
  if (type === "career_list") {
    const res = await getPublicCareerOpenings();
    const limit = Math.min(24, Math.max(1, Number(content.limit) || 6));
    const departmentFilter = content.department ? String(content.department) : null;

    let items = res.items;
    if (departmentFilter) {
      items = items.filter((c) => c.department === departmentFilter);
    }

    return {
      items: items.slice(0, limit).map((c) => ({
        title: c.title,
        titleBn: c.titleBn,
        description: c.description,
        descriptionBn: c.descriptionBn,
        href: `/careers/${c.slug}`,
        meta: `${c.department} · ${c.type}`,
        dateLabel: c.status,
      })),
    };
  }

  // Researcher listing section
  if (type === "researcher_list") {
    const res = await getPublicResearchers();
    const limit = Math.min(24, Math.max(1, Number(content.limit) || 8));
    const featuredOnly = Boolean(content.featuredOnly);

    let items = res.items;
    if (featuredOnly) {
      items = items.filter((r) => r.featured);
    }

    return {
      items: items.slice(0, limit).map((r) => ({
        title: r.name,
        titleBn: r.nameBn,
        description: r.bio,
        descriptionBn: r.bioBn,
        image: r.image,
        href: `/researchers/${r.slug}`,
        meta: r.affiliation,
      })),
    };
  }

  // Researcher grid section - fetches from public content (replaces API call)
  if (type === "researcher_grid") {
    const res = await getPublicResearchers();
    const limit = Math.min(24, Math.max(1, Number(content.limit) || 8));
    const featuredOnly = Boolean(content.featuredOnly);

    let items = res.items;
    if (featuredOnly) {
      items = items.filter((r) => r.featured);
    }

    return {
      items: items.slice(0, limit).map((r) => ({
        title: r.name,
        titleBn: r.nameBn,
        description: r.bio,
        descriptionBn: r.bioBn,
        image: r.image,
        href: `/researchers/${r.slug}`,
        meta: r.affiliation,
      })),
    };
  }

  return EMPTY;
}
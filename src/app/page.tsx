import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import HomeClient from "./HomeClient";
import { getPublicPage } from "@/lib/actions/cms";
import { getFocusAreas } from "@/lib/focus-areas";
import { getPublicEvents, getPublicPublications, getPublicResearch } from "@/lib/public-content";
import {
  resolveSectionItems,
  type ResolvedItems,
} from "@/components/page/resolveSectionItems";
import { parseKeywords, safeMetadataUrl } from "@/lib/page-seo";

// Anonymous, non-personalized homepage: cache the rendered result briefly and
// invalidate it on CMS writes via revalidatePath("/"). No auth or per-user
// state is read anywhere in this tree.
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublicPage("home");
  if (!page) return {};

  const keywords = parseKeywords(page.keywords);
  const hasPageSeo = Boolean(
    page.metaTitle ||
      page.metaTitleBn ||
      page.metaDescription ||
      page.metaDescriptionBn ||
      page.ogImage ||
      page.canonicalUrl ||
      keywords
  );
  if (!hasPageSeo) return {};

  const title =
    page.metaTitleBn || page.metaTitle || page.titleBn || page.title;
  const description =
    page.metaDescriptionBn ||
    page.metaDescription ||
    page.descriptionBn ||
    page.description;
  const ogImage = safeMetadataUrl(page.ogImage);
  const canonical = safeMetadataUrl(page.canonicalUrl) || "/";

  return {
    title: title || undefined,
    description: description || undefined,
    // Omit when unset so the root layout's global `seo_keywords` survives.
    ...(keywords ? { keywords } : {}),
    openGraph: {
      title: title || undefined,
      description: description || undefined,
      url: canonical,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      title: title || undefined,
      description: description || undefined,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    alternates: { canonical },
  };
}

type HomeEventItem = {
  slug: string;
  name: string;
  nameBn: string;
  description: string;
  descriptionBn: string;
  location: string;
  time: string;
  category: string;
  startDate: string | null;
  dateLabel: string;
  registrationUrl: string | null;
};

type HomeFeaturedItem = {
  slug: string;
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  category: string;
  type: string;
  dateLabel: string | null;
  href: string;
};

type HomePublicationItem = {
  slug: string;
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  type: string;
  dateLabel: string | null;
  href: string;
};

type HomeDataResult<T> = {
  items: T[];
  error: boolean;
};

// Section types backed by resolveSectionItems(). Everything else is either
// static/structured content already stored in the section row (hero, impact,
// faq, timeline, table, embed, etc.) or one of the two homepage-specific
// widgets (featured_research, events_newsletter) hydrated below. Those types
// intentionally do not trigger an extra data query.
const HOME_DATA_DRIVEN_TYPES = [
  "featured",
  "team",
  "event_list",
  "publication_list",
  "blog_list",
  "media_list",
  "resource_list",
  "program_list",
  "research_list",
  "career_list",
  "researcher_list",
  "researcher_grid",
] as const;

const cachedHomeEvents = unstable_cache(
  async (): Promise<HomeDataResult<HomeEventItem>> => {
    try {
      const res = await getPublicEvents();
      if (res.error) return { items: [], error: true };
      return {
        error: false,
        items: res.items.map((e) => ({
          slug: e.slug,
          name: e.name,
          nameBn: e.nameBn,
          description: e.description,
          descriptionBn: e.descriptionBn,
          location: e.location,
          time: e.time,
          category: e.category,
          startDate: e.startDate ? e.startDate.toISOString() : null,
          dateLabel: e.dateLabel,
          registrationUrl: e.registrationUrl ?? null,
        })),
      };
    } catch {
      return { items: [], error: true };
    }
  },
  ["home-events", "v1"],
  { tags: ["public-events"], revalidate: 60 }
);

const cachedHomeFeaturedResearch = unstable_cache(
  async (): Promise<HomeDataResult<HomeFeaturedItem>> => {
    try {
      // Only the small homepage preview is needed; the default public list
      // remains 60 for full listing pages.
      const res = await getPublicResearch(6);
      if (res.error) return { items: [], error: true };
      return {
        error: false,
        items: res.items.map((r) => ({
          slug: r.slug,
          title: r.title,
          titleBn: r.titleBn,
          description: r.description,
          descriptionBn: r.descriptionBn,
          category: r.category,
          type: r.category,
          dateLabel: r.dateLabel,
          href: `/research/${r.slug}`,
        })),
      };
    } catch {
      return { items: [], error: true };
    }
  },
  ["home-featured-research", "v1"],
  { tags: ["public-research"], revalidate: 60 }
);

const cachedHomePublications = unstable_cache(
  async (): Promise<HomeDataResult<HomePublicationItem>> => {
    try {
      const res = await getPublicPublications(6);
      if (res.error) return { items: [], error: true };
      return {
        error: false,
        items: res.items.map((p) => ({
          slug: p.slug,
          title: p.title,
          titleBn: p.titleBn,
          description: p.description,
          descriptionBn: p.descriptionBn,
          type: p.type,
          dateLabel: p.dateLabel,
          href: `/publications/${p.slug}`,
        })),
      };
    } catch {
      return { items: [], error: true };
    }
  },
  ["home-publications", "v1"],
  { tags: ["public-publications"], revalidate: 60 }
);

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function sectionLimit(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(24, Math.max(1, parsed)) : fallback;
}

function resolveEvents(
  events: HomeDataResult<HomeEventItem>,
  content: Record<string, unknown>
): ResolvedItems {
  if (events.error) return { items: [], error: true };
  const limit = sectionLimit(content.limit, 6);
  const showPast = Boolean(content.showPast);
  const now = new Date();
  const items = showPast
    ? events.items
    : events.items.filter((e) => !e.startDate || new Date(e.startDate) >= now);

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

function resolveResearch(
  research: HomeDataResult<HomeFeaturedItem>,
  content: Record<string, unknown>,
  fallbackLimit: number
): ResolvedItems {
  if (research.error) return { items: [], error: true };
  const limit = sectionLimit(content.limit, fallbackLimit);
  const category = content.category ? String(content.category) : null;
  const items = category
    ? research.items.filter((r) => r.category === category)
    : research.items;

  return {
    items: items.slice(0, limit).map((r) => ({
      title: r.title,
      titleBn: r.titleBn,
      description: r.description,
      descriptionBn: r.descriptionBn,
      href: r.href,
      meta: r.category,
      dateLabel: r.dateLabel ?? undefined,
    })),
  };
}

function resolvePublications(
  publications: HomeDataResult<HomePublicationItem>,
  content: Record<string, unknown>,
  fallbackLimit: number
): ResolvedItems {
  if (publications.error) return { items: [], error: true };
  const limit = sectionLimit(content.limit, fallbackLimit);
  const typeFilter = content.type ? String(content.type) : null;
  const items = typeFilter
    ? publications.items.filter((p) => p.type === typeFilter)
    : publications.items;

  return {
    items: items.slice(0, limit).map((p) => ({
      title: p.title,
      titleBn: p.titleBn,
      description: p.description,
      descriptionBn: p.descriptionBn,
      href: p.href,
      meta: p.type,
      dateLabel: p.dateLabel ?? undefined,
    })),
  };
}

async function resolveHomeSectionItems(
  type: string,
  content: Record<string, unknown>,
  events: HomeDataResult<HomeEventItem>,
  research: HomeDataResult<HomeFeaturedItem>,
  publications: HomeDataResult<HomePublicationItem>
): Promise<ResolvedItems | undefined> {
  if (!(HOME_DATA_DRIVEN_TYPES as readonly string[]).includes(type)) {
    return undefined;
  }

  // Reuse the cached homepage reads instead of issuing the same query a
  // second time through resolveSectionItems().
  if (type === "featured") {
    const collection = String(content.collection || "research");
    if (collection === "events") return resolveEvents(events, content);
    if (collection === "research") return resolveResearch(research, content, 3);
    if (collection === "publications") return resolvePublications(publications, content, 3);
  }
  if (type === "event_list") return resolveEvents(events, content);
  if (type === "research_list") return resolveResearch(research, content, 6);
  if (type === "publication_list") return resolvePublications(publications, content, 6);

  return resolveSectionItems(type, content);
}

export default async function Home() {
  const [pageData, focusAreas, eventsResult, featuredResult, publicationsResult] = await Promise.all([
    getPublicPage("home"),
    getFocusAreas(),
    cachedHomeEvents(),
    cachedHomeFeaturedResearch(),
    cachedHomePublications(),
  ]);

  const sectionsWithData = Array.isArray(pageData?.sections)
    ? await Promise.all(
        pageData.sections.map(async (sec) => {
          let section = sec;
          const content = asRecord(sec.content);

          // Resolve published events for the homepage events_newsletter section.
          if (sec.type === "events_newsletter") {
            section = {
              ...section,
              content: {
                ...content,
                events: eventsResult.items,
                eventsError: eventsResult.error,
              },
            };
          }

          // Resolve publications for the homepage featured_research section
          // ("Latest Publications"). The section reads resolved items from
          // section.content.featuredItems.
          if (sec.type === "featured_research") {
            section = {
              ...section,
              content: {
                ...content,
                featuredItems: publicationsResult.items,
                featuredError: publicationsResult.error,
              },
            };
          }

          const resolved = await resolveHomeSectionItems(
            sec.type,
            asRecord(section.content),
            eventsResult,
            featuredResult,
            publicationsResult
          );
          return resolved ? { ...section, resolved } : section;
        })
      )
    : [];

  return (
    <HomeClient
      header={<SiteHeader />}
      footer={<SiteFooter />}
      pageData={{ ...pageData, sections: sectionsWithData }}
      initialFocusAreas={focusAreas}
    />
  );
}

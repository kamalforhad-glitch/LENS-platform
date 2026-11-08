import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import HomeClient from "./HomeClient";
import { getPublicPage } from "@/lib/actions/cms";
import { getPublicEvents, getPublicResearch } from "@/lib/public-content";

export const dynamic = "force-dynamic";

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

export default async function Home() {
  const pageData = await getPublicPage("home");

  // Resolve published events for the homepage events_newsletter section.
  let eventsItems: HomeEventItem[] = [];
  let eventsError = false;
  try {
    const res = await getPublicEvents();
    if (!res.error) {
      eventsItems = res.items.map((e) => ({
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
      }));
    } else {
      eventsError = true;
    }
  } catch {
    eventsError = true;
  }

  // Resolve featured research/publications for the homepage featured_research
  // section. The section reads resolved items from section.content.featuredItems.
  let featuredItems: HomeFeaturedItem[] = [];
  let featuredError = false;
  try {
    const limit = 6;
    const res = await getPublicResearch();
    if (!res.error) {
      featuredItems = res.items.slice(0, limit).map((r) => ({
        slug: r.slug,
        title: r.title,
        titleBn: r.titleBn,
        description: r.description,
        descriptionBn: r.descriptionBn,
        category: r.category,
        type: r.category,
        dateLabel: r.dateLabel,
        href: `/research/${r.slug}`,
      }));
    } else {
      featuredError = true;
    }
  } catch {
    featuredError = true;
  }

  const sectionsWithData = Array.isArray(pageData?.sections)
    ? pageData.sections.map((sec: any) => {
      if (sec.type === "events_newsletter") {
        const content = typeof sec.content === "object" ? sec.content : {};
        return {
          ...sec,
          content: { ...content, events: eventsItems, eventsError },
        };
      }
      if (sec.type === "featured_research") {
        const content = typeof sec.content === "object" ? sec.content : {};
        return {
          ...sec,
          content: { ...content, featuredItems, featuredError },
        };
      }
      return sec;
    })
    : [];

  return (
    <HomeClient
      header={<SiteHeader />}
      footer={<SiteFooter />}
      pageData={{ ...pageData, sections: sectionsWithData }}
    />
  );
}

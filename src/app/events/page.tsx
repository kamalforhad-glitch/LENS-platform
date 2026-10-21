import type { Metadata } from "next";
import EventsContent from "./EventsContent";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import { getPublicEvents } from "@/lib/public-content";
import { getPublicPage, type PublicSectionData } from "@/lib/actions/cms";
import { resolveSectionItems } from "@/components/page/resolveSectionItems";
import type { SectionWithResolved } from "@/components/page/PageSectionsView";
import CmsPageView from "@/components/page/CmsPageView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Events",
  description: "Workshops, summits, conferences and community events by LENS to strengthen Bangladesh's narrative ecosystem.",
};

async function resolveCmsSections(sections: PublicSectionData[]) {
  return Promise.all(
    sections.map(async (s) => ({
      ...s,
      resolved: await resolveSectionItems(s.type, s.content).catch(() => ({ items: [] })),
    }))
  );
}

export default async function EventsPage() {
  const cms = await getPublicPage("events");
  if (cms) {
    const sections: SectionWithResolved[] = await resolveCmsSections(cms.sections);
    return <CmsPageView page={{ id: cms.id, slug: cms.slug, title: cms.title, sections }} />;
  }

  const { items: events, error } = await getPublicEvents();

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-24">
        <EventsContent events={events} error={error} />
      </main>
      <SiteFooter />
    </>
  );
}

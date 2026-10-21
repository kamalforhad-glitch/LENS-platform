import type { Metadata } from "next";
import AboutContent from "./AboutContent";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import { getPublicPage, type PublicSectionData } from "@/lib/actions/cms";
import { resolveSectionItems } from "@/components/page/resolveSectionItems";
import type { SectionWithResolved } from "@/components/page/PageSectionsView";
import CmsPageView from "@/components/page/CmsPageView";

export const metadata: Metadata = {
  title: "About LENS — Our Mission, Values & Team",
  description: "Learn about LENS, a research-driven think tank working to strengthen Bangladesh's narrative ecosystem through evidence, media literacy and policy engagement.",
};

async function resolveCmsSections(sections: PublicSectionData[]) {
  return Promise.all(
    sections.map(async (s) => ({
      ...s,
      resolved: await resolveSectionItems(s.type, s.content).catch(() => ({ items: [] })),
    }))
  );
}

export default async function AboutPage() {
  const cms = await getPublicPage("about");
  if (cms) {
    const sections: SectionWithResolved[] = await resolveCmsSections(cms.sections);
    return <CmsPageView page={{ id: cms.id, slug: cms.slug, title: cms.title, sections }} />;
  }
  // Hardcoded fallback — shown until a CMS page at this slug is published.
  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-24">
        <AboutContent />
      </main>
      <SiteFooter />
    </>
  );
}

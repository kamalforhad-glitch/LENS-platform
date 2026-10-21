import type { Metadata } from "next";
import { Suspense } from "react";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import LibraryContent from "./LibraryContent";
import { getPublicPage, type PublicSectionData } from "@/lib/actions/cms";
import { resolveSectionItems } from "@/components/page/resolveSectionItems";
import type { SectionWithResolved } from "@/components/page/PageSectionsView";
import CmsPageView from "@/components/page/CmsPageView";

export const metadata: Metadata = {
  title: "Research Library",
  description: "Explore our digital knowledge archive of research reports, policy briefs and working papers.",
};

async function resolveCmsSections(sections: PublicSectionData[]) {
  return Promise.all(
    sections.map(async (s) => ({
      ...s,
      resolved: await resolveSectionItems(s.type, s.content).catch(() => ({ items: [] })),
    }))
  );
}

export default async function ResearchLibraryPage() {
  const cms = await getPublicPage("library");
  if (cms) {
    const sections: SectionWithResolved[] = await resolveCmsSections(cms.sections);
    return <CmsPageView page={{ id: cms.id, slug: cms.slug, title: cms.title, sections }} />;
  }

  // Hardcoded fallback — shown until a CMS page at this slug is published.
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="flex-1">
        <Suspense fallback={<div className="min-h-screen bg-navy-950 flex items-center justify-center text-white">Loading...</div>}>
          <LibraryContent />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}

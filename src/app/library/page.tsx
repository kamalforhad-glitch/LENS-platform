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

/**
 * Non-blocking shell for the `useSearchParams()` Suspense boundary: keeps the
 * hero/search chrome on screen instead of blanking the whole page.
 */
function LibrarySkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-navy-950 via-[#061224] to-navy-950">
      <div className="relative pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="h-3 w-56 mx-auto rounded bg-white/[0.06] animate-pulse" />
            <div className="h-10 w-72 mx-auto mt-4 rounded-lg bg-white/[0.08] animate-pulse" />
            <div className="h-4 w-full max-w-2xl mx-auto mt-4 rounded bg-white/[0.04] animate-pulse" />
          </div>
          <div className="h-14 w-full max-w-2xl mx-auto rounded-2xl bg-white/[0.05] border border-white/10 animate-pulse" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 shrink-0 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />
            ))}
          </aside>
          <div className="flex-1 grid sm:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-56 rounded-2xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function ResearchLibraryPage() {
  const cms = await getPublicPage("library");
  if (cms) {
    const sections: SectionWithResolved[] = await resolveCmsSections(cms.sections);
    return (
      <CmsPageView
        page={{
          id: cms.id,
          slug: cms.slug,
          title: cms.title,
          titleBn: cms.titleBn,
          description: cms.description,
          descriptionBn: cms.descriptionBn,
          sections,
          hierarchy: cms.hierarchy,
          breadcrumbs: cms.breadcrumbs,
        }}
      />
    );
  }

  // Hardcoded fallback — shown until a CMS page at this slug is published.
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="flex-1">
        <Suspense fallback={<LibrarySkeleton />}>
          <LibraryContent />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}

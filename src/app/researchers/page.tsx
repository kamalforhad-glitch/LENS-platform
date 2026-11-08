import type { Metadata } from "next";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import ResearchersContent from "./ResearchersContent";
import { getPublicPage, type PublicSectionData } from "@/lib/actions/cms";
import { getPublicResearchers } from "@/lib/public-content";
import { resolveSectionItems } from "@/components/page/resolveSectionItems";
import type { SectionWithResolved } from "@/components/page/PageSectionsView";
import CmsPageView from "@/components/page/CmsPageView";

export const metadata: Metadata = {
  title: "Researcher Network",
  description: "Meet our affiliated researchers and their contributions to media studies in Bangladesh.",
};

async function resolveCmsSections(sections: PublicSectionData[]) {
  return Promise.all(
    sections.map(async (s) => ({
      ...s,
      resolved: await resolveSectionItems(s.type, s.content).catch(() => ({ items: [] })),
    }))
  );
}

export default async function ResearchersPage() {
  const cms = await getPublicPage("researchers");
  if (cms) {
    const sections: SectionWithResolved[] = await resolveCmsSections(cms.sections);
    return <CmsPageView page={{ id: cms.id, slug: cms.slug, title: cms.title, sections }} />;
  }

  // Server-side fetch of active researchers with bilingual fields.
  // Falls back to client-side ResearchersContent if the fetch fails.
  let researchers: any[] = [];
  let researchersError = false;
  try {
    const res = await getPublicResearchers();
    if (!res.error) {
      researchers = res.items;
    } else {
      researchersError = true;
    }
  } catch {
    researchersError = true;
  }

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="flex-1">
        <ResearchersContent initialResearchers={researchers} researchersError={researchersError} />
      </main>
      <SiteFooter />
    </>
  );
}

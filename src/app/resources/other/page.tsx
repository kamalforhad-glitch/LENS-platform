import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import PageHero from "@/components/site/PageHero";
import SectionSubnav from "@/components/site/SectionSubnav";
import ContentListState from "@/components/ContentListState";
import { getPublicResources } from "@/lib/public-content";
import { isOverflowResource } from "@/lib/resource-taxonomy";
import { getPublicPage, type PublicSectionData } from "@/lib/actions/cms";
import { resolveSectionItems } from "@/components/page/resolveSectionItems";
import type { SectionWithResolved } from "@/components/page/PageSectionsView";
import CmsPageView from "@/components/page/CmsPageView";
import { Layers, ArrowRight, FolderKanban } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Other Resources & Toolkits — LENS",
  description:
    "Additional LENS resources — datasets, tools, guides and materials outside the named collections.",
};

async function resolveCmsSections(sections: PublicSectionData[]) {
  return Promise.all(
    sections.map(async (s) => ({
      ...s,
      resolved: await resolveSectionItems(s.type, s.content).catch(() => ({ items: [] })),
    }))
  );
}

export default async function OtherResourcesPage() {
  const cms = await getPublicPage("resources/other");
  if (cms) {
    const sections: SectionWithResolved[] = await resolveCmsSections(cms.sections);
    return <CmsPageView page={{ id: cms.id, slug: cms.slug, title: cms.title, sections }} />;
  }

  const { items: resources, error } = await getPublicResources();
  const items = resources.filter((r) => isOverflowResource(r.category));

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-24">
        <PageHero
          accent="emerald"
          eyebrow="Resources Hub"
          title="Datasets, Toolkits & Guides"
          description="Specialized civic toolkits, open research datasets, methodology guides, and educational materials supporting media literacy in Bangladesh."
          badge={
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Layers className="w-3.5 h-3.5" />
              Toolkits & Guides
            </span>
          }
          breadcrumbItems={[
            { label: "Home", href: "/" },
            { label: "Resources", href: "/resources" },
            { label: "Other" },
          ]}
        />

        <SectionSubnav section="resources" activeHref="/resources/other" />

        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {items.length === 0 ? (
              <ContentListState
                variant={error ? "error" : "empty"}
                accent="emerald"
                icon={<Layers className="w-6 h-6 text-emerald-600" />}
                emptyMessage="Technical toolkits, public datasets, and guides are being formatted for download."
                action={
                  <Link
                    href="/resources"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-xs"
                  >
                    <FolderKanban className="w-3.5 h-3.5" />
                    View All Resources
                  </Link>
                }
              />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {items.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/resources/${item.slug}`}
                    className="group relative flex flex-col p-7 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-lg hover:border-emerald-200 hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <span className="inline-block text-[10px] font-bold tracking-[0.15em] uppercase text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                        {item.category}
                      </span>
                    </div>

                    <h2 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-emerald-600 transition-colors leading-snug">
                      {item.title}
                    </h2>

                    <p className="text-xs text-slate-500 leading-relaxed flex-1 line-clamp-3 mb-6">
                      {item.description}
                    </p>

                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform pt-4 border-t border-slate-100">
                      <span>Access Material</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

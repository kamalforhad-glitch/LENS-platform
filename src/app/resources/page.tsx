import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import PageHero from "@/components/site/PageHero";
import SectionSubnav from "@/components/site/SectionSubnav";
import ContentListState from "@/components/ContentListState";
import { getPublicResources } from "@/lib/public-content";
import { RESOURCE_TAXONOMY_VIEWS } from "@/lib/resource-taxonomy";
import { getPublicPage, type PublicSectionData } from "@/lib/actions/cms";
import { resolveSectionItems } from "@/components/page/resolveSectionItems";
import type { SectionWithResolved } from "@/components/page/PageSectionsView";
import CmsPageView from "@/components/page/CmsPageView";
import InstitutionalCta from "@/components/page/InstitutionalCta";
import {
  FolderKanban,
  Vote,
  BookOpen,
  Newspaper,
  Layers,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Research & Resources — LENS",
  description:
    "LENS resources — research tools, datasets, media literacy guides, and educational materials for journalists, researchers, and civil society.",
};

const TAXONOMY_ICONS: Record<string, typeof Vote> = {
  election: Vote,
  publications: BookOpen,
  media: Newspaper,
  other: Layers,
};

async function resolveCmsSections(sections: PublicSectionData[]) {
  return Promise.all(
    sections.map(async (s) => ({
      ...s,
      resolved: await resolveSectionItems(s.type, s.content).catch(() => ({ items: [] })),
    }))
  );
}

export default async function ResourcesPage() {
  const cms = await getPublicPage("resources");
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

  const { items: resources, error } = await getPublicResources();

  const categories = new Map<string, typeof resources>();
  for (const resource of resources) {
    const key = resource.category || "Other";
    if (!categories.has(key)) categories.set(key, []);
    categories.get(key)!.push(resource);
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-24">
        <PageHero
          accent="emerald"
          eyebrow="Knowledge & Datasets"
          title="Open Research Resources"
          description="Access our empirical research tools, open datasets, media literacy guides, and methodological reference materials for researchers, journalists, and civic advocates."
          badge={
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <FolderKanban className="w-3.5 h-3.5" />
              Open Knowledge Base
            </span>
          }
          breadcrumbItems={[{ label: "Home", href: "/" }, { label: "Resources" }]}
        />

        <SectionSubnav section="resources" activeHref="/resources" />

        {/* Taxonomy Collections Cards */}
        <section className="py-16 sm:py-20 bg-white border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-emerald-600 mb-3 block">
                Resource Taxonomy
              </span>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                Curated Collections
              </h2>
              <p className="mt-3 text-slate-600 text-base">
                Explore specialized repositories tailored for electoral integrity, scholarly publications, and media releases.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {RESOURCE_TAXONOMY_VIEWS.map((view) => {
                const Icon = TAXONOMY_ICONS[view.slug] || FolderKanban;
                return (
                  <Link
                    key={view.slug}
                    href={view.href}
                    className="group relative flex flex-col p-7 rounded-3xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-emerald-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mb-5 shadow-2xs group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors">
                      {view.name}
                    </h3>

                    <p className="text-xs text-slate-500 leading-relaxed flex-1 mb-6">
                      {view.description}
                    </p>

                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform">
                      <span>View Collection</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Grouped Catalog View */}
        <section className="py-20 bg-slate-50/70">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4 mb-12">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Resource Library Index
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Categorized repository of all public toolkits, guides, and research materials.
                </p>
              </div>
            </div>

            {resources.length === 0 ? (
              <ContentListState
                variant={error ? "error" : "empty"}
                accent="emerald"
                icon={<FolderKanban className="w-6 h-6 text-emerald-600" />}
                emptyMessage="Resource toolkits, datasets, and guides are currently being packaged for open access."
              />
            ) : (
              <div className="space-y-14">
                {Array.from(categories.entries()).map(([category, items]) => (
                  <div key={category} className="space-y-6">
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <h3 className="text-xl font-bold text-slate-900 tracking-tight">{category}</h3>
                      <span className="text-xs font-bold text-slate-400 font-mono">({items.length})</span>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

                          <h4 className="text-base font-bold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors leading-snug">
                            {item.title}
                          </h4>

                          <p className="text-xs text-slate-500 leading-relaxed flex-1 line-clamp-3 mb-6">
                            {item.description}
                          </p>

                          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform pt-4 border-t border-slate-100">
                            <span>Open Resource</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Institutional Closing CTA */}
        <InstitutionalCta section="resources" />
      </main>
      <SiteFooter />
    </>
  );
}

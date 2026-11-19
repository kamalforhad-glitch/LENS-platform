import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import PageHero from "@/components/site/PageHero";
import SectionSubnav from "@/components/site/SectionSubnav";
import ContentListState from "@/components/ContentListState";
import { getPublicResources } from "@/lib/public-content";
import { RESOURCE_ELECTION_CATEGORY } from "@/lib/resource-taxonomy";
import { getPublicPage, type PublicSectionData } from "@/lib/actions/cms";
import { resolveSectionItems } from "@/components/page/resolveSectionItems";
import type { SectionWithResolved } from "@/components/page/PageSectionsView";
import CmsPageView from "@/components/page/CmsPageView";
import {
  Vote,
  ShieldCheck,
  Search,
  Scale,
  Newspaper,
  ArrowRight,
  FolderKanban,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Election Resources & Monitoring — LENS",
  description:
    "LENS election-related resources, verification guides, media legal frameworks and monitoring toolkits for journalists and researchers.",
};

const electionToolkits = [
  {
    icon: Search,
    title: "Electoral Disinformation Monitoring",
    description:
      "Methodologies and checklists for tracking coordinated viral smear campaigns, deepfake political media, and voting misinformation.",
  },
  {
    icon: Scale,
    title: "Media Regulations & Election Laws",
    description:
      "Clear legal digests translating Election Commission guidelines, reporting accreditation rights, and journalist protection statutes.",
  },
  {
    icon: ShieldCheck,
    title: "Journalist Safety at the Polls",
    description:
      "Physical and digital risk mitigation protocols for correspondents and mobile crews covering high-tension political rallies.",
  },
  {
    icon: Newspaper,
    title: "Voter Literacy & Candidate Trackers",
    description:
      "Evidence-backed toolkits and infographics empowering civic organizations and newsrooms to produce nonpartisan voter guides.",
  },
];

async function resolveCmsSections(sections: PublicSectionData[]) {
  return Promise.all(
    sections.map(async (s) => ({
      ...s,
      resolved: await resolveSectionItems(s.type, s.content).catch(() => ({ items: [] })),
    }))
  );
}

export default async function ElectionResourcesPage() {
  const cms = await getPublicPage("resources/election");
  if (cms) {
    const sections: SectionWithResolved[] = await resolveCmsSections(cms.sections);
    return <CmsPageView page={{ id: cms.id, slug: cms.slug, title: cms.title, sections }} />;
  }

  const { items: resources, error } = await getPublicResources();
  const items = resources.filter((r) => r.category === RESOURCE_ELECTION_CATEGORY);

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-24">
        <PageHero
          accent="emerald"
          eyebrow="Resources & Civic Integrity"
          title="Election Integrity Resources"
          description="Specialized investigative toolkits, legal frameworks, and verification protocols dedicated to safeguarding democratic elections and transparent coverage in Bangladesh."
          badge={
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Vote className="w-3.5 h-3.5" />
              Civic & Electoral Integrity
            </span>
          }
          breadcrumbItems={[
            { label: "Home", href: "/" },
            { label: "Resources", href: "/resources" },
            { label: "Election" },
          ]}
        />

        <SectionSubnav section="resources" activeHref="/resources/election" />

        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {items.length === 0 ? (
              <div className="space-y-16">
                <ContentListState
                  variant={error ? "error" : "empty"}
                  accent="emerald"
                  icon={<Vote className="w-6 h-6 text-emerald-600" />}
                  emptyMessage="Dedicated election guides, datasets, and field checklists will be released here during active election cycles."
                  action={
                    <Link
                      href="/resources"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-xs"
                    >
                      <FolderKanban className="w-3.5 h-3.5" />
                      Browse General Resources
                    </Link>
                  }
                />

                {/* Focus Areas Framework */}
                <div className="rounded-3xl bg-slate-50/80 border border-slate-200/80 p-8 sm:p-12">
                  <div className="text-center max-w-2xl mx-auto mb-10">
                    <span className="text-xs font-bold tracking-[0.2em] uppercase text-emerald-600 mb-2 block">
                      Monitoring Scope
                    </span>
                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                      Election Integrity Focus Areas
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      The core analytical tools LENS researchers deploy during national and local elections.
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    {electionToolkits.map((toolkit) => {
                      const Icon = toolkit.icon;
                      return (
                        <div
                          key={toolkit.title}
                          className="flex items-start gap-5 p-6 rounded-2xl bg-white border border-slate-200/70 shadow-2xs hover:border-emerald-200 transition-all"
                        >
                          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-slate-900 mb-1.5 leading-snug">
                              {toolkit.title}
                            </h4>
                            <p className="text-xs text-slate-500 leading-relaxed">
                              {toolkit.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
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
                      <span>Access Toolkit</span>
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

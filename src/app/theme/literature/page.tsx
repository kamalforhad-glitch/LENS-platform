import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import PageHero from "@/components/site/PageHero";
import SectionSubnav from "@/components/site/SectionSubnav";
import ContentListState from "@/components/ContentListState";
import { getPublicResources } from "@/lib/public-content";
import { getPublicPage, type PublicSectionData } from "@/lib/actions/cms";
import { resolveSectionItems } from "@/components/page/resolveSectionItems";
import type { SectionWithResolved } from "@/components/page/PageSectionsView";
import CmsPageView from "@/components/page/CmsPageView";
import { BookOpen, ArrowRight, Library, FileText, Bookmark, GraduationCap } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Curated Literature — LENS",
  description:
    "Curated reading and reference resources supporting media studies and narrative research in Bangladesh.",
};

const LITERATURE_CATEGORIES = ["Literature"];

const readingTracks = [
  {
    icon: GraduationCap,
    title: "Media Systems in South Asia",
    desc: "Foundational academic papers on press ownership, patronage networks, and commercial media structures.",
  },
  {
    icon: Bookmark,
    title: "Propaganda & Disinformation",
    desc: "Seminal texts detailing narrative framing, behavioral microtargeting, and digital influence mechanics.",
  },
  {
    icon: FileText,
    title: "Civic Journalism & Field Verification",
    desc: "Methodological manuals and guides on OSINT investigative protocols and source verification.",
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

export default async function ThemeLiteraturePage() {
  const cms = await getPublicPage("theme/literature");
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
  const items = resources.filter((r) => LITERATURE_CATEGORIES.includes(r.category));

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-24">
        <PageHero
          accent="teal"
          eyebrow="Thematic Framework"
          title="Scholarly Literature & Reading"
          description="Curated bibliographies, foundational academic texts, and reference reading lists supporting media studies, narrative theory, and democratic discourse."
          badge={
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
              <BookOpen className="w-3.5 h-3.5" />
              Curated References
            </span>
          }
          breadcrumbItems={[
            { label: "Home", href: "/" },
            { label: "Theme", href: "/theme" },
            { label: "Literature" },
          ]}
        />

        <SectionSubnav section="theme" activeHref="/theme/literature" />

        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {items.length === 0 ? (
              <div className="space-y-16">
                <ContentListState
                  variant={error ? "error" : "empty"}
                  accent="teal"
                  icon={<BookOpen className="w-6 h-6 text-teal-600" />}
                  emptyMessage="Curated reading lists and academic reference guides are currently being compiled by our research team."
                  action={
                    <Link
                      href="/library"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-teal-600 text-white hover:bg-teal-500 transition-colors shadow-xs"
                    >
                      <Library className="w-3.5 h-3.5" />
                      Explore Full Digital Library
                    </Link>
                  }
                />

                <div className="rounded-3xl bg-slate-50/80 border border-slate-200/80 p-8 sm:p-12">
                  <div className="text-center max-w-2xl mx-auto mb-10">
                    <span className="text-xs font-bold tracking-[0.2em] uppercase text-teal-600 mb-2 block">
                      Curated Syllabi in Preparation
                    </span>
                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                      Forthcoming Reading Tracks
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      Our researchers are annotating reading lists across three foundational disciplines.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    {readingTracks.map((track) => {
                      const Icon = track.icon;
                      return (
                        <div
                          key={track.title}
                          className="flex flex-col p-6 rounded-2xl bg-white border border-slate-200/70 shadow-2xs"
                        >
                          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center mb-4">
                            <Icon className="w-5 h-5" />
                          </div>
                          <h4 className="text-base font-bold text-slate-900 mb-2 leading-snug">
                            {track.title}
                          </h4>
                          <p className="text-xs text-slate-500 leading-relaxed flex-1">
                            {track.desc}
                          </p>
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
                    className="group relative flex flex-col p-7 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-lg hover:border-teal-200 hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <span className="inline-block text-[10px] font-bold tracking-[0.15em] uppercase text-teal-600 bg-teal-50 border border-teal-100 px-2.5 py-1 rounded-full">
                        {item.category}
                      </span>
                    </div>

                    <h2 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-teal-600 transition-colors leading-snug">
                      {item.title}
                    </h2>

                    <p className="text-xs text-slate-500 leading-relaxed flex-1 line-clamp-3 mb-6">
                      {item.description}
                    </p>

                    <div className="flex items-center gap-2 text-xs font-bold text-teal-600 group-hover:translate-x-1 transition-transform pt-4 border-t border-slate-100">
                      <span>View Reading Reference</span>
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

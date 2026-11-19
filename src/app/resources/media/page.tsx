import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import PageHero from "@/components/site/PageHero";
import SectionSubnav from "@/components/site/SectionSubnav";
import ContentListState from "@/components/ContentListState";
import { formatMonthYear, getPublicMediaItems } from "@/lib/public-content";
import { getPublicPage, type PublicSectionData } from "@/lib/actions/cms";
import { resolveSectionItems } from "@/components/page/resolveSectionItems";
import type { SectionWithResolved } from "@/components/page/PageSectionsView";
import CmsPageView from "@/components/page/CmsPageView";
import { Newspaper, Calendar, ArrowRight, Radio } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Media Hub — LENS Resources",
  description:
    "LENS media resources — press releases, interviews, statements and media coverage. Detail pages remain canonical at /media/[slug].",
};

async function resolveCmsSections(sections: PublicSectionData[]) {
  return Promise.all(
    sections.map(async (s) => ({
      ...s,
      resolved: await resolveSectionItems(s.type, s.content).catch(() => ({ items: [] })),
    }))
  );
}

export default async function ResourceMediaPage() {
  const cms = await getPublicPage("resources/media");
  if (cms) {
    const sections: SectionWithResolved[] = await resolveCmsSections(cms.sections);
    return <CmsPageView page={{ id: cms.id, slug: cms.slug, title: cms.title, sections }} />;
  }

  const { items: mediaItems, error } = await getPublicMediaItems();

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-24">
        <PageHero
          accent="emerald"
          eyebrow="Resources Hub"
          title="Media & Press Releases"
          description="Official press statements, media interviews, institutional briefings, and press coverage from LENS researchers and leadership."
          badge={
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Newspaper className="w-3.5 h-3.5" />
              Press & Statements
            </span>
          }
          breadcrumbItems={[
            { label: "Home", href: "/" },
            { label: "Resources", href: "/resources" },
            { label: "Media" },
          ]}
          actions={
            <Link
              href="/media"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold border border-white/20 text-white hover:border-emerald-400 hover:text-emerald-300 hover:bg-white/5 transition-all shadow-xs"
            >
              <Radio className="w-4 h-4" />
              Full Media Archive
            </Link>
          }
        />

        <SectionSubnav section="resources" activeHref="/resources/media" />

        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {mediaItems.length === 0 ? (
              <ContentListState
                variant={error ? "error" : "empty"}
                accent="emerald"
                icon={<Newspaper className="w-6 h-6 text-emerald-600" />}
                emptyMessage="Official press announcements and media statements will appear here upon distribution."
                action={
                  <Link
                    href="/media"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-xs"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    Visit Media Center
                  </Link>
                }
              />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {mediaItems.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/media/${item.slug}`}
                    className="group relative flex flex-col p-7 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-lg hover:border-emerald-200 hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <span className="inline-block text-[10px] font-bold tracking-[0.15em] uppercase text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                        {item.type.replace(/_/g, " ")}
                      </span>
                      {item.datePublished && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatMonthYear(item.datePublished)}</span>
                        </div>
                      )}
                    </div>

                    <h2 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-emerald-600 transition-colors leading-snug">
                      {item.title}
                    </h2>

                    <p className="text-xs text-slate-500 leading-relaxed flex-1 line-clamp-3 mb-6">
                      {item.description}
                    </p>

                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform pt-4 border-t border-slate-100">
                      <span>Read Release</span>
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

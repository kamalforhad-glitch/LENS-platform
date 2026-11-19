import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import PageHero from "@/components/site/PageHero";
import SectionSubnav from "@/components/site/SectionSubnav";
import ContentListState from "@/components/ContentListState";
import { formatMonthYear, getPublicPublications } from "@/lib/public-content";
import { getPublicPage, type PublicSectionData } from "@/lib/actions/cms";
import { resolveSectionItems } from "@/components/page/resolveSectionItems";
import type { SectionWithResolved } from "@/components/page/PageSectionsView";
import CmsPageView from "@/components/page/CmsPageView";
import { BookOpen, Calendar, ArrowRight, Library } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Publications Hub — LENS Resources",
  description:
    "LENS publications — policy briefs, working papers and research reports. Detail pages remain canonical at /publications/[slug].",
};

async function resolveCmsSections(sections: PublicSectionData[]) {
  return Promise.all(
    sections.map(async (s) => ({
      ...s,
      resolved: await resolveSectionItems(s.type, s.content).catch(() => ({ items: [] })),
    }))
  );
}

export default async function ResourcePublicationsPage() {
  const cms = await getPublicPage("resources/publications");
  if (cms) {
    const sections: SectionWithResolved[] = await resolveCmsSections(cms.sections);
    return <CmsPageView page={{ id: cms.id, slug: cms.slug, title: cms.title, sections }} />;
  }

  const { items: publications, error } = await getPublicPublications();

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-24">
        <PageHero
          accent="emerald"
          eyebrow="Resources Hub"
          title="Scholarly Publications"
          description="Access LENS policy briefs, analytical working papers, and comprehensive research reports advancing media reform in Bangladesh."
          badge={
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <BookOpen className="w-3.5 h-3.5" />
              Policy Briefs & Reports
            </span>
          }
          breadcrumbItems={[
            { label: "Home", href: "/" },
            { label: "Resources", href: "/resources" },
            { label: "Publications" },
          ]}
          actions={
            <Link
              href="/publications"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold border border-white/20 text-white hover:border-emerald-400 hover:text-emerald-300 hover:bg-white/5 transition-all shadow-xs"
            >
              <Library className="w-4 h-4" />
              Publications Archive
            </Link>
          }
        />

        <SectionSubnav section="resources" activeHref="/resources/publications" />

        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {publications.length === 0 ? (
              <ContentListState
                variant={error ? "error" : "empty"}
                accent="emerald"
                icon={<BookOpen className="w-6 h-6 text-emerald-600" />}
                emptyMessage="Official policy briefs and working papers are currently in editorial peer review."
                action={
                  <Link
                    href="/publications"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-xs"
                  >
                    <Library className="w-3.5 h-3.5" />
                    Visit Publications Index
                  </Link>
                }
              />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {publications.map((pub) => (
                  <Link
                    key={pub.slug}
                    href={`/publications/${pub.slug}`}
                    className="group relative flex flex-col p-7 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-lg hover:border-emerald-200 hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <span className="inline-block text-[10px] font-bold tracking-[0.15em] uppercase text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                        {pub.type}
                      </span>
                      {pub.datePublished && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatMonthYear(pub.datePublished)}</span>
                        </div>
                      )}
                    </div>

                    <h2 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-emerald-600 transition-colors leading-snug">
                      {pub.title}
                    </h2>

                    <p className="text-xs text-slate-500 leading-relaxed flex-1 line-clamp-3 mb-6">
                      {pub.description}
                    </p>

                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform pt-4 border-t border-slate-100">
                      <span>Read Publication</span>
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

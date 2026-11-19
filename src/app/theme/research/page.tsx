import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import PageHero from "@/components/site/PageHero";
import SectionSubnav from "@/components/site/SectionSubnav";
import ContentListState from "@/components/ContentListState";
import { formatMonthYear, getPublicResearch } from "@/lib/public-content";
import { getPublicPage, type PublicSectionData } from "@/lib/actions/cms";
import { resolveSectionItems } from "@/components/page/resolveSectionItems";
import type { SectionWithResolved } from "@/components/page/PageSectionsView";
import CmsPageView from "@/components/page/CmsPageView";
import {
  BarChart3,
  Calendar,
  ArrowRight,
  Library,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Evidence-Based Research — LENS",
  description:
    "Evidence-based research on media literacy, press freedom, narrative analysis, policy advocacy and cybersecurity in Bangladesh.",
};

async function resolveCmsSections(sections: PublicSectionData[]) {
  return Promise.all(
    sections.map(async (s) => ({
      ...s,
      resolved: await resolveSectionItems(s.type, s.content).catch(() => ({ items: [] })),
    }))
  );
}

const researchThemesSummary = [
  {
    title: "Media Ecosystem Analytics",
    desc: "Rigorous longitudinal data on media ownership, audience trust, and advertising shifts.",
  },
  {
    title: "Disinformation & Influence Operations",
    desc: "Forensic analysis of computational propaganda, coordinated networks, and bot behaviors.",
  },
  {
    title: "Digital Freedom & Civic Space",
    desc: "Monitoring legislative controls, online censorship incidents, and cybersecurity policies.",
  },
];

export default async function ThemeResearchPage() {
  const cms = await getPublicPage("theme/research");
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

  const { items: articles, error } = await getPublicResearch();

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-24">
        <PageHero
          accent="teal"
          eyebrow="Thematic Framework"
          title="Evidence-Based Research"
          description="Empirical studies, longitudinal trend monitoring, and quantitative analysis examining Bangladesh's information landscape and democratic media integrity."
          badge={
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
              <BarChart3 className="w-3.5 h-3.5" />
              Empirical Studies
            </span>
          }
          breadcrumbItems={[
            { label: "Home", href: "/" },
            { label: "Theme", href: "/theme" },
            { label: "Research" },
          ]}
          actions={
            <Link
              href="/library"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold border border-white/20 text-white hover:border-teal-400 hover:text-teal-300 hover:bg-white/5 transition-all shadow-xs"
            >
              <Library className="w-4 h-4" />
              Advanced Library Search
            </Link>
          }
        />

        <SectionSubnav section="theme" activeHref="/theme/research" />

        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {articles.length === 0 ? (
              <div className="space-y-16">
                <ContentListState
                  variant={error ? "error" : "empty"}
                  accent="teal"
                  icon={<BarChart3 className="w-6 h-6 text-teal-600" />}
                  emptyMessage="Our latest empirical research papers and field studies are currently in final editorial review."
                  action={
                    <Link
                      href="/library"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-teal-600 text-white hover:bg-teal-500 transition-colors shadow-xs"
                    >
                      <Library className="w-3.5 h-3.5" />
                      Browse Digital Library
                    </Link>
                  }
                />

                <div className="rounded-3xl bg-slate-50/80 border border-slate-200/80 p-8 sm:p-12">
                  <div className="text-center max-w-2xl mx-auto mb-10">
                    <span className="text-xs font-bold tracking-[0.2em] uppercase text-teal-600 mb-2 block">
                      Active Investigation Lines
                    </span>
                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                      Core Research Agendas
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      Ongoing investigative inquiries currently deployed across our research fellows.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    {researchThemesSummary.map((theme) => (
                      <div
                        key={theme.title}
                        className="p-6 rounded-2xl bg-white border border-slate-200/70 shadow-2xs"
                      >
                        <h4 className="text-base font-bold text-slate-900 mb-2">
                          {theme.title}
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {theme.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {articles.map((article) => (
                  <Link
                    key={article.slug}
                    href={`/research/${article.slug}`}
                    className="group relative flex flex-col p-7 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-lg hover:border-teal-200 hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <span className="inline-block text-[10px] font-bold tracking-[0.15em] uppercase text-teal-600 bg-teal-50 border border-teal-100 px-2.5 py-1 rounded-full">
                        {article.category}
                      </span>
                      {article.datePublished && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatMonthYear(article.datePublished)}</span>
                        </div>
                      )}
                    </div>

                    <h2 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-teal-600 transition-colors leading-snug">
                      {article.title}
                    </h2>

                    <p className="text-xs text-slate-500 leading-relaxed flex-1 line-clamp-3 mb-6">
                      {article.description}
                    </p>

                    <div className="flex items-center gap-2 text-xs font-bold text-teal-600 group-hover:translate-x-1 transition-transform pt-4 border-t border-slate-100">
                      <span>Read Full Study</span>
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

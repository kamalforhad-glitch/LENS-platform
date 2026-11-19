import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import PageHero from "@/components/site/PageHero";
import SectionSubnav from "@/components/site/SectionSubnav";
import { getPublicPage, type PublicSectionData } from "@/lib/actions/cms";
import { resolveSectionItems } from "@/components/page/resolveSectionItems";
import type { SectionWithResolved } from "@/components/page/PageSectionsView";
import CmsPageView from "@/components/page/CmsPageView";
import InstitutionalCta from "@/components/page/InstitutionalCta";
import {
  Layers,
  BarChart3,
  BookOpen,
  Library,
  ArrowRight,
  ShieldCheck,
  Search,
  Cpu,
  GraduationCap,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Thematic Research Framework — LENS",
  description:
    "Evidence-based research themes on media literacy, press freedom, narrative analysis, policy advocacy and cybersecurity in Bangladesh.",
};

const mainThemes = [
  {
    title: "Research & Analysis",
    href: "/theme/research",
    icon: BarChart3,
    badge: "Empirical Studies",
    badgeColor: "text-teal-600 bg-teal-50 border-teal-200/80",
    description:
      "Original qualitative and quantitative research monitoring Bangladesh's evolving media landscape, information pollution, and institutional narrative trends.",
    tags: ["Disinformation", "Media Index", "Public Opinion"],
  },
  {
    title: "Curated Literature",
    href: "/theme/literature",
    icon: BookOpen,
    badge: "Scholarly References",
    badgeColor: "text-cyan-600 bg-cyan-50 border-cyan-200/80",
    description:
      "Curated reading lists, foundational texts, and academic bibliographies supporting media studies, communication theories, and civic technology.",
    tags: ["Reading Lists", "Communication Theory", "Methodology"],
  },
  {
    title: "Digital Knowledge Library",
    href: "/library",
    icon: Library,
    badge: "Searchable Archive",
    badgeColor: "text-emerald-600 bg-emerald-50 border-emerald-200/80",
    description:
      "The primary digital repository of LENS publications — search policy briefs, working papers, datasets, and interview transcripts with full-text discovery.",
    tags: ["Policy Briefs", "Datasets", "Working Papers"],
  },
];

const thematicDomains = [
  {
    icon: ShieldCheck,
    title: "Press Freedom & Media Policy",
    description: "Tracking legal restrictions, journalist safety violations, and regulatory reforms across national broadcasting and digital news.",
  },
  {
    icon: Search,
    title: "Information Disorder & OSINT",
    description: "Investigating coordinated influence operations, deepfake proliferation, and electoral propaganda through forensic open-source methods.",
  },
  {
    icon: Cpu,
    title: "Digital Rights & Algorithmic Ethics",
    description: "Examining internet shutdowns, surveillance technologies, algorithmic content suppression, and platform accountability.",
  },
  {
    icon: GraduationCap,
    title: "Critical Media Literacy & Youth",
    description: "Developing evidence-based educational modules that empower citizens to evaluate digital information critically.",
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

export default async function ThemePage() {
  const cms = await getPublicPage("theme");
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
      <main className="flex-1 pt-24">
        <PageHero
          accent="teal"
          eyebrow="Thematic Framework"
          title="Research & Knowledge Themes"
          description="How LENS organizes its intellectual and empirical work — from original field studies to curated scholarly literature to the searchable open-access archive."
          badge={
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
              <Layers className="w-3.5 h-3.5" />
              Knowledge Architecture
            </span>
          }
          breadcrumbItems={[{ label: "Home", href: "/" }, { label: "Theme" }]}
        />

        <SectionSubnav section="theme" activeHref="/theme" />

        {/* Core Portals */}
        <section className="py-20 bg-white border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-teal-600 mb-3 block">
                Explore The Collection
              </span>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                Knowledge Pillars
              </h2>
              <p className="mt-3 text-slate-600 text-base">
                Discover our analytical research, literature curation, and full-text archives.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {mainThemes.map((theme) => {
                const Icon = theme.icon;
                return (
                  <Link
                    key={theme.title}
                    href={theme.href}
                    className="group relative flex flex-col p-8 rounded-3xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-teal-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between gap-3 mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${theme.badgeColor}`}>
                        {theme.badge}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight group-hover:text-teal-600 transition-colors">
                      {theme.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed flex-1 mb-6">
                      {theme.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {theme.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-semibold text-slate-500 bg-white border border-slate-200/70 px-2 py-0.5 rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold text-teal-600 group-hover:translate-x-1 transition-transform">
                      <span>Explore Section</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Thematic Scope & Domains */}
        <section className="py-20 bg-slate-50/70">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-teal-600 mb-3 block">
                Research Horizons
              </span>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                Core Thematic Domains
              </h2>
              <p className="mt-3 text-slate-600 text-base">
                Key subject areas addressing structural information challenges in Bangladesh.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {thematicDomains.map((domain) => {
                const Icon = domain.icon;
                return (
                  <div
                    key={domain.title}
                    className="flex flex-col p-7 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:border-teal-200 hover:shadow-md transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center mb-4 shadow-2xs">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">
                      {domain.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed flex-1">
                      {domain.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Institutional Closing CTA */}
        <InstitutionalCta section="theme" />
      </main>
      <SiteFooter />
    </>
  );
}

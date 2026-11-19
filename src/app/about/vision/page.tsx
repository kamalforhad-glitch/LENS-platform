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
import {
  Compass,
  Sparkles,
  BarChart3,
  GraduationCap,
  ShieldCheck,
  Scale,
  Eye,
  FileCheck,
  Users,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Our Vision — LENS",
  description:
    "The LENS vision for Bangladesh's narrative ecosystem, alongside our verified mission, strategic pillars and core values.",
};

async function resolveCmsSections(sections: PublicSectionData[]) {
  return Promise.all(
    sections.map(async (s) => ({
      ...s,
      resolved: await resolveSectionItems(s.type, s.content).catch(() => ({ items: [] })),
    }))
  );
}

const strategicPillars = [
  {
    icon: BarChart3,
    title: "Empirical Research & Intelligence",
    description:
      "Deep-dive qualitative and quantitative studies tracking information flow, media ownership, and narrative polarization across digital and traditional press in Bangladesh.",
    accent: "from-blue-500/10 to-indigo-500/10 border-blue-200/80 text-blue-600",
  },
  {
    icon: GraduationCap,
    title: "Capacity Building & Training",
    description:
      "Hands-on fellowships, mobile journalism labs, and investigative verification academies empowering the next generation of journalists and researchers.",
    accent: "from-indigo-500/10 to-violet-500/10 border-indigo-200/80 text-indigo-600",
  },
  {
    icon: ShieldCheck,
    title: "Public Sphere Resilience",
    description:
      "Actionable policy engagement, press freedom advocacy, and civic resilience toolkits defending democratic speech and open media ecosystems.",
    accent: "from-teal-500/10 to-emerald-500/10 border-teal-200/80 text-teal-600",
  },
];

const institutionalValues = [
  {
    icon: FileCheck,
    title: "Evidence-Based",
    desc: "Every recommendation and report is anchored in rigorous methodology, verifiable data, and reproducible research standards.",
  },
  {
    icon: Scale,
    title: "Editorial Independence",
    desc: "We operate with strict autonomy, safeguarding our findings from partisan, corporate, or external pressures.",
  },
  {
    icon: Eye,
    title: "Radical Transparency",
    desc: "Our methodologies, funding sources, evaluation rubrics, and datasets are openly published for public scrutiny.",
  },
  {
    icon: Sparkles,
    title: "Measurable Impact",
    desc: "We measure institutional success by concrete policy improvements, journalistic safety advancements, and civic awareness.",
  },
];

export default async function VisionPage() {
  const cms = await getPublicPage("about/vision");
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
          accent="indigo"
          eyebrow="About LENS"
          title="Our Vision & Direction"
          description="Where LENS is headed — and the mission, strategic pillars, and institutional values that guide us there every day."
          badge={
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Compass className="w-3.5 h-3.5" />
              Strategic Blueprint
            </span>
          }
          breadcrumbItems={[
            { label: "Home", href: "/" },
            { label: "About", href: "/about" },
            { label: "Vision" },
          ]}
        />

        <SectionSubnav section="about" activeHref="/about/vision" />

        {/* Vision Executive Statement Section */}
        <section className="py-16 bg-white border-b border-slate-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-3xl bg-gradient-to-br from-indigo-900/5 via-slate-50 to-blue-50/40 p-8 sm:p-12 border border-indigo-100/80 shadow-sm overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-200/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

              <div className="relative z-10 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-100/70 border border-indigo-200/60 mb-5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Vision Roadmap
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4 tracking-tight">
                  A Resilient, Pluralistic Information Ecosystem for Bangladesh
                </h2>
                <p className="text-slate-600 text-base sm:text-lg leading-relaxed mb-6">
                  LENS envisions a society where public discourse is grounded in verified truth, media institutions are independent and economically sustainable, and citizens possess the analytical tools to critically navigate evolving narrative warfare.
                </p>
                <div className="rounded-2xl bg-white/90 backdrop-blur-xs border border-indigo-100 p-5 text-sm text-slate-500 leading-relaxed shadow-2xs">
                  <span className="font-semibold text-slate-800">Editorial Note:</span> The complete multi-year LENS Strategic Horizon paper is currently undergoing peer review by our advisory fellows and will be released in the upcoming publications cycle.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Strategic Pillars */}
        <section className="py-20 bg-slate-50/70 border-b border-slate-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-indigo-600 mb-3 block">
                How We Deliver
              </span>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                Our Strategic Pillars
              </h2>
              <p className="mt-3 text-slate-600 text-base">
                Three interconnected focus areas powering our day-to-day impact.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {strategicPillars.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <div
                    key={pillar.title}
                    className="relative flex flex-col p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-200 hover:-translate-y-1 transition-all duration-300"
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br ${pillar.accent} border shadow-2xs`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">
                      {pillar.title}
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed flex-1">
                      {pillar.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Institutional Values */}
        <section className="py-20 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-indigo-600 mb-3 block">
                Ethical Foundation
              </span>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                Core Operating Values
              </h2>
              <p className="mt-3 text-slate-600 text-base">
                The institutional principles that safeguard our research credibility.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {institutionalValues.map((val) => {
                const Icon = val.icon;
                return (
                  <div
                    key={val.title}
                    className="flex items-start gap-5 p-6 rounded-2xl bg-slate-50/60 border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-100/80 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-1.5">{val.title}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{val.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="mt-16 pt-10 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h4 className="text-base font-bold text-slate-900">Discover more about LENS</h4>
                <p className="text-sm text-slate-500">Explore our governance structures and meet the researchers.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/about/governance"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm shadow-indigo-500/20 transition-all"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Our Governance
                </Link>
                <Link
                  href="/about/team"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold border border-slate-200 text-slate-700 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/40 transition-all"
                >
                  <Users className="w-4 h-4" />
                  Meet the Team
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

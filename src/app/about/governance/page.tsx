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
  Shield,
  Scale,
  FileCheck,
  Building2,
  Users,
  CheckCircle2,
  Mail,
  Lock,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Governance — LENS",
  description:
    "How LENS is governed — leadership frameworks, research independence, and accountability standards.",
};

async function resolveCmsSections(sections: PublicSectionData[]) {
  return Promise.all(
    sections.map(async (s) => ({
      ...s,
      resolved: await resolveSectionItems(s.type, s.content).catch(() => ({ items: [] })),
    }))
  );
}

const governancePrinciples = [
  {
    icon: Lock,
    title: "Editorial & Research Autonomy",
    description:
      "All investigative reporting, data indexes, and policy recommendations are strictly insulated from commercial, political, and institutional sponsor influence.",
  },
  {
    icon: Scale,
    title: "Double-Blind Peer Review",
    description:
      "Flagship reports undergo rigorous evaluation by external academic reviewers and field experts before public distribution.",
  },
  {
    icon: FileCheck,
    title: "Open Methodology & Auditing",
    description:
      "Our research models, data sources, codebases, and questionnaire metrics are publicly documented to facilitate replication and peer scrutiny.",
  },
  {
    icon: Building2,
    title: "Civic Mandate & Accountability",
    description:
      "We operate under a public-interest civic trust, dedicated to advancing press freedom, digital safety, and narrative transparency in Bangladesh.",
  },
];

const governanceBodies = [
  {
    title: "Board of Trustees",
    role: "Fiduciary & Strategic Stewardship",
    description:
      "Oversees long-term institutional stability, legal compliance, and fiduciary health while safeguarding research independence.",
    badge: "In Constitution",
  },
  {
    title: "Advisory Council",
    role: "Academic & Editorial Guidance",
    description:
      "A consultative panel of senior researchers, jurists, media scholars, and civil society leaders providing domain insight.",
    badge: "In Formation",
  },
  {
    title: "Ethics & Integrity Committee",
    role: "Methodological & Conflict Oversight",
    description:
      "Independent panel evaluating research methodologies, human participant protections, and potential conflicts of interest.",
    badge: "In Formation",
  },
];

export default async function GovernancePage() {
  const cms = await getPublicPage("about/governance");
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

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-24">
        <PageHero
          accent="indigo"
          eyebrow="About LENS"
          title="Institutional Governance"
          description="The leadership, oversight structures, and accountability principles that protect our research independence and public-interest mandate."
          badge={
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Shield className="w-3.5 h-3.5" />
              Oversight Framework
            </span>
          }
          breadcrumbItems={[
            { label: "Home", href: "/" },
            { label: "About", href: "/about" },
            { label: "Governance" },
          ]}
        />

        <SectionSubnav section="about" activeHref="/about/governance" />

        {/* Operating Independence Charter */}
        <section className="py-16 bg-white border-b border-slate-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-navy-950 to-indigo-950 text-white p-8 sm:p-12 shadow-md overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-3xl">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 mb-5">
                  <Scale className="w-3.5 h-3.5" />
                  Independence Charter
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold mb-4 tracking-tight">
                  Independent Research. Uncompromising Standards.
                </h2>
                <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-6 font-normal">
                  LENS operates on a bedrock commitment: no funder, partner, or political entity exercises prior review, editorial veto, or direction over our findings, data collections, or public commentary.
                </p>
                <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-white/10 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Open Access Data</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Disclosed Funding Sources</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Conflict-of-Interest Disclosures</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Governance Principles Grid */}
        <section className="py-20 bg-slate-50/70 border-b border-slate-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-indigo-600 mb-3 block">
                Foundational Tenets
              </span>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                Governance Principles
              </h2>
              <p className="mt-3 text-slate-600 text-base">
                Four core standards guiding every investigation, policy brief, and training initiative.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-8">
              {governancePrinciples.map((principle) => {
                const Icon = principle.icon;
                return (
                  <div
                    key={principle.title}
                    className="flex flex-col p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-200 hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-6 shadow-2xs">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">
                      {principle.title}
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {principle.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Governance Structure Framework */}
        <section className="py-20 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-indigo-600 mb-3 block">
                Structural Architecture
              </span>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                Oversight Structure
              </h2>
              <p className="mt-3 text-slate-600 text-base">
                Organized under three deliberative pillars for transparent administration.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {governanceBodies.map((body) => (
                <div
                  key={body.title}
                  className="flex flex-col p-7 rounded-3xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-indigo-200 hover:shadow-sm transition-all duration-300"
                >
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-100/70 text-indigo-700">
                      {body.badge}
                    </span>
                    <Building2 className="w-4 h-4 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{body.title}</h3>
                  <p className="text-xs font-semibold text-indigo-600 mb-3">{body.role}</p>
                  <p className="text-xs text-slate-600 leading-relaxed flex-1">
                    {body.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Editorial Notice Banner */}
            <div className="mt-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-amber-900">Official Roster Announcement</h4>
                <p className="text-xs text-amber-800/80 mt-1 max-w-2xl">
                  Full biographies and institutional affiliations for our Board of Trustees and Advisory Council members will be announced upon formal charter certification.
                </p>
              </div>
              <Link
                href="/contact"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-amber-600 text-white hover:bg-amber-500 transition-colors shrink-0"
              >
                <Mail className="w-3.5 h-3.5" />
                Inquire With Us
              </Link>
            </div>

            {/* Footer Navigation CTA */}
            <div className="mt-16 pt-10 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h4 className="text-base font-bold text-slate-900">Explore LENS Leadership & Partners</h4>
                <p className="text-sm text-slate-500">Discover our team profiles and institutional partnerships.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/about/team"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm shadow-indigo-500/20 transition-all"
                >
                  <Users className="w-4 h-4" />
                  Our Team
                </Link>
                <Link
                  href="/about/partnerships"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold border border-slate-200 text-slate-700 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/40 transition-all"
                >
                  Our Partnerships
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

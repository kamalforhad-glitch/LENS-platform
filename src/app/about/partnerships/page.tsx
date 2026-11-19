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
  Handshake,
  GraduationCap,
  Newspaper,
  Users,
  Globe,
  Cpu,
  Building2,
  Mail,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Partnerships — LENS",
  description:
    "LENS partnerships with universities, media organizations, civil society, and international institutions to strengthen Bangladesh's narrative ecosystem.",
};

const partners = [
  {
    name: "University of Dhaka",
    type: "Academic",
    description: "Collaborative research on media studies, communication theories, and public discourse analytics.",
    icon: GraduationCap,
  },
  {
    name: "Bangladesh Journalists Safety Institute",
    type: "Media",
    description: "Joint initiatives on investigative journalist physical safety, legal defense, and digital operational security.",
    icon: Newspaper,
  },
  {
    name: "Transparency International Bangladesh",
    type: "Civil Society",
    description: "Empirical research on media ownership concentration, institutional transparency, and public integrity.",
    icon: Users,
  },
  {
    name: "UNESCO Bangladesh",
    type: "International",
    description: "National media literacy curricula development, journalist training, and press freedom monitoring programs.",
    icon: Globe,
  },
  {
    name: "Internet Society Bangladesh",
    type: "Technology",
    description: "Digital rights monitoring, internet governance research, and online censorship resilience frameworks.",
    icon: Cpu,
  },
  {
    name: "Centre for Policy Dialogue",
    type: "Think Tank",
    description: "Joint policy consultations and institutional advocacy on macroeconomic media sustainability and reform.",
    icon: Building2,
  },
];

const partnershipTypes = [
  { type: "Academic", count: 5, icon: GraduationCap, color: "text-blue-600 bg-blue-50 border-blue-200/80" },
  { type: "Media", count: 8, icon: Newspaper, color: "text-indigo-600 bg-indigo-50 border-indigo-200/80" },
  { type: "Civil Society", count: 12, icon: Users, color: "text-teal-600 bg-teal-50 border-teal-200/80" },
  { type: "International", count: 6, icon: Globe, color: "text-violet-600 bg-violet-50 border-violet-200/80" },
  { type: "Technology", count: 4, icon: Cpu, color: "text-cyan-600 bg-cyan-50 border-cyan-200/80" },
];

const collaborationSteps = [
  {
    step: "01",
    title: "Identify Shared Objectives",
    desc: "We align on research questions, capacity needs, or advocacy targets that deliver measurable public benefit.",
  },
  {
    step: "02",
    title: "Execute Joint Initiatives",
    desc: "Collaborative execution combining LENS empirical methodology with partner field experience and domain expertise.",
  },
  {
    step: "03",
    title: "Amplify Civic Impact",
    desc: "Publishing findings openly, briefing policymakers, and disseminating resources across civil society networks.",
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

export default async function AboutPartnershipsPage() {
  const cms = await getPublicPage("about/partnerships");
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
          title="Institutional Partnerships"
          description="LENS collaborates with universities, media organizations, civil society groups, and international institutions to amplify research impact and civic resilience."
          badge={
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Handshake className="w-3.5 h-3.5" />
              Collaborative Network
            </span>
          }
          breadcrumbItems={[
            { label: "Home", href: "/" },
            { label: "About", href: "/about" },
            { label: "Partnerships" },
          ]}
        />

        <SectionSubnav section="about" activeHref="/about/partnerships" />

        {/* Partnership Metric Highlights */}
        <section className="py-14 bg-slate-50 border-b border-slate-200/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {partnershipTypes.map((pt) => {
                const Icon = pt.icon;
                return (
                  <div
                    key={pt.type}
                    className="flex flex-col items-center text-center p-5 rounded-2xl bg-white border border-slate-200/70 shadow-2xs hover:border-indigo-200 hover:shadow-xs transition-all"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 border ${pt.color}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                      {pt.count}+
                    </div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
                      {pt.type}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Featured Partners Grid */}
        <section className="py-20 bg-white border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-indigo-600 mb-3 block">
                Alliances in Action
              </span>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                Our Institutional Partners
              </h2>
              <p className="mt-3 text-slate-600 text-base">
                Building an ecosystem of empirical rigor, investigative security, and public policy dialogue.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {partners.map((partner) => {
                const Icon = partner.icon;
                return (
                  <div
                    key={partner.name}
                    className="flex flex-col p-7 rounded-3xl bg-slate-50/60 border border-slate-200/80 hover:bg-white hover:border-indigo-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <span className="inline-block text-[10px] font-bold tracking-[0.15em] uppercase text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">
                        {partner.type}
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/70 text-slate-500 flex items-center justify-center shadow-2xs">
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{partner.name}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed flex-1">
                      {partner.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* How We Partner */}
        <section className="py-20 bg-slate-50/70 border-b border-slate-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-indigo-600 mb-3 block">
                Engagement Model
              </span>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                How We Collaborate
              </h2>
              <p className="mt-3 text-slate-600 text-base">
                A structured, outcome-driven process anchored in mutual independence and public good.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {collaborationSteps.map((step) => (
                <div
                  key={step.step}
                  className="relative flex flex-col p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs"
                >
                  <span className="text-3xl font-extrabold text-indigo-600/30 mb-4 block font-mono">
                    {step.step}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Partner With Us CTA */}
        <section className="py-20 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl bg-gradient-to-r from-navy-950 via-slate-900 to-indigo-950 text-white p-8 sm:p-14 shadow-md flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="max-w-xl text-center md:text-left">
                <span className="text-xs font-bold tracking-[0.2em] uppercase text-indigo-400 mb-2 block">
                  Institutional Dialogue
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
                  Interested in partnering with LENS?
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed font-normal">
                  We welcome inquiries from academic departments, media outlets, civil society coalitions, and international development organizations.
                </p>
              </div>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-500/25 transition-all shrink-0"
              >
                <Mail className="w-4 h-4" />
                Initiate a Partnership
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

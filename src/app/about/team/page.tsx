import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import PageHero from "@/components/site/PageHero";
import SectionSubnav from "@/components/site/SectionSubnav";
import ContentListState from "@/components/ContentListState";
import { getPublicTeamMembers } from "@/lib/public-content";
import { getPublicPage, type PublicSectionData } from "@/lib/actions/cms";
import { resolveSectionItems } from "@/components/page/resolveSectionItems";
import type { SectionWithResolved } from "@/components/page/PageSectionsView";
import CmsPageView from "@/components/page/CmsPageView";
import {
  Users,
  Briefcase,
  Mail,
  GraduationCap,
  Shield,
  BarChart3,
  Search,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Our Team — LENS",
  description:
    "Researchers, journalists, policy analysts and media professionals behind LENS.",
};

async function resolveCmsSections(sections: PublicSectionData[]) {
  return Promise.all(
    sections.map(async (s) => ({
      ...s,
      resolved: await resolveSectionItems(s.type, s.content).catch(() => ({ items: [] })),
    }))
  );
}

const teamDisciplines = [
  {
    icon: BarChart3,
    title: "Narrative & Media Intelligence",
    description: "Empirical researchers specializing in content analysis, propaganda tracking, and information ecology.",
  },
  {
    icon: Search,
    title: "OSINT & Investigative Verification",
    description: "Open-source intelligence researchers, forensic fact-checkers, and data journalists.",
  },
  {
    icon: GraduationCap,
    title: "Civic Training & Academies",
    description: "Educators and trainers guiding grassroots youth workshops, mobile journalism labs, and curriculum development.",
  },
  {
    icon: Shield,
    title: "Policy Advocacy & Press Freedom",
    description: "Policy analysts and legal specialists advocating for journalist safety and digital rights protection.",
  },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default async function TeamPage() {
  const cms = await getPublicPage("about/team");
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

  const { items: members, error } = await getPublicTeamMembers();

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-24">
        <PageHero
          accent="indigo"
          eyebrow="About LENS"
          title="Our Researchers & Specialists"
          description="LENS brings together researchers, journalists, policy analysts, and media professionals with deep expertise in Bangladesh's information ecosystem."
          badge={
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Users className="w-3.5 h-3.5" />
              Multidisciplinary Team
            </span>
          }
          breadcrumbItems={[
            { label: "Home", href: "/" },
            { label: "About", href: "/about" },
            { label: "Team" },
          ]}
        />

        <SectionSubnav section="about" activeHref="/about/team" />

        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {members.length === 0 ? (
              <div className="space-y-16">
                <ContentListState
                  variant={error ? "error" : "empty"}
                  accent="indigo"
                  icon={<Users className="w-6 h-6 text-indigo-600" />}
                  emptyMessage="Our core research roster and visiting fellows profiles are currently being curated for publication."
                  action={
                    <Link
                      href="/careers"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-xs"
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                      View Open Opportunities
                    </Link>
                  }
                />

                {/* Multidisciplinary Structure Breakdown */}
                <div className="rounded-3xl bg-slate-50/80 border border-slate-200/80 p-8 sm:p-12">
                  <div className="text-center max-w-2xl mx-auto mb-10">
                    <span className="text-xs font-bold tracking-[0.2em] uppercase text-indigo-600 mb-2 block">
                      Organizational Composition
                    </span>
                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                      Multidisciplinary Research Faculty
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      Our institutional structure draws on four core fields to address complex narrative challenges.
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {teamDisciplines.map((disc) => {
                      const Icon = disc.icon;
                      return (
                        <div
                          key={disc.title}
                          className="p-6 rounded-2xl bg-white border border-slate-200/70 shadow-2xs hover:shadow-xs transition-all"
                        >
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100/80 text-indigo-600 flex items-center justify-center mb-4">
                            <Icon className="w-5 h-5" />
                          </div>
                          <h4 className="text-base font-bold text-slate-900 mb-2 leading-snug">
                            {disc.title}
                          </h4>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            {disc.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {members.map((member) => (
                  <article
                    key={member.slug}
                    className="group relative flex flex-col p-7 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-200 hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white font-bold text-lg flex items-center justify-center shadow-xs shrink-0">
                        {getInitials(member.name) || "L"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="inline-block text-[10px] font-bold tracking-[0.15em] uppercase text-indigo-600 bg-indigo-50 border border-indigo-100/80 px-2 py-0.5 rounded-full mb-1">
                          {member.department}
                        </span>
                        <h2 className="text-lg font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                          {member.name}
                        </h2>
                      </div>
                    </div>

                    <p className="text-xs font-semibold text-slate-600 mb-3">{member.role}</p>

                    {member.bio && (
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-4 flex-1">
                        {member.bio}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}

            {/* Careers Callout */}
            <div className="mt-16 rounded-3xl bg-gradient-to-r from-indigo-900 via-navy-950 to-slate-900 text-white p-8 sm:p-12 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="max-w-xl">
                <span className="text-xs font-bold tracking-[0.2em] uppercase text-indigo-300 mb-2 block">
                  Join Our Mission
                </span>
                <h3 className="text-2xl font-bold tracking-tight mb-2">
                  Interested in collaborating or joining LENS?
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed font-normal">
                  We are always seeking passionate researchers, data journalists, and visiting scholars committed to strengthening Bangladesh&apos;s narrative ecosystem.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 shrink-0">
                <Link
                  href="/careers"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold bg-indigo-500 hover:bg-indigo-400 text-white transition-colors shadow-xs"
                >
                  <Briefcase className="w-4 h-4" />
                  Open Positions
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold border border-white/20 text-white hover:border-white/50 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Contact Us
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

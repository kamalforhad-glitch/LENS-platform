import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import PageHero from "@/components/site/PageHero";
import SectionSubnav from "@/components/site/SectionSubnav";
import ContentListState from "@/components/ContentListState";
import { getPublicPrograms } from "@/lib/public-content";
import { COURSE_SUBJECTS } from "@/lib/course-subjects";
import { getPublicPage, type PublicSectionData } from "@/lib/actions/cms";
import { resolveSectionItems } from "@/components/page/resolveSectionItems";
import type { SectionWithResolved } from "@/components/page/PageSectionsView";
import CmsPageView from "@/components/page/CmsPageView";
import InstitutionalCta from "@/components/page/InstitutionalCta";
import {
  GraduationCap,
  Camera,
  Video,
  CheckCircle2,
  BarChart3,
  Sparkles,
  ArrowRight,
  BookOpen,
  Award,
  Users2,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Courses & Capacity Training — LENS",
  description:
    "LENS practical training academy — photography, mobile journalism (mojo), fact-checking, data journalism, and new media.",
};

const SUBJECT_DETAILS: Record<
  string,
  {
    icon: typeof Camera;
    tagline: string;
    description: string;
    skills: string[];
  }
> = {
  photography: {
    icon: Camera,
    tagline: "Visual Storytelling",
    description: "Documentary photography, ethical photojournalism, visual framing, and archival preservation.",
    skills: ["Composition", "Ethics", "Field Work"],
  },
  mojo: {
    icon: Video,
    tagline: "Mobile Journalism",
    description: "Smartphone field reporting, mobile video shooting, swift multi-platform editing, and secure live streaming.",
    skills: ["Video Production", "Audio Capturing", "Field Agility"],
  },
  "fact-check": {
    icon: CheckCircle2,
    tagline: "Verification & OSINT",
    description: "Forensic image and video verification, digital geolocation, source triangulation, and debunking workflows.",
    skills: ["OSINT Tools", "Metadata Analysis", "Fact Verification"],
  },
  "data-journalism": {
    icon: BarChart3,
    tagline: "Data & Investigation",
    description: "Spreadsheet cleaning, public record scraping, data visualization, and investigative narrative storytelling.",
    skills: ["Data Analysis", "Visualization", "Public Records"],
  },
  "new-media": {
    icon: Sparkles,
    tagline: "Digital Narratives",
    description: "Interactive storytelling formats, social algorithm literacy, platform strategies, and audience engagement.",
    skills: ["Digital Strategy", "Algorithms", "Audience Growth"],
  },
};

const learningPillars = [
  {
    icon: Award,
    title: "Field-First Practical Pedagogy",
    desc: "Hands-on simulation labs where participants work directly with real datasets, raw footage, and actual field reporting conditions.",
  },
  {
    icon: Users2,
    title: "Senior Industry Mentorship",
    desc: "Direct guidance and continuous portfolio review by seasoned investigative editors, photojournalists, and policy researchers.",
  },
  {
    icon: BookOpen,
    title: "Open-Access Syllabi & Tools",
    desc: "All training materials, cheat sheets, and verification protocols remain freely available to civil society participants.",
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

export default async function CoursesPage() {
  const cms = await getPublicPage("courses");
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
  const { items: programs, error } = await getPublicPrograms();

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-24">
        <PageHero
          accent="violet"
          eyebrow="Academy & Training"
          title="Courses & Professional Training"
          description="Action-oriented capacity building for journalists, student researchers, civil society leaders, and youth — strengthening skills for Bangladesh's evolving information ecosystem."
          badge={
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30">
              <GraduationCap className="w-3.5 h-3.5" />
              Educational Academy
            </span>
          }
          breadcrumbItems={[{ label: "Home", href: "/" }, { label: "Courses" }]}
        />

        <SectionSubnav section="courses" activeHref="/courses" />

        {/* Course Subjects Grid */}
        <section className="py-20 bg-white border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-violet-600 mb-3 block">
                Disciplines & Curricula
              </span>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                Course Subject Tracks
              </h2>
              <p className="mt-3 text-slate-600 text-base">
                Five specialized training tracks designed to build high-impact media competencies.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {COURSE_SUBJECTS.map((subject) => {
                const details = SUBJECT_DETAILS[subject.slug] || {
                  icon: GraduationCap,
                  tagline: "Course Subject",
                  description: `Course offerings in ${subject.name} are published here as cohorts open.`,
                  skills: ["Practical Skills", "Ethics", "Production"],
                };
                const Icon = details.icon;

                return (
                  <Link
                    key={subject.slug}
                    href={`/courses/${subject.slug}`}
                    className="group relative flex flex-col p-8 rounded-3xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-violet-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between gap-3 mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-100 text-violet-600 flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 bg-violet-50 border border-violet-100 px-2.5 py-1 rounded-full">
                        {details.tagline}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-tight group-hover:text-violet-600 transition-colors">
                      {subject.name}
                    </h3>

                    <p className="text-xs text-slate-500 leading-relaxed flex-1 mb-6">
                      {details.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {details.skills.map((skill) => (
                        <span
                          key={skill}
                          className="text-[10px] font-semibold text-slate-500 bg-white border border-slate-200/70 px-2 py-0.5 rounded-md"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold text-violet-600 group-hover:translate-x-1 transition-transform pt-4 border-t border-slate-100">
                      <span>Explore Subject Track</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Current Program Offerings */}
        <section className="py-20 bg-slate-50/70 border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-violet-600 mb-3 block">
                Active Cohorts
              </span>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                Current Program Offerings
              </h2>
              <p className="mt-3 text-slate-600 text-base">
                Published training programs, fellowships, workshops, and youth academies.
              </p>
            </div>

            {programs.length === 0 ? (
              <ContentListState
                variant={error ? "error" : "empty"}
                accent="violet"
                icon={<GraduationCap className="w-6 h-6 text-violet-600" />}
                emptyMessage="Cohort registrations and upcoming training workshop schedules are currently being finalized."
              />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {programs.map((program) => (
                  <Link
                    key={program.slug}
                    href={`/programs/${program.slug}`}
                    className="group relative flex flex-col p-7 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-lg hover:border-violet-200 hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className="inline-block text-[10px] font-bold tracking-[0.15em] uppercase text-violet-600 bg-violet-50 border border-violet-100 px-2.5 py-1 rounded-full">
                        {program.category}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-violet-600 transition-colors leading-snug">
                      {program.title}
                    </h3>

                    <p className="text-xs text-slate-500 leading-relaxed flex-1 line-clamp-3 mb-6">
                      {program.description}
                    </p>

                    <div className="flex items-center gap-2 text-xs font-bold text-violet-600 group-hover:translate-x-1 transition-transform pt-4 border-t border-slate-100">
                      <span>View Program Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Academy Pedagogy Pillars */}
        <section className="py-20 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-violet-600 mb-3 block">
                The LENS Standard
              </span>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                Our Learning Philosophy
              </h2>
              <p className="mt-3 text-slate-600 text-base">
                How our capacity-building programs bridge theoretical media analysis with practical field impact.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {learningPillars.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <div
                    key={pillar.title}
                    className="flex flex-col p-8 rounded-3xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-violet-200 hover:shadow-xs transition-all"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-100 text-violet-600 flex items-center justify-center mb-6 shadow-2xs">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{pillar.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{pillar.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Institutional Closing CTA */}
        <InstitutionalCta section="courses" />
      </main>
      <SiteFooter />
    </>
  );
}

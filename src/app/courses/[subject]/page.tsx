import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import PageHero from "@/components/site/PageHero";
import SectionSubnav from "@/components/site/SectionSubnav";
import ContentListState from "@/components/ContentListState";
import { getPublicPrograms } from "@/lib/public-content";
import { COURSE_SUBJECTS, getCourseSubject } from "@/lib/course-subjects";
import { getPublicPage, type PublicSectionData } from "@/lib/actions/cms";
import { resolveSectionItems } from "@/components/page/resolveSectionItems";
import type { SectionWithResolved } from "@/components/page/PageSectionsView";
import CmsPageView from "@/components/page/CmsPageView";
import {
  GraduationCap,
  Camera,
  Video,
  CheckCircle2,
  BarChart3,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return COURSE_SUBJECTS.map((s) => ({ subject: s.slug }));
}

async function resolveCmsSections(sections: PublicSectionData[]) {
  return Promise.all(
    sections.map(async (s) => ({
      ...s,
      resolved: await resolveSectionItems(s.type, s.content).catch(() => ({ items: [] })),
    }))
  );
}

const SUBJECT_METADATA: Record<
  string,
  {
    icon: typeof Camera;
    tagline: string;
    description: string;
    modules: { title: string; desc: string }[];
    competencies: string[];
  }
> = {
  photography: {
    icon: Camera,
    tagline: "Visual Journalism & Documentary Ethics",
    description:
      "Comprehensive training covering visual framing, ethical consent, documentary photography techniques, and long-term photojournalistic narrative development in Bangladesh.",
    modules: [
      { title: "Visual Story Framing & Ethics", desc: "Understanding narrative perspective, subject dignity, and safety in sensitive reporting zones." },
      { title: "Technical Field Craft", desc: "Camera mechanics, lighting under adverse field conditions, and raw workflow management." },
      { title: "Editorial Curation & Archiving", desc: "Sequencing photo essays, caption writing standards, and long-term digital archiving." },
    ],
    competencies: ["Documentary Ethics", "Field Composition", "Visual Archiving", "Photo Essays"],
  },
  mojo: {
    icon: Video,
    tagline: "Mobile Journalism & Rapid Field Production",
    description:
      "Practical mobile production workflows empowering reporters and civic researchers to shoot, edit, verify, and broadcast professional video stories entirely from mobile devices.",
    modules: [
      { title: "Smartphone Camera & Audio Rigs", desc: "Maximizing mobile lenses, directional microphones, and stabilization kits in dynamic situations." },
      { title: "Mobile Video Editing", desc: "High-speed timeline editing, B-roll integration, and on-device graphics and subtitling." },
      { title: "Live Streaming & Operational Security", desc: "Low-latency field transmission, signal redundancy, and device security protocols." },
    ],
    competencies: ["Mobile Cinematography", "Field Audio", "Fast Editing", "Live Reporting"],
  },
  "fact-check": {
    icon: CheckCircle2,
    tagline: "Information Verification & Digital Forensics",
    description:
      "Rigorous open-source intelligence (OSINT) and forensic investigation training designed to expose coordinated disinformation, verify social media claims, and debunk synthetic media.",
    modules: [
      { title: "Digital Trace & Reverse Search", desc: "Reverse image and video indexing, EXIF metadata extraction, and chronolocation methods." },
      { title: "Geolocation & Geopolitical OSINT", desc: "Satellite imagery comparison, shadow analysis, and landmarks verification." },
      { title: "Synthetic Media & Deepfake Detection", desc: "Identifying generative AI artifacts, voice clones, and algorithmic manipulation." },
    ],
    competencies: ["Reverse Image Search", "Geolocation", "Metadata Forensics", "AI Detection"],
  },
  "data-journalism": {
    icon: BarChart3,
    tagline: "Data Analysis & Public Records Investigation",
    description:
      "Structured data investigation methods teaching journalists and policy researchers to scrape, clean, analyze, and visually communicate complex institutional datasets.",
    modules: [
      { title: "Data Harvesting & Freedom of Information", desc: "Scraping web portals, OCR extraction of scanned PDFs, and public records access." },
      { title: "Data Cleaning & Statistical Analysis", desc: "Tabular tidying with modern spreadsheets and Python, spotting anomalies and outliers." },
      { title: "Visual Communication & Mapping", desc: "Interactive charts, geographic heatmaps, and evidence-backed investigative reporting." },
    ],
    competencies: ["Public Records", "Spreadsheet Wrangling", "Data Visualization", "Statistical Literacy"],
  },
  "new-media": {
    icon: Sparkles,
    tagline: "Digital Narratives & Algorithmic Ecosystems",
    description:
      "Advanced strategies for understanding digital attention dynamics, algorithmic recommendation systems, interactive journalism, and multi-format civic communications.",
    modules: [
      { title: "Platform Architecture & Algorithms", desc: "How modern social feeds rank, recommend, and throttle civic content in South Asia." },
      { title: "Interactive & Multi-Format Publishing", desc: "Exploratory scrollytelling, newsletter ecosystems, and micro-video narrative structures." },
      { title: "Audience Trust & Engagement Analytics", desc: "Measuring meaningful civic engagement beyond superficial vanity metrics." },
    ],
    competencies: ["Algorithm Literacy", "Scrollytelling", "Audience Engagement", "Platform Strategy"],
  },
};

export async function generateMetadata({ params }: { params: Promise<{ subject: string }> }): Promise<Metadata> {
  const { subject } = await params;
  const cms = await getPublicPage(`courses/${subject}`);
  if (cms) {
    return {
      title: cms.metaTitle || cms.title,
      description: cms.metaDescription || cms.description || undefined,
    };
  }
  const known = getCourseSubject(subject);
  if (!known) return { title: "Course Not Found — LENS" };
  return {
    title: `${known.name} Courses — LENS Academy`,
    description: `LENS ${known.name} training track — hands-on media skills, verification labs, and professional fellowships.`,
  };
}

export default async function CourseSubjectPage({ params }: { params: Promise<{ subject: string }> }) {
  const { subject } = await params;
  const cms = await getPublicPage(`courses/${subject}`);
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

  const known = getCourseSubject(subject);
  if (!known) notFound();

  const details = SUBJECT_METADATA[subject] || {
    icon: GraduationCap,
    tagline: "Professional Training Track",
    description: `Course offerings and workshops in ${known.name} will be listed here as new cohorts are scheduled.`,
    modules: [
      { title: "Fundamental Theory", desc: "Core concepts and ethical foundations." },
      { title: "Practical Application", desc: "Field exercises and hands-on simulation." },
      { title: "Final Project & Review", desc: "Mentored production and portfolio assessment." },
    ],
    competencies: ["Practical Skills", "Ethics", "Production"],
  };

  const Icon = details.icon;

  const { items: programs, error } = await getPublicPrograms();
  const items = programs.filter(
    (p) => p.category.toLowerCase() === known.name.toLowerCase(),
  );

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-24">
        <PageHero
          accent="violet"
          eyebrow="Courses & Training"
          title={`${known.name} Track`}
          description={details.description}
          badge={
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30">
              <Icon className="w-3.5 h-3.5" />
              {details.tagline}
            </span>
          }
          breadcrumbItems={[
            { label: "Home", href: "/" },
            { label: "Courses", href: "/courses" },
            { label: known.name },
          ]}
        />

        <SectionSubnav section="courses" activeHref={`/courses/${subject}`} />

        {/* Competencies Highlight Strip */}
        <section className="py-6 bg-slate-50 border-b border-slate-200/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Core Competencies Acquired:
              </span>
              <div className="flex flex-wrap gap-2">
                {details.competencies.map((comp) => (
                  <span
                    key={comp}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white border border-violet-100 text-violet-700 shadow-2xs"
                  >
                    <CheckCircle2 className="w-3 h-3 text-violet-500" />
                    {comp}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Offerings Listing Section */}
        <section className="py-16 sm:py-20 bg-white border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Available {known.name} Offerings
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Active programs, specialized workshops, and fellowships under this discipline.
                </p>
              </div>
              <Link
                href="/courses"
                className="text-xs font-bold text-violet-600 hover:text-violet-500 transition-colors"
              >
                ← View All Subject Tracks
              </Link>
            </div>

            {items.length === 0 ? (
              <div className="space-y-16">
                <ContentListState
                  variant={error ? "error" : "empty"}
                  accent="violet"
                  icon={<Icon className="w-6 h-6 text-violet-600" />}
                  emptyMessage={`Cohort dates and workshop registration for ${known.name} are currently being finalized.`}
                  action={
                    <Link
                      href="/courses"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-violet-600 text-white hover:bg-violet-500 transition-colors shadow-xs"
                    >
                      Explore Other Active Tracks
                    </Link>
                  }
                />

                {/* Syllabus Curriculum Preview */}
                <div className="rounded-3xl bg-slate-50/80 border border-slate-200/80 p-8 sm:p-12">
                  <div className="text-center max-w-2xl mx-auto mb-10">
                    <span className="text-xs font-bold tracking-[0.2em] uppercase text-violet-600 mb-2 block">
                      Curriculum Blueprint
                    </span>
                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                      What This Course Track Covers
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      Standard syllabus modules taught by LENS fellows and invited guest practitioners.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    {details.modules.map((mod, idx) => (
                      <div
                        key={mod.title}
                        className="flex flex-col p-6 rounded-2xl bg-white border border-slate-200/70 shadow-2xs"
                      >
                        <span className="text-xs font-bold text-violet-600 font-mono mb-2">
                          MODULE 0{idx + 1}
                        </span>
                        <h4 className="text-base font-bold text-slate-900 mb-2 leading-snug">
                          {mod.title}
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed flex-1">
                          {mod.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {items.map((program) => (
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
                      <span>View Program Syllabus</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Quick Subject Switcher Strip */}
        <section className="py-14 bg-slate-50/70">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 text-center">
              Switch Subject Track
            </h4>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {COURSE_SUBJECTS.map((s) => {
                const isCurrent = s.slug === subject;
                return (
                  <Link
                    key={s.slug}
                    href={`/courses/${s.slug}`}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                      isCurrent
                        ? "bg-violet-600 text-white shadow-xs"
                        : "bg-white border border-slate-200/80 text-slate-600 hover:border-violet-200 hover:text-violet-600"
                    }`}
                  >
                    {s.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

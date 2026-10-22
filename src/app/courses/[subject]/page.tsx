import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import PageHero from "@/components/site/PageHero";
import ContentListState from "@/components/ContentListState";
import { getPublicPrograms } from "@/lib/public-content";
import { COURSE_SUBJECTS, getCourseSubject } from "@/lib/course-subjects";
import { getPublicPage, type PublicSectionData } from "@/lib/actions/cms";
import { resolveSectionItems } from "@/components/page/resolveSectionItems";
import type { SectionWithResolved } from "@/components/page/PageSectionsView";
import CmsPageView from "@/components/page/CmsPageView";

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
  if (!known) return { title: "Course Not Found" };
  return {
    title: `${known.name} Courses`,
    description: `LENS ${known.name} course offerings — published here as courses are announced.`,
  };
}

// CMS-ready subject view: when editors publish a CMS page for courses/[subject],
// it renders full custom CMS sections. Otherwise Program rows whose
// category matches the subject name appear here automatically.
export default async function CourseSubjectPage({ params }: { params: Promise<{ subject: string }> }) {
  const { subject } = await params;
  const cms = await getPublicPage(`courses/${subject}`);
  if (cms) {
    const sections: SectionWithResolved[] = await resolveCmsSections(cms.sections);
    return <CmsPageView page={{ id: cms.id, slug: cms.slug, title: cms.title, sections }} />;
  }

  const known = getCourseSubject(subject);
  if (!known) notFound();

  const { items: programs, error } = await getPublicPrograms();
  const items = programs.filter(
    (p) => p.category.toLowerCase() === known.name.toLowerCase(),
  );

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-24">
        <PageHero
          eyebrow="Courses"
          title={`${known.name} Courses`}
          description={`Course offerings in ${known.name} will be listed here as they are published.`}
          breadcrumbItems={[
            { label: "Home", href: "/" },
            { label: "Courses", href: "/courses" },
            { label: known.name },
          ]}
        />

        <section className="py-16 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {items.length === 0 ? (
              <ContentListState
                variant={error ? "error" : "empty"}
                emptyMessage={`No ${known.name} courses have been published yet. In the meantime, explore our current program offerings.`}
              />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((program) => (
                  <Link
                    key={program.slug}
                    href={`/programs/${program.slug}`}
                    className="group flex flex-col p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-teal-600">
                        {program.category}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-teal-600 transition-colors">
                      {program.title}
                    </h2>
                    <p className="text-sm text-slate-500 leading-relaxed flex-1 line-clamp-3">
                      {program.description}
                    </p>
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-12 text-center">
              <Link
                href="/programs"
                className="inline-flex items-center px-6 py-3 bg-navy-950 text-white text-sm font-semibold rounded-full hover:bg-navy-800 transition-colors"
              >
                All Programs
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

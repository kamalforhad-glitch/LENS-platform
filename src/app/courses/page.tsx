import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import PageHero from "@/components/site/PageHero";
import ContentListState from "@/components/ContentListState";
import { getPublicPrograms } from "@/lib/public-content";
import { COURSE_SUBJECTS } from "@/lib/course-subjects";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Courses",
  description:
    "LENS courses and training — photography, mojo, fact check, data journalism and new media, plus current program offerings.",
};

export default async function CoursesPage() {
  const { items: programs, error } = await getPublicPrograms();

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-24">
        <PageHero
          eyebrow="Learn"
          title="Courses & Training"
          description="Practical training for journalists, researchers, youth and civil society — building skills for Bangladesh's evolving narrative landscape."
          breadcrumbItems={[{ label: "Home", href: "/" }, { label: "Courses" }]}
        />

        <section className="py-16 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Course Subjects</h2>
            <p className="text-sm text-slate-500 mb-8">
              Subject catalogues are published here as courses are announced.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {COURSE_SUBJECTS.map((subject) => (
                <Link
                  key={subject.slug}
                  href={`/courses/${subject.slug}`}
                  className="group flex flex-col p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all duration-300"
                >
                  <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-teal-600 transition-colors">
                    {subject.name}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed flex-1">
                    Course offerings in {subject.name} will be listed here as they are published.
                  </p>
                  <span className="mt-4 text-sm font-semibold text-teal-600">View courses →</span>
                </Link>
              ))}
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-2">Current Offerings</h2>
            <p className="text-sm text-slate-500 mb-8">
              Published training programs, fellowships and academies.
            </p>
            {programs.length === 0 ? (
              <ContentListState
                variant={error ? "error" : "empty"}
                emptyMessage="No programs have been published yet."
              />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {programs.map((program) => (
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
                    <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-teal-600 transition-colors">
                      {program.title}
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed flex-1 line-clamp-3">
                      {program.description}
                    </p>
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

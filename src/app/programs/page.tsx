import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import ContentListState from "@/components/ContentListState";
import { getPublicPrograms } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Programs",
  description:
    "Training programs, workshops, and capacity building initiatives by LENS for media literacy, digital rights, and narrative research in Bangladesh.",
};

export default async function ProgramsPage() {
  const { items: programs, error } = await getPublicPrograms();

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-24">
        <section className="py-20 bg-navy-950">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-teal-400 mb-4 block">
              Programs
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Training & Capacity Building
            </h1>
            <p className="text-lg text-slate-300/80 leading-relaxed max-w-2xl mx-auto">
              Equipping journalists, researchers, and civil society with the
              skills to navigate Bangladesh&apos;s evolving narrative landscape.
            </p>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
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
                    <h2 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-teal-600 transition-colors">
                      {program.title}
                    </h2>
                    <p className="text-sm text-slate-500 leading-relaxed flex-1">
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

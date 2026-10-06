import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import PageHero from "@/components/site/PageHero";
import { getPublicResearch } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Indexing",
  description:
    "LENS media indexing — tracking media trends, content analysis and narrative mapping across Bangladesh's information landscape.",
};

// Static/CMS-driven hub (no dataset explorer, no new models). All copy
// below is verified repository content: the Media Indexing focus area,
// the Media Index Bangladesh 2025 report, and the 2025 BPFI launch.
const practiceAreas = [
  {
    title: "Media Trend Tracking",
    description: "Monitoring how stories, topics and narratives rise and shift across platforms.",
  },
  {
    title: "Content Analysis",
    description: "Systematic analysis of media content to surface patterns, gaps and risks.",
  },
  {
    title: "Narrative Mapping",
    description: "Mapping competing narratives to understand the information ecosystem.",
  },
];

export default async function IndexingPage() {
  const { items: articles } = await getPublicResearch();
  const latest = articles.slice(0, 3);

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-24">
        <PageHero
          eyebrow="Indexing"
          title="Media Indexing"
          description="Tracking media trends, content analysis and narrative mapping — the evidence base behind LENS index products."
          breadcrumbItems={[{ label: "Home", href: "/" }, { label: "Indexing" }]}
        />

        <section className="py-16 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">The Practice</h2>
            <p className="text-sm text-slate-500 mb-8">
              How LENS turns media observation into structured, comparable evidence.
            </p>
            <div className="grid sm:grid-cols-3 gap-6 mb-16">
              {practiceAreas.map((area) => (
                <div
                  key={area.title}
                  className="p-6 rounded-2xl border border-slate-100 bg-slate-50"
                >
                  <h3 className="text-base font-bold text-slate-900 mb-2">{area.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{area.description}</p>
                </div>
              ))}
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-2">Index Products</h2>
            <p className="text-sm text-slate-500 mb-8">
              Flagship indexes published by LENS.
            </p>
            <div className="grid sm:grid-cols-2 gap-6 mb-16">
              <Link
                href="/indexing/press-freedom-index"
                className="group flex flex-col p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all duration-300"
              >
                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-teal-600 transition-colors">
                  Press Freedom Index
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed flex-1">
                  Tracking independent journalism and press freedom advocacy in Bangladesh.
                </p>
                <span className="mt-4 text-sm font-semibold text-teal-600">Explore →</span>
              </Link>
              <Link
                href="/indexing/bpfi"
                className="group flex flex-col p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all duration-300"
              >
                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-teal-600 transition-colors">
                  BPFI — Bangladesh Press Freedom Index
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed flex-1">
                  The Bangladesh edition report series, including the 2025 edition.
                </p>
                <span className="mt-4 text-sm font-semibold text-teal-600">Explore →</span>
              </Link>
            </div>

            {latest.length > 0 && (
              <>
                <div className="flex items-end justify-between mb-8">
                  <h2 className="text-2xl font-bold text-slate-900">Latest Findings</h2>
                  <Link href="/theme/research" className="text-sm font-semibold text-teal-600 hover:text-teal-500">
                    All research →
                  </Link>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {latest.map((article) => (
                    <Link
                      key={article.slug}
                      href={`/research/${article.slug}`}
                      className="group flex flex-col p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all duration-300"
                    >
                      <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-teal-600 mb-2">
                        {article.category}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mb-2 group-hover:text-teal-600 transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-sm text-slate-500 leading-relaxed flex-1 line-clamp-3">
                        {article.description}
                      </p>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

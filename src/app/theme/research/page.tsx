import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import PageHero from "@/components/site/PageHero";
import ContentListState from "@/components/ContentListState";
import { formatMonthYear, getPublicResearch } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Research",
  description:
    "Evidence-based research on media literacy, press freedom, narrative analysis, policy advocacy and cybersecurity in Bangladesh.",
};

export default async function ThemeResearchPage() {
  const { items: articles, error } = await getPublicResearch();

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-24">
        <PageHero
          eyebrow="Theme"
          title="Evidence-Based Analysis"
          description="Our research covers media literacy, press freedom, digital rights, and narrative ecosystems in Bangladesh and South Asia."
          breadcrumbItems={[
            { label: "Home", href: "/" },
            { label: "Theme", href: "/theme" },
            { label: "Research" },
          ]}
          actions={
            <Link
              href="/library"
              className="inline-flex items-center px-6 py-3 border border-white/20 text-white text-sm font-semibold rounded-full hover:border-teal-400 hover:text-teal-300 transition-colors"
            >
              Advanced Library Search
            </Link>
          }
        />

        <section className="py-16 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {articles.length === 0 ? (
              <ContentListState
                variant={error ? "error" : "empty"}
                emptyMessage="No research articles have been published yet."
              />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map((article) => (
                  <Link
                    key={article.slug}
                    href={`/research/${article.slug}`}
                    className="group flex flex-col p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-teal-600">
                        {article.category}
                      </span>
                      {article.datePublished && (
                        <span className="text-xs text-slate-400">
                          {formatMonthYear(article.datePublished)}
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-teal-600 transition-colors">
                      {article.title}
                    </h2>
                    <p className="text-sm text-slate-500 leading-relaxed flex-1 line-clamp-3">
                      {article.description}
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

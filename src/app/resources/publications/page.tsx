import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import PageHero from "@/components/site/PageHero";
import ContentListState from "@/components/ContentListState";
import { formatMonthYear, getPublicPublications } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Publications",
  description:
    "LENS publications — policy briefs, working papers and research reports. Detail pages remain canonical at /publications/[slug].",
};

// Resource-hub view over the Publication model. Canonical detail URLs
// (/publications/[slug]) are preserved — this view only lists and links.
export default async function ResourcePublicationsPage() {
  const { items: publications, error } = await getPublicPublications();

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-24">
        <PageHero
          eyebrow="Resources"
          title="Publications"
          description="Policy briefs, working papers and research reports from LENS."
          breadcrumbItems={[
            { label: "Home", href: "/" },
            { label: "Resources", href: "/resources" },
            { label: "Publications" },
          ]}
          actions={
            <Link
              href="/publications"
              className="inline-flex items-center px-6 py-3 border border-white/20 text-white text-sm font-semibold rounded-full hover:border-teal-400 hover:text-teal-300 transition-colors"
            >
              Publications Archive
            </Link>
          }
        />

        <section className="py-16 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {publications.length === 0 ? (
              <ContentListState
                variant={error ? "error" : "empty"}
                emptyMessage="No publications have been published yet."
              />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {publications.map((pub) => (
                  <Link
                    key={pub.slug}
                    href={`/publications/${pub.slug}`}
                    className="group flex flex-col p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-teal-600">
                        {pub.type}
                      </span>
                      {pub.datePublished && (
                        <span className="text-xs text-slate-400">
                          {formatMonthYear(pub.datePublished)}
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-teal-600 transition-colors">
                      {pub.title}
                    </h2>
                    <p className="text-sm text-slate-500 leading-relaxed flex-1 line-clamp-3">
                      {pub.description}
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

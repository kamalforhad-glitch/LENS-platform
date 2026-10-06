import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import PageHero from "@/components/site/PageHero";
import ContentListState from "@/components/ContentListState";
import { formatMonthYear, getPublicMediaItems } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Media Resources",
  description:
    "LENS media resources — press releases, interviews and statements. Detail pages remain canonical at /media/[slug].",
};

// Resource-hub view over the MediaItem model. Canonical detail URLs
// (/media/[slug]) are preserved — this view only lists and links.
export default async function ResourceMediaPage() {
  const { items: mediaItems, error } = await getPublicMediaItems();

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-24">
        <PageHero
          eyebrow="Resources"
          title="Media"
          description="Press releases, interviews, statements and media coverage from LENS."
          breadcrumbItems={[
            { label: "Home", href: "/" },
            { label: "Resources", href: "/resources" },
            { label: "Media" },
          ]}
          actions={
            <Link
              href="/media"
              className="inline-flex items-center px-6 py-3 border border-white/20 text-white text-sm font-semibold rounded-full hover:border-teal-400 hover:text-teal-300 transition-colors"
            >
              Media Archive
            </Link>
          }
        />

        <section className="py-16 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {mediaItems.length === 0 ? (
              <ContentListState
                variant={error ? "error" : "empty"}
                emptyMessage="No media items have been published yet."
              />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {mediaItems.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/media/${item.slug}`}
                    className="group flex flex-col p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-teal-600">
                        {item.type.replace(/_/g, " ")}
                      </span>
                      {item.datePublished && (
                        <span className="text-xs text-slate-400">
                          {formatMonthYear(item.datePublished)}
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-teal-600 transition-colors">
                      {item.title}
                    </h2>
                    <p className="text-sm text-slate-500 leading-relaxed flex-1 line-clamp-3">
                      {item.description}
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

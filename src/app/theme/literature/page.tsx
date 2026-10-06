import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import PageHero from "@/components/site/PageHero";
import ContentListState from "@/components/ContentListState";
import { getPublicResources } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Literature",
  description:
    "Curated literature and reference resources supporting media studies and narrative research.",
};

// CMS-ready literature view: editors publish Resource rows with the
// "Literature" category and they appear here automatically. No entries
// are invented — an empty catalogue renders an honest empty state.
const LITERATURE_CATEGORIES = ["Literature"];

export default async function ThemeLiteraturePage() {
  const { items: resources, error } = await getPublicResources();
  const items = resources.filter((r) => LITERATURE_CATEGORIES.includes(r.category));

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-24">
        <PageHero
          eyebrow="Theme"
          title="Literature"
          description="Curated reading and reference resources supporting media studies and narrative research."
          breadcrumbItems={[
            { label: "Home", href: "/" },
            { label: "Theme", href: "/theme" },
            { label: "Literature" },
          ]}
        />

        <section className="py-16 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {items.length === 0 ? (
              <ContentListState
                variant={error ? "error" : "empty"}
                emptyMessage="No literature resources have been published yet. Curated reading lists will appear here."
              />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/resources/${item.slug}`}
                    className="group flex flex-col p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-teal-600">
                        {item.category}
                      </span>
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

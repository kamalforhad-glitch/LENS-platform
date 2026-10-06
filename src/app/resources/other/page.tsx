import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import PageHero from "@/components/site/PageHero";
import ContentListState from "@/components/ContentListState";
import { getPublicResources } from "@/lib/public-content";
import { isOverflowResource } from "@/lib/resource-taxonomy";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Other Resources",
  description:
    "Additional LENS resources — datasets, tools, guides and materials outside the named collections.",
};

// Overflow bucket: every published Resource whose category has no
// dedicated view. Existing categories (including Datasets, Tools,
// Guides) keep rendering here so no published resource is orphaned
// by the taxonomy. Stored data is never renamed or migrated.
export default async function OtherResourcesPage() {
  const { items: resources, error } = await getPublicResources();
  const items = resources.filter((r) => isOverflowResource(r.category));

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-24">
        <PageHero
          eyebrow="Resources"
          title="Other Resources"
          description="Datasets, tools, guides and materials outside the named collections."
          breadcrumbItems={[
            { label: "Home", href: "/" },
            { label: "Resources", href: "/resources" },
            { label: "Other" },
          ]}
        />

        <section className="py-16 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {items.length === 0 ? (
              <ContentListState
                variant={error ? "error" : "empty"}
                emptyMessage="No additional resources have been published yet."
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

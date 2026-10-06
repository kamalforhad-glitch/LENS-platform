import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import PageHero from "@/components/site/PageHero";
import ContentListState from "@/components/ContentListState";
import { getPublicResources } from "@/lib/public-content";
import { RESOURCE_ELECTION_CATEGORY } from "@/lib/resource-taxonomy";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Election Resources",
  description:
    "LENS election-related resources, guides and reference materials for journalists, researchers and civil society.",
};

// CMS-ready view: editors publish Resource rows with the "Election"
// category and they appear here. No election resources exist in the
// repository, so nothing is invented — the empty state stands until
// verified content is published.
export default async function ElectionResourcesPage() {
  const { items: resources, error } = await getPublicResources();
  const items = resources.filter((r) => r.category === RESOURCE_ELECTION_CATEGORY);

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-24">
        <PageHero
          eyebrow="Resources"
          title="Election Resources"
          description="Election-related resources, guides and reference materials."
          breadcrumbItems={[
            { label: "Home", href: "/" },
            { label: "Resources", href: "/resources" },
            { label: "Election" },
          ]}
        />

        <section className="py-16 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {items.length === 0 ? (
              <ContentListState
                variant={error ? "error" : "empty"}
                emptyMessage="No election resources have been published yet."
              />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/resources/${item.slug}`}
                    className="group flex flex-col p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all duration-300"
                  >
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

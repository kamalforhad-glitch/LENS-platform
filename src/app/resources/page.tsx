import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import ContentListState from "@/components/ContentListState";
import { getPublicResources } from "@/lib/public-content";
import { RESOURCE_TAXONOMY_VIEWS } from "@/lib/resource-taxonomy";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Resources",
  description:
    "LENS resources - research tools, datasets, media literacy guides, and educational materials for journalists, researchers, and civil society.",
};

export default async function ResourcesPage() {
  const { items: resources, error } = await getPublicResources();

  const categories = new Map<string, typeof resources>();
  for (const resource of resources) {
    const key = resource.category || "Other";
    if (!categories.has(key)) categories.set(key, []);
    categories.get(key)!.push(resource);
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-24">
        <section className="py-20 bg-navy-950">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-teal-400 mb-4 block">
              Resources
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Research & Resources
            </h1>
            <p className="text-lg text-slate-300/80 leading-relaxed max-w-2xl mx-auto">
              Access our research tools, datasets, educational materials, and
              methodological guides for media studies and policy analysis.
            </p>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
              {RESOURCE_TAXONOMY_VIEWS.map((view) => (
                <Link
                  key={view.slug}
                  href={view.href}
                  className="group p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-teal-500/40 hover:shadow-md transition-all duration-300"
                >
                  <h2 className="text-base font-bold text-slate-900 mb-1 group-hover:text-teal-600 transition-colors">
                    {view.name}
                  </h2>
                  <p className="text-xs text-slate-500 leading-relaxed">{view.description}</p>
                </Link>
              ))}
            </div>
            {resources.length === 0 ? (
              <ContentListState
                variant={error ? "error" : "empty"}
                emptyMessage="No resources have been published yet."
              />
            ) : (
              <div className="space-y-12">
                {Array.from(categories.entries()).map(([category, items]) => (
                  <div key={category}>
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">{category}</h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {items.map((item) => (
                        <Link
                          key={item.slug}
                          href={`/resources/${item.slug}`}
                          className="group block p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all duration-300"
                        >
                          <h3 className="text-base font-bold text-slate-900 mb-2 group-hover:text-teal-600 transition-colors">
                            {item.title}
                          </h3>
                          <p className="text-sm text-slate-500 leading-relaxed">
                            {item.description}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
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

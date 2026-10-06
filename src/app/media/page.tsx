import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import ContentListState from "@/components/ContentListState";
import { formatMonthYear, getPublicMediaItems } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Media",
  description:
    "LENS media coverage, press mentions, interviews, and media resources for journalists covering Bangladesh's narrative ecosystem.",
};

const mediaType = (type: string) =>
  type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default async function MediaPage() {
  const { items: mediaItems, error } = await getPublicMediaItems();

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-24">
        <section className="py-20 bg-navy-950">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-teal-400 mb-4 block">
              Media
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Media & Press
            </h1>
            <p className="text-lg text-slate-300/80 leading-relaxed max-w-2xl mx-auto">
              Press releases, interviews, op-eds, and media resources from LENS.
              Access our media kit and stay updated on our latest coverage.
            </p>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {mediaItems.length === 0 ? (
              <ContentListState
                variant={error ? "error" : "empty"}
                emptyMessage="No media coverage has been published yet."
              />
            ) : (
              <div className="grid gap-6">
                {mediaItems.map((item) => {
                  const monthYear = formatMonthYear(item.datePublished);
                  return (
                    <Link
                      key={item.slug}
                      href={`/media/${item.slug}`}
                      className="group flex gap-6 p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all duration-300"
                    >
                      {monthYear ? (
                        <div className="shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex flex-col items-center justify-center text-white shadow-lg shadow-teal-500/20">
                          <span className="text-[10px] font-medium leading-none">
                            {monthYear.split(" ")[0]?.slice(0, 3).toUpperCase()}
                          </span>
                          <span className="text-xs font-medium leading-none mt-0.5">
                            {monthYear.split(" ")[1]}
                          </span>
                        </div>
                      ) : null}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-teal-600">
                            {mediaType(item.type)}
                          </span>
                          <span className="text-[10px] text-slate-300">·</span>
                          <span className="text-[10px] text-slate-400">{item.source}</span>
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-teal-600 transition-colors">
                          {item.title}
                        </h2>
                        <p className="text-sm text-slate-500 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

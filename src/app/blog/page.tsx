import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import ContentListState from "@/components/ContentListState";
import { formatFullDate, getPublicBlogPosts } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "LENS blog - insights, analysis, and commentary on Bangladesh's media landscape, digital rights, narrative ecosystems, and press freedom.",
};

export default async function BlogPage() {
  const { items: posts, error } = await getPublicBlogPosts();

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-24">
        <section className="py-20 bg-navy-950">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-teal-400 mb-4 block">
              Blog
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Insights & Analysis
            </h1>
            <p className="text-lg text-slate-300/80 leading-relaxed max-w-2xl mx-auto">
              Research insights, expert commentary, and analysis on Bangladesh&apos;s
              media landscape and narrative ecosystems.
            </p>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {posts.length === 0 ? (
              <ContentListState
                variant={error ? "error" : "empty"}
                emptyMessage="No blog posts have been published yet."
              />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="group flex flex-col p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-teal-600">
                        {post.category}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-teal-600 transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    <p className="text-sm text-slate-500 leading-relaxed mb-4 flex-1 line-clamp-3">
                      {post.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{post.author}</span>
                      <span>{post.datePublished ? formatFullDate(post.datePublished) : ""}</span>
                    </div>
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

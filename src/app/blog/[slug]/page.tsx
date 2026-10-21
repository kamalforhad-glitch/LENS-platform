import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import Breadcrumbs from "@/components/site/Breadcrumbs";
import { getPublicBlogPost } from "@/lib/public-content";
import { headers } from "next/headers";

async function getBlogPost(slug: string) {
  return getPublicBlogPost(slug);
}

async function getLocaleFromHeaders(): Promise<string> {
  try {
    const headersList = await headers();
    const acceptLanguage = headersList.get("accept-language") || "";
    return acceptLanguage.startsWith("bn") ? "bn" : "en";
  } catch {
    return "en";
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return { title: "Post Not Found" };

  const locale = await getLocaleFromHeaders();
  const title = locale === "bn" && post.titleBn ? post.titleBn : post.title;
  const description = locale === "bn" && post.descriptionBn ? post.descriptionBn : post.description;

  return {
    title: title,
    description: description,
    openGraph: { title: title, description: description },
    alternates: { languages: { en: `/blog/${slug}`, bn: `/blog/${slug}` } },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();

  const locale = await getLocaleFromHeaders();
  const bn = locale === "bn";

  const title = bn && post.titleBn ? post.titleBn : post.title;
  const description = bn && post.descriptionBn ? post.descriptionBn : post.description;
  const content = bn && post.contentBn ? post.contentBn : (post.content || post.description);

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-24">
        <section className="relative py-20 bg-navy-950 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(8,145,178,0.08)_0%,transparent_50%)]" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <nav className="text-sm text-slate-400 mb-6">
              <Link href="/" className="hover:text-teal-400">{bn ? "হোম" : "Home"}</Link>
              <span className="mx-2">/</span>
              <Link href="/blog" className="hover:text-teal-400">{bn ? "ব্লগ" : "Blog"}</Link>
              <span className="mx-2">/</span>
              <span className="text-white">{title}</span>
            </nav>
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-teal-400 mb-3 block">{post.category}</span>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">{title}</h1>
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <span>{post.author}</span>
              {post.datePublished && <span>{new Date(post.datePublished).toLocaleDateString(bn ? "bn-BD" : "en-US", { year: "numeric", month: "long", day: "numeric" })}</span>}
            </div>
          </div>
        </section>
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap">
              {content}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

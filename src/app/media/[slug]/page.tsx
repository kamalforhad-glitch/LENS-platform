import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import { getPublicMediaItem } from "@/lib/public-content";
import { headers } from "next/headers";

async function getMediaItem(slug: string) {
  return getPublicMediaItem(slug);
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
  const item = await getMediaItem(slug);
  if (!item) return { title: "Media Not Found" };

  const locale = await getLocaleFromHeaders();
  const title = locale === "bn" && item.titleBn ? item.titleBn : item.title;
  const description = locale === "bn" && item.descriptionBn ? item.descriptionBn : item.description;

  return {
    title: item.metaTitle || title,
    description: item.metaDescription || description,
    openGraph: { title: title, description: description },
    alternates: { languages: { en: `/media/${slug}`, bn: `/media/${slug}` } },
  };
}

export default async function MediaDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getMediaItem(slug);
  if (!item) notFound();

  const locale = await getLocaleFromHeaders();
  const bn = locale === "bn";

  const title = bn && item.titleBn ? item.titleBn : item.title;
  const description = bn && item.descriptionBn ? item.descriptionBn : item.description;
  const content = bn && item.contentBn ? item.contentBn : (item.content || item.description);

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
              <Link href="/media" className="hover:text-teal-400">{bn ? "মিডিয়া" : "Media"}</Link>
              <span className="mx-2">/</span>
              <span className="text-white">{title}</span>
            </nav>
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-teal-400 mb-3 block">{item.type.replace("_", " ")}</span>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">{title}</h1>
            <div className="flex items-center gap-4 text-sm text-slate-400">
              {item.source && <span>{item.source}</span>}
              {item.datePublished && <span>{new Date(item.datePublished).toLocaleDateString(bn ? "bn-BD" : "en-US", { year: "numeric", month: "long", day: "numeric" })}</span>}
            </div>
          </div>
        </section>
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap">
              {content}
            </div>
            {item.sourceUrl && (
              <div className="mt-8">
                <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline text-sm">
                  {bn ? "মূল উৎস দেখুন →" : "View Original Source →"}
                </a>
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

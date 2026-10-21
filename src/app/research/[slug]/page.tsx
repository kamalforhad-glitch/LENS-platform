import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import Breadcrumbs from "@/components/site/Breadcrumbs";
import { formatFullDate, getPublicResearchArticle } from "@/lib/public-content";
import { headers } from "next/headers";

function parseTags(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((t): t is string => typeof t === "string") : [];
  } catch {
    return [];
  }
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
  const article = await getPublicResearchArticle(slug).catch(() => null);
  if (!article) return { title: "Research Not Found" };

  const locale = await getLocaleFromHeaders();
  const title = locale === "bn" && article.titleBn ? article.titleBn : article.title;
  const description = locale === "bn" && article.descriptionBn ? article.descriptionBn : article.description;

  return {
    title: title,
    description: description,
    openGraph: { title: title, description: description },
    alternates: { languages: { en: `/research/${slug}`, bn: `/research/${slug}` } },
  };
}

export default async function ResearchDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getPublicResearchArticle(slug).catch(() => null);
  if (!article) notFound();

  const tags = parseTags(article.tags);
  const locale = await getLocaleFromHeaders();
  const bn = locale === "bn";

  const title = bn && article.titleBn ? article.titleBn : article.title;
  const description = bn && article.descriptionBn ? article.descriptionBn : article.description;
  const content = bn && article.contentBn ? article.contentBn : article.content;
  const abstract = bn && article.abstractBn ? article.abstractBn : article.abstract;
  const methodology = bn && article.methodologyBn ? article.methodologyBn : article.methodology;

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-24">
        <section className="relative py-14 lg:py-20 bg-navy-950 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(8,145,178,0.1)_0%,transparent_50%)]" aria-hidden="true" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="mb-6">
              <Breadcrumbs
                items={[
                  { label: bn ? "হোম" : "Home", href: "/" },
                  { label: bn ? "থিম" : "Theme", href: "/theme" },
                  { label: bn ? "গবেষণা" : "Research", href: "/theme/research" },
                  { label: title },
                ]}
              />
            </div>
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-teal-400 mb-3 block">
              {article.category}
            </span>
            <h1 className="text-3xl lg:text-4xl font-bold text-white leading-tight mb-4">
              {title}
            </h1>
            <p className="text-lg text-slate-300/80 leading-relaxed max-w-3xl mb-6">
              {description}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-400">
              <span className="text-slate-300">{article.author}</span>
              {article.datePublished && (
                <>
                  <span className="text-slate-600" aria-hidden="true">|</span>
                  <span>{formatFullDate(article.datePublished)}</span>
                </>
              )}
              {article.pdfUrl && (
                <>
                  <span className="text-slate-600" aria-hidden="true">|</span>
                  <a
                    href={article.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold rounded-full transition-colors"
                  >
                    {bn ? "PDF ডাউনলোড" : "Download PDF"}
                  </a>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="py-14 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {abstract && (
              <div className="mb-10 p-6 rounded-2xl bg-slate-50 border border-slate-100">
                <h2 className="text-xs font-bold tracking-[0.15em] uppercase text-slate-500 mb-3">
                  {bn ? "সংক্ষেপ" : "Abstract"}
                </h2>
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{abstract}</p>
              </div>
            )}

            {methodology && (
              <div className="mb-10 p-6 rounded-2xl bg-slate-50 border border-slate-100">
                <h2 className="text-xs font-bold tracking-[0.15em] uppercase text-slate-500 mb-3">
                  {bn ? "পদ্ধতি" : "Methodology"}
                </h2>
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{methodology}</p>
              </div>
            )}

            {content ? (
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">{content}</div>
              </div>
            ) : (
              !abstract && !methodology && (
                <p className="text-slate-500 leading-relaxed">
                  {bn ? "এই নিবন্ধের পূর্ণপাঠ ডাউনলোডযোগ্য PDF-এ উপলব্ধ।" : "The full text of this article is available in the downloadable PDF."}
                </p>
              )
            )}

            {article.doi && (
              <p className="mt-8 text-sm text-slate-500">
                DOI: <span className="font-medium text-slate-700">{article.doi}</span>
              </p>
            )}

            {tags.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span key={tag} className="px-3 py-1.5 text-xs text-slate-500 bg-slate-100 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-12 flex flex-wrap gap-3">
              <Link
                href="/theme/research"
                className="inline-flex items-center px-6 py-3 bg-navy-950 text-white text-sm font-semibold rounded-full hover:bg-navy-800 transition-colors"
              >
                {bn ? "সর্ব গবেষণা" : "All Research"}
              </Link>
              <Link
                href={`/library/${article.slug}`}
                className="inline-flex items-center px-6 py-3 border border-slate-200 text-slate-700 text-sm font-semibold rounded-full hover:border-teal-500 hover:text-teal-600 transition-colors"
              >
                {bn ? "লাইব্রেরিতে দেখুন" : "View in Library"}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

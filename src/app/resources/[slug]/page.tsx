import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import PageHero from "@/components/site/PageHero";
import SectionSubnav from "@/components/site/SectionSubnav";
import { getPublicResource } from "@/lib/public-content";
import { headers } from "next/headers";
import {
  Download,
  ExternalLink,
  FolderKanban,
  ArrowLeft,
  CheckCircle2,
  Bookmark,
} from "lucide-react";

async function getResource(slug: string) {
  return getPublicResource(slug);
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
  const resource = await getResource(slug);
  if (!resource) return { title: "Resource Not Found — LENS" };

  const locale = await getLocaleFromHeaders();
  const title = locale === "bn" && resource.titleBn ? resource.titleBn : resource.title;
  const description = locale === "bn" && resource.descriptionBn ? resource.descriptionBn : resource.description;

  return {
    title: `${title} — LENS Resources`,
    description: description,
    openGraph: { title: title, description: description },
    alternates: { languages: { en: `/resources/${slug}`, bn: `/resources/${slug}` } },
  };
}

export default async function ResourceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resource = await getResource(slug);
  if (!resource) notFound();

  const locale = await getLocaleFromHeaders();
  const bn = locale === "bn";

  const title = bn && resource.titleBn ? resource.titleBn : resource.title;
  const description = bn && resource.descriptionBn ? resource.descriptionBn : resource.description;
  const content = bn && resource.contentBn ? resource.contentBn : (resource.content || resource.description);

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-24">
        <PageHero
          accent="emerald"
          eyebrow={resource.category || (bn ? "রিসোর্স" : "Resource")}
          title={title}
          description={description}
          badge={
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Bookmark className="w-3.5 h-3.5" />
              {bn ? "ওপেন এক্সেস রিসোর্স" : "Open Access Resource"}
            </span>
          }
          breadcrumbItems={[
            { label: bn ? "হোম" : "Home", href: "/" },
            { label: bn ? "সম্পদ" : "Resources", href: "/resources" },
            { label: title },
          ]}
          actions={
            <div className="flex flex-wrap items-center gap-3">
              {resource.fileUrl && (
                <a
                  href={resource.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-500/25 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>{bn ? "ডাউনলোড ফাইল" : "Download Resource"}</span>
                </a>
              )}
              {resource.externalUrl && (
                <a
                  href={resource.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold border border-white/20 text-white hover:border-emerald-400 hover:text-emerald-300 hover:bg-white/5 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>{bn ? "মূল উৎস দেখুন" : "Visit Source"}</span>
                </a>
              )}
            </div>
          }
        />

        <SectionSubnav section="resources" activeHref="/resources" />

        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-12 gap-12">
              {/* Main Content Article */}
              <div className="lg:col-span-8">
                <article className="prose prose-slate max-w-none text-slate-700 leading-relaxed">
                  <div className="rounded-3xl bg-slate-50/70 border border-slate-200/80 p-6 sm:p-8 mb-8 text-sm text-slate-600 leading-relaxed shadow-2xs">
                    <h3 className="text-base font-bold text-slate-900 mb-2">
                      {bn ? "রিসোর্স ওভারভিউ" : "Resource Executive Summary"}
                    </h3>
                    <p>{description}</p>
                  </div>

                  <div className="text-base leading-relaxed whitespace-pre-wrap font-normal">
                    {content}
                  </div>
                </article>

                <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    href="/resources"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-500 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>{bn ? "সকল সম্পদে ফিরে যান" : "Back to All Resources"}</span>
                  </Link>
                </div>
              </div>

              {/* Sidebar Metadata */}
              <aside className="lg:col-span-4">
                <div className="sticky top-32 space-y-6">
                  <div className="rounded-3xl bg-slate-50/80 border border-slate-200/80 p-6 shadow-xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                      {bn ? "রিসোর্স মেটাডাটা" : "Resource Metadata"}
                    </h3>

                    <div className="space-y-4 text-xs">
                      <div>
                        <span className="text-slate-400 block mb-1">{bn ? "বিভাগ" : "Category"}</span>
                        <span className="font-semibold text-slate-800 bg-white border border-slate-200 px-2.5 py-1 rounded-md inline-block">
                          {resource.category}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block mb-1">{bn ? "লাইসেন্স" : "Access Mandate"}</span>
                        <span className="font-semibold text-emerald-700 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          {bn ? "পাবলিক ডোমেন / ওপেন এক্সেস" : "Public Domain / Open Access"}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block mb-1">{bn ? "অনলাইন আইডেন্টিফায়ার" : "Canonical Slug"}</span>
                        <code className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {resource.slug}
                        </code>
                      </div>
                    </div>

                    <div className="mt-6 pt-5 border-t border-slate-200/70">
                      <Link
                        href="/resources"
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:border-emerald-300 hover:text-emerald-600 transition-all shadow-2xs"
                      >
                        <FolderKanban className="w-3.5 h-3.5" />
                        <span>{bn ? "অন্যান্য রিসোর্স দেখুন" : "Browse More Toolkits"}</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

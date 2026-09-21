"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { getLibraryArticle } from "@/lib/actions/library";
import { trackDownload } from "@/lib/actions/research";
import { formatDownloads, formatDate } from "@/lib/i18n/format";

interface RelatedArticle {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  datePublished: Date | null;
}

interface Citation {
  authors: string;
  title: string;
  year: string | number | null;
  journal: string | null;
}

export default function LibraryArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const [data, setData] = useState<{
    article: {
      id: string;
      slug: string;
      title: string;
      description: string;
      content: string;
      category: string;
      author: string;
      tags: string;
      image: string | null;
      pdfUrl: string | null;
      downloads: number;
      datePublished: Date | null;
      dateModified: Date;
      citations: string;
    };
    related: RelatedArticle[];
    tags: string[];
    citations: Citation[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLibraryArticle(slug).then((result) => {
      setData(result);
      setLoading(false);
    });
  }, [slug]);

  const handleDownload = async () => {
    if (data?.article) {
      await trackDownload("research", data.article.id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <div className="text-white">{t("common.loading")}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">{t("library.article_not_found")}</h1>
          <Link href="/library" className="text-teal-400 hover:underline">{t("library.back_to_library")}</Link>
        </div>
      </div>
    );
  }

  const { article, related, tags, citations } = data;

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy-950 via-[#061224] to-navy-950">
      {/* Header */}
      <div className="relative pt-28 pb-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(8,145,178,0.08)_0%,transparent_50%)]" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link href="/library" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-teal-400 transition-colors mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
            {t("library.back_to_library")}
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 text-xs font-bold tracking-wider uppercase bg-teal-500/10 text-teal-400 rounded-full border border-teal-400/20">
              {article.category}
            </span>
            {article.datePublished && (
              <span className="text-sm text-slate-400">
                {formatDate(article.datePublished, locale)}
              </span>
            )}
          </div>

          <h1 className="text-3xl lg:text-4xl font-bold text-white leading-tight mb-4">
            {article.title}
          </h1>

          <p className="text-lg text-slate-300/70 mb-6 max-w-3xl">
            {article.description}
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 text-xs font-bold">
                {article.author.charAt(0)}
              </div>
              <span className="text-sm text-slate-300">{article.author}</span>
            </div>
            <span className="text-slate-600">|</span>
            <span className="text-sm text-slate-400">{formatDownloads(article.downloads, locale)}</span>
            {article.pdfUrl && (
              <>
                <span className="text-slate-600">|</span>
                <a
                  href={article.pdfUrl}
                  target="_blank"
                  rel="noopener"
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold rounded-full transition-all shadow-md shadow-teal-500/20"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                  {t("library.download_pdf")}
                </a>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid lg:grid-cols-[1fr_280px] gap-10">
          {/* Main content */}
          <div>
            {article.content ? (
              <div className="prose prose-invert max-w-none">
                <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/[0.06] whitespace-pre-wrap text-slate-300/80 leading-relaxed">
                  {article.content}
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
                <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                <h3 className="text-lg font-bold text-white mb-2">{t("library.pdf_preview")}</h3>
                <p className="text-sm text-slate-400 mb-4">{t("library.pdf_preview_desc")}</p>
                {article.pdfUrl && (
                  <a href={article.pdfUrl} target="_blank" rel="noopener" onClick={handleDownload} className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold rounded-full transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                    {t("library.download_pdf")}
                  </a>
                )}
              </div>
            )}

            {/* Citations */}
            {citations.length > 0 && (
              <div className="mt-10">
                <h2 className="text-lg font-bold text-white mb-4">{t("library.citations")}</h2>
                <div className="space-y-3">
                  {citations.map((cit, i) => (
                    <div key={i} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <p className="text-sm text-slate-300">
                        <span className="font-semibold">{cit.authors}</span> ({cit.year}). {cit.title}. <span className="italic">{cit.journal}</span>.
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Tags */}
            {tags.length > 0 && (
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <h3 className="text-xs font-bold tracking-[0.15em] uppercase text-slate-400 mb-3">{t("library.topics")}</h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Link key={tag} href={`/library?topic=${encodeURIComponent(tag)}`} className="px-3 py-1.5 text-xs text-slate-400 bg-white/5 rounded-full hover:bg-teal-500/10 hover:text-teal-400 transition-colors">
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Citation info */}
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <h3 className="text-xs font-bold tracking-[0.15em] uppercase text-slate-400 mb-3">{t("library.cite_this")}</h3>
              <div className="p-3 rounded-lg bg-white/5 text-xs text-slate-400 font-mono leading-relaxed">
                {article.author}. ({article.datePublished ? new Date(article.datePublished).getFullYear() : "n.d."}). {article.title}. LENS.
              </div>
              <button
                onClick={() => navigator.clipboard?.writeText(`${article.author}. (${article.datePublished ? new Date(article.datePublished).getFullYear() : "n.d."}). ${article.title}. LENS.`)}
                className="mt-2 text-xs text-teal-400 hover:underline"
              >
                {t("library.copy_citation")}
              </button>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="text-[10px] text-slate-500">{t("common.export")}:</span>
                {(["bibtex", "ris", "apa", "chicago", "vancouver"] as const).map((fmt) => (
                  <a
                    key={fmt}
                    href={`/api/academic/cite/${article.id}?format=${fmt}`}
                    target="_blank"
                    rel="noopener"
                    className="px-2 py-0.5 text-[10px] font-medium border border-white/10 rounded hover:bg-teal-500/10 hover:text-teal-400 text-slate-400 transition-colors"
                  >
                    {fmt.toUpperCase()}
                  </a>
                ))}
              </div>
            </div>

            {/* Related */}
            {related.length > 0 && (
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <h3 className="text-xs font-bold tracking-[0.15em] uppercase text-slate-400 mb-3">{t("library.related_research")}</h3>
                <div className="space-y-3">
                  {related.map((rel) => (
                    <Link key={rel.id} href={`/library/${rel.slug}`} className="block group">
                      <h4 className="text-sm font-semibold text-white group-hover:text-teal-400 transition-colors line-clamp-2">{rel.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{rel.category}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

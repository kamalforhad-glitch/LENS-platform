"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { use } from "react";

interface Researcher {
  id: string;
  slug: string;
  name: string;
  email: string | null;
  affiliation: string;
  position: string;
  bio: string;
  image: string | null;
  orcid: string | null;
  website: string | null;
  social: string;
  researchAreas: string;
  expertise: string;
  education: string;
  languages: string;
  articleCount: number;
  totalDownloads: number;
  totalCitations: number;
  featured: boolean;
  articleLinks: { article: { id: string; slug: string; title: string; category: string; downloads: number; datePublished: string | null } }[];
}

export default function ResearcherProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [researcher, setResearcher] = useState<Researcher | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/researchers?slug=${slug}`)
      .then((r) => r.json())
      .then((data) => {
        setResearcher(data.researcher || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  const parseJson = (str: string): string[] => {
    try { return JSON.parse(str); } catch { return []; }
  };

  const parseSocial = (str: string): Record<string, string> => {
    try { return JSON.parse(str); } catch { return {}; }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!researcher) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Researcher Not Found</h1>
          <Link href="/researchers" className="text-teal-400 hover:underline">Back to Researchers</Link>
        </div>
      </div>
    );
  }

  const areas = parseJson(researcher.researchAreas);
  const expert = parseJson(researcher.expertise);
  const social = parseSocial(researcher.social);

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy-950 via-[#061224] to-navy-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(8,145,178,0.06)_0%,transparent_50%)]" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24 relative z-10">
        <Link href="/researchers" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-teal-400 transition-colors mb-8">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
          Back to Researchers
        </Link>

        {/* Profile Header */}
        <div className="flex items-start gap-6 mb-10">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-3xl font-bold shrink-0">
            {researcher.image ? (
              <img src={researcher.image} alt={researcher.name} className="w-24 h-24 rounded-full object-cover" />
            ) : (
              researcher.name.charAt(0)
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">{researcher.name}</h1>
            {researcher.position && <p className="text-lg text-slate-300">{researcher.position}</p>}
            {researcher.affiliation && <p className="text-sm text-slate-400">{researcher.affiliation}</p>}
            {researcher.orcid && (
              <a href={`https://orcid.org/${researcher.orcid}`} target="_blank" rel="noopener noreferrer" className="text-xs text-teal-400 hover:underline mt-1 inline-block">
                ORCID: {researcher.orcid}
              </a>
            )}
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
            <p className="text-2xl font-bold text-teal-400">{researcher.articleCount}</p>
            <p className="text-xs text-slate-400 mt-1">Publications</p>
          </div>
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
            <p className="text-2xl font-bold text-teal-400">{researcher.totalDownloads.toLocaleString()}</p>
            <p className="text-xs text-slate-400 mt-1">Downloads</p>
          </div>
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
            <p className="text-2xl font-bold text-teal-400">{researcher.totalCitations}</p>
            <p className="text-xs text-slate-400 mt-1">Citations</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_300px] gap-10">
          <div className="space-y-8">
            {/* Bio */}
            {researcher.bio && (
              <div>
                <h2 className="text-sm font-bold tracking-[0.15em] uppercase text-slate-400 mb-3">About</h2>
                <p className="text-sm text-slate-300/80 leading-relaxed whitespace-pre-wrap">{researcher.bio}</p>
              </div>
            )}

            {/* Research Areas */}
            {areas.length > 0 && (
              <div>
                <h2 className="text-sm font-bold tracking-[0.15em] uppercase text-slate-400 mb-3">Research Areas</h2>
                <div className="flex flex-wrap gap-2">
                  {areas.map((a: string, i: number) => (
                    <span key={i} className="px-3 py-1.5 text-xs text-teal-400 bg-teal-500/10 rounded-full border border-teal-400/20">{a}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Publications */}
            {researcher.articleLinks.length > 0 && (
              <div>
                <h2 className="text-sm font-bold tracking-[0.15em] uppercase text-slate-400 mb-4">Publications</h2>
                <div className="space-y-3">
                  {researcher.articleLinks.map((link) => (
                    <Link
                      key={link.article.id}
                      href={`/library/${link.article.slug}`}
                      className="block p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-teal-400/20 transition-all"
                    >
                      <h3 className="text-sm font-semibold text-white hover:text-teal-400 transition-colors">{link.article.title}</h3>
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                        <span>{link.article.category}</span>
                        <span>{link.article.downloads} downloads</span>
                        {link.article.datePublished && (
                          <span>{new Date(link.article.datePublished).getFullYear()}</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Expertise */}
            {expert.length > 0 && (
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <h3 className="text-xs font-bold tracking-[0.15em] uppercase text-slate-400 mb-3">Expertise</h3>
                <div className="flex flex-wrap gap-1.5">
                  {expert.map((e: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 text-[10px] text-slate-400 bg-white/5 rounded-full">{e}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Contact */}
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <h3 className="text-xs font-bold tracking-[0.15em] uppercase text-slate-400 mb-3">Contact</h3>
              <div className="space-y-2">
                {researcher.email && (
                  <a href={`mailto:${researcher.email}`} className="block text-sm text-teal-400 hover:underline">{researcher.email}</a>
                )}
                {researcher.website && (
                  <a href={researcher.website} target="_blank" rel="noopener noreferrer" className="block text-sm text-teal-400 hover:underline">{researcher.website}</a>
                )}
                {Object.entries(social).map(([platform, url]) => (
                  <a key={platform} href={url as string} target="_blank" rel="noopener noreferrer" className="block text-sm text-teal-400 hover:underline capitalize">{platform}</a>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

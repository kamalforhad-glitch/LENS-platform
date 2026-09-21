"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Researcher {
  id: string;
  slug: string;
  name: string;
  affiliation: string;
  position: string;
  bio: string;
  image: string | null;
  orcid: string | null;
  researchAreas: string;
  expertise: string;
  articleCount: number;
  totalDownloads: number;
  totalCitations: number;
  featured: boolean;
}

export default function ResearchersPage() {
  const [researchers, setResearchers] = useState<Researcher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/researchers")
      .then((r) => r.json())
      .then((data) => {
        setResearchers(data.researchers || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = researchers.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.affiliation.toLowerCase().includes(search.toLowerCase())
  );

  const parseJson = (str: string): string[] => {
    try { return JSON.parse(str); } catch { return []; }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy-950 via-[#061224] to-navy-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(8,145,178,0.06)_0%,transparent_50%)]" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24 relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3">Researcher Network</h1>
          <p className="text-slate-400 max-w-xl mx-auto">Our affiliated researchers and their contributions to media studies</p>
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-10">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search researchers..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
          />
        </div>

        {loading ? (
          <div className="text-center text-slate-400 py-12">Loading researchers...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-slate-400 py-12">No researchers found</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((r) => {
              const areas = parseJson(r.researchAreas);
              const expert = parseJson(r.expertise);
              return (
                <Link
                  key={r.id}
                  href={`/researchers/${r.slug}`}
                  className="group p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-teal-400/20 transition-all"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-lg font-bold shrink-0">
                      {r.image ? (
                        <img src={r.image} alt={r.name} className="w-14 h-14 rounded-full object-cover" />
                      ) : (
                        r.name.charAt(0)
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-white group-hover:text-teal-400 transition-colors truncate">{r.name}</h3>
                      {r.position && <p className="text-xs text-slate-400 truncate">{r.position}</p>}
                      {r.affiliation && <p className="text-xs text-slate-500 truncate">{r.affiliation}</p>}
                    </div>
                  </div>

                  {areas.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {areas.slice(0, 3).map((a: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 text-[10px] bg-teal-500/10 text-teal-400 rounded-full border border-teal-400/20">{a}</span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>{r.articleCount} publications</span>
                    <span>{r.totalDownloads.toLocaleString()} downloads</span>
                    <span>{r.totalCitations} citations</span>
                  </div>

                  {r.orcid && (
                    <p className="text-[10px] text-slate-600 mt-2">ORCID: {r.orcid}</p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

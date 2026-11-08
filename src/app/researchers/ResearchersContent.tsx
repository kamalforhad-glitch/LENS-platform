"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";

interface Researcher {
  id: string;
  slug: string;
  name: string;
  nameBn: string;
  affiliation: string;
  affiliationBn: string;
  position: string;
  positionBn: string;
  bio: string;
  bioBn: string;
  image: string | null;
  orcid: string | null;
  researchAreas: string;
  researchAreasBn: string;
  expertise: string;
  expertiseBn: string;
  articleCount: number;
  totalDownloads: number;
  totalCitations: number;
  featured: boolean;
}

type Props = {
  initialResearchers?: Researcher[];
  researchersError?: boolean;
};

export default function ResearchersPage({ initialResearchers = [], researchersError = false }: Props) {
  const { t, i18n } = useTranslation();
  const isBn = String(i18n.language || "en").toLowerCase().startsWith("bn");
  const [researchers, setResearchers] = useState<Researcher[]>(initialResearchers);
  const [loading, setLoading] = useState(!initialResearchers || initialResearchers.length === 0);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(researchersError);

  // Fetch researchers server-side on mount if no initial data was provided.
  useEffect(() => {
    if (initialResearchers && initialResearchers.length > 0) return;
    if (loading === false && !error) return;

    const abort = new AbortController();
    fetch("/api/researchers", { signal: abort.signal })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load researchers");
        return r.json();
      })
      .then((data) => {
        const items: Researcher[] = (data.researchers || []).map((r: any) => ({
          ...r,
          nameBn: r.nameBn || "",
          affiliationBn: r.affiliationBn || "",
          positionBn: r.positionBn || "",
          bioBn: r.bioBn || "",
        }));
        setResearchers(items);
        setLoading(false);
        setError(false);
      })
      .catch(() => {
        setLoading(false);
        setError(true);
      });

    return () => abort.abort();
  }, [initialResearchers]);

  const filtered = useCallback(() => {
    const q = search.toLowerCase();
    return researchers.filter((r) =>
      r.name.toLowerCase().includes(q) ||
      r.nameBn.toLowerCase().includes(q) ||
      r.affiliation.toLowerCase().includes(q) ||
      r.affiliationBn.toLowerCase().includes(q) ||
      r.position.toLowerCase().includes(q) ||
      r.positionBn.toLowerCase().includes(q)
    );
  }, [researchers, search]);

  const parseJson = (str: string): string[] => {
    try { return JSON.parse(str); } catch { return []; }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-navy-950 via-[#061224] to-navy-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24 relative z-10">
          <div className="text-center py-20 text-slate-400">Loading researchers…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-navy-950 via-[#061224] to-navy-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24 relative z-10">
          <div className="text-center py-20">
            <p className="text-slate-400 text-sm">{t("researchers.emptyMessage") || "Unable to load researchers at the moment."}</p>
          </div>
        </div>
      </div>
    );
  }

  const items = filtered();
  const heading = isBn ? "গবেষক নেটওয়ার্ক" : "Researcher Network";
  const subheading = isBn
    ? "আমাদের সংশ্লিষ্ট গবেষকগণ এবং মিডিয়া গবেষণায় তাদের অবদান"
    : "Our affiliated researchers and their contributions to media studies";

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-navy-950 via-[#061224] to-navy-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24 relative z-10">
          <div className="text-center mb-12">
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3">{heading}</h1>
            <p className="text-slate-400 max-w-xl mx-auto">{subheading}</p>
          </div>
          <div className="max-w-md mx-auto mb-10">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isBn ? "গবেষক খুঁজুন..." : "Search researchers..."}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            />
          </div>
          <div className="text-center text-slate-400 py-12">
            {search ? "কোনো গবেষক পাওয়া যায়নি" : "No researchers found"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy-950 via-[#061224] to-navy-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(8,145,178,0.06)_0%,transparent_50%)]" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24 relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3">{heading}</h1>
          <p className="text-slate-400 max-w-xl mx-auto">{subheading}</p>
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-10">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isBn ? "গবেষক খুঁজুন..." : "Search researchers..."}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
          />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((r) => {
            const areas = parseJson(isBn && r.researchAreasBn ? r.researchAreasBn : r.researchAreas);
            return (
              <Link
                key={r.id}
                href={`/researchers/${r.slug}`}
                className="group p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-teal-400/20 transition-all"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-lg font-bold shrink-0">
                    {r.image ? (
                      <Image src={r.image} alt={r.name} width={56} height={56} className="w-14 h-14 rounded-full object-cover" />
                    ) : (
                      r.name.charAt(0)
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-white group-hover:text-teal-400 transition-colors truncate">
                      {isBn && r.nameBn ? r.nameBn : r.name}
                    </h3>
                    {r.position && <p className="text-xs text-slate-400 truncate">{isBn && r.positionBn ? r.positionBn : r.position}</p>}
                    {r.affiliation && <p className="text-xs text-slate-500 truncate">{isBn && r.affiliationBn ? r.affiliationBn : r.affiliation}</p>}
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
      </div>
    </div>
  );
}

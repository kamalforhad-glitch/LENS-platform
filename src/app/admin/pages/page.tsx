"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface PageItem { id: string; slug: string; title: string; titleBn: string; status: string; sortOrder: number; dateModified: string; }

export default function PagesAdmin() {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => { fetch("/api/admin/pages").then(r => r.json()).then(d => { setPages(d.pages || []); setLoading(false); }); }, []);

  const filtered = pages.filter(p => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.slug.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || p.status === filter;
    return matchSearch && matchFilter;
  });

  const counts = { all: pages.length, published: pages.filter(p => p.status === "published").length, draft: pages.filter(p => p.status === "draft").length };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-white">Pages</h1><p className="text-slate-400 text-sm mt-1">Manage CMS pages and content sections.</p></div>
        <Link href="/admin/pages/new" className="px-4 py-2.5 bg-teal-500 text-white rounded-lg text-sm font-semibold hover:bg-teal-400 transition-colors">+ New Page</Link>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input type="text" placeholder="Search pages..." value={search} onChange={e => setSearch(e.target.value)} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 w-64" />
        <div className="flex gap-1 bg-white/5 rounded-lg p-1">
          {(["all", "published", "draft"] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filter === s ? "bg-teal-500 text-white" : "text-slate-400 hover:text-white"}`}>{s.charAt(0).toUpperCase() + s.slice(1)} <span className="ml-1 opacity-60">{counts[s]}</span></button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 animate-pulse"><div className="flex items-center gap-4"><div className="flex-1"><div className="h-4 bg-white/10 rounded w-48 mb-2" /><div className="h-3 bg-white/5 rounded w-32" /></div></div></div>)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 mb-4"><svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" /></svg></div>
          <h3 className="text-lg font-semibold text-white mb-1">No pages found</h3>
          <p className="text-slate-400 text-sm text-center max-w-sm">{search || filter !== "all" ? "Try adjusting your search or filters." : "Create your first CMS page."}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => (
            <div key={p.id} className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-all">
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium truncate">{p.title} {p.titleBn && <span className="text-slate-500 text-sm">/ {p.titleBn}</span>}</h3>
                <p className="text-slate-400 text-sm mt-0.5">/{p.slug}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === "published" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>{p.status}</span>
              <span className="text-xs text-slate-500">{new Date(p.dateModified).toLocaleDateString()}</span>
              <Link href={`/admin/pages/${p.id}`} className="px-2 py-1 text-xs text-teal-400 hover:bg-teal-500/10 rounded transition-colors">Edit</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

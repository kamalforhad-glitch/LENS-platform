"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import Link from "next/link";
import { updatePage, duplicatePage } from "@/lib/actions/cms";

interface PageItem {
  id: string;
  slug: string;
  title: string;
  titleBn: string;
  status: string;
  sortOrder: number;
  dateModified: string;
}

export default function PagesAdmin() {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/pages")
      .then((r) => r.json())
      .then((d) => {
        setPages(d.pages || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const run = async (id: string, fn: () => Promise<unknown>, message: string) => {
    setBusyId(id);
    setError(null);
    try {
      await fn();
      startTransition(load);
    } catch (err) {
      setError(err instanceof Error ? err.message : message);
    } finally {
      setBusyId(null);
    }
  };

  const setStatus = (p: PageItem, status: string) =>
    run(p.id, () => updatePage(p.id, { status }), "Status change failed");

  const duplicate = (p: PageItem) =>
    run(p.id, async () => duplicatePage(p.id), "Duplicate failed");

  const filtered = pages.filter(p => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.slug.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || p.status === filter;
    return matchSearch && matchFilter;
  });

  const counts = {
    all: pages.length,
    published: pages.filter(p => p.status === "published").length,
    draft: pages.filter(p => p.status === "draft").length,
    archived: pages.filter(p => p.status === "archived").length,
  };

  const statusBadge = (status: string) =>
    status === "published" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : status === "archived" ? "bg-slate-100 text-slate-600 border border-slate-200" : "bg-amber-50 text-amber-700 border border-amber-200";

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-slate-900">Pages</h1><p className="text-slate-500 text-sm mt-1">Manage CMS pages and content sections.</p></div>
        <Link href="/admin/pages/new" className="px-4 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 shadow-xs transition-colors">+ New Page</Link>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input type="text" placeholder="Search pages..." value={search} onChange={e => setSearch(e.target.value)} className="px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 w-64" />
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1 border border-slate-200">
          {(["all", "published", "draft", "archived"] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filter === s ? "bg-white text-slate-900 shadow-xs font-semibold" : "text-slate-600 hover:text-slate-900"}`}>{s.charAt(0).toUpperCase() + s.slice(1)} <span className="ml-1 opacity-60">{counts[s]}</span></button>
          ))}
        </div>
      </div>
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="p-4 rounded-xl bg-white border border-slate-200 animate-pulse"><div className="flex items-center gap-4"><div className="flex-1"><div className="h-4 bg-slate-100 rounded w-48 mb-2" /><div className="h-3 bg-slate-100 rounded w-32" /></div></div></div>)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4"><svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" /></svg></div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">No pages found</h3>
          <p className="text-slate-500 text-sm text-center max-w-sm">{search || filter !== "all" ? "Try adjusting your search or filters." : "Create your first CMS page."}</p>
        </div>
      ) : (
        <div className={isPending ? "space-y-2 opacity-60 transition-opacity" : "space-y-2"}>
          {filtered.map(p => (
            <div key={p.id} className="flex items-center gap-3 p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all flex-wrap">
              <div className="flex-1 min-w-0">
                <h3 className="text-slate-900 font-medium truncate">
                  {p.title} {p.titleBn && <span className="text-slate-500 text-sm">/ {p.titleBn}</span>}
                </h3>
                <p className="text-slate-500 text-sm mt-0.5">/{p.slug}{p.slug === "home" && <span className="ml-2 text-[10px] uppercase tracking-wider text-teal-400">homepage</span>}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge(p.status)}`}>{p.status}</span>
              <span className="text-xs text-slate-500">{new Date(p.dateModified).toLocaleDateString()}</span>
              <div className="flex items-center gap-1">
                <Link href={`/admin/pages/${p.id}`} className="px-2.5 py-1 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded transition-colors">Edit</Link>
                <Link href={`/admin/preview/${p.id}`} className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded transition-colors" title="Preview draft">Preview</Link>
                {p.status === "published" && p.slug !== "home" && (
                  <a href={`/${p.slug}`} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded transition-colors" title="View live">View</a>
                )}
                {busyId === p.id ? (
                  <span className="px-2 py-1 text-xs text-slate-500">…</span>
                ) : (
                  <>
                    <button onClick={() => setStatus(p, p.status === "published" ? "draft" : "published")} className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors">
                      {p.status === "published" ? "Unpublish" : "Publish"}
                    </button>
                    {p.slug !== "home" && (
                      <button onClick={() => duplicate(p)} className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded transition-colors">Duplicate</button>
                    )}
                    {p.status !== "archived" ? (
                      <button onClick={() => setStatus(p, "archived")} className="px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded transition-colors">Archive</button>
                    ) : (
                      <button onClick={() => setStatus(p, "draft")} className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded transition-colors">Restore</button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

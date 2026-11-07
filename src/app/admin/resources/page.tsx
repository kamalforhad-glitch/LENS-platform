"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Resource { id: string; slug: string; title: string; titleBn: string; category: string; type: string; status: string; downloads: number; }

interface ResourceApiResponse {
  resources: Resource[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
  counts: Record<string, number>;
}

interface ResourceCounts { all: number; published: number; draft: number; }

const DEFAULT_COUNTS: ResourceCounts = { all: 0, published: 0, draft: 0 };
const RESOURCE_STATUSES: readonly string[] = ["all", "published", "draft"];

export default function ResourcesAdmin() {
  const [items, setItems] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [counts, setCounts] = useState<ResourceCounts>(DEFAULT_COUNTS);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    params.set("page", String(currentPage));
    params.set("limit", String(limit));
    if (search) params.set("search", search);
    if (filter !== "all") params.set("status", filter);

    fetch(`/api/admin/resources?${params.toString()}`)
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({ error: `Request failed (${r.status})` }));
          throw new Error(err.error || `Request failed (${r.status})`);
        }
        return r.json();
      })
      .then((d: ResourceApiResponse) => {
        setItems(d.resources || []);
        setTotal(d.total || 0);
        setTotalPages(d.totalPages || 1);
        setHasMore(d.hasMore || false);
        setCounts({ ...DEFAULT_COUNTS, ...(d.counts || {}) });
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load resources.");
        setLoading(false);
      });
  }, [currentPage, limit, search, filter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

  useEffect(() => { load(); }, [load]);

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this resource?")) return;
    await fetch("/api/admin/resources", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    load();
  };

  return (
    <div className="p-6">
      {error && (
        <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-800 text-sm">
          {error}
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-slate-900">Resources</h1><p className="text-slate-500 text-sm mt-1">Documents, datasets and tools.</p></div>
        <Link href="/admin/resources/new" className="px-4 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 shadow-xs transition-colors">+ New Resource</Link>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input type="text" placeholder="Search resources..." value={search} onChange={e => setSearch(e.target.value)} className="px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 w-64" />
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1 border border-slate-200">
          {(RESOURCE_STATUSES).map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filter === s ? "bg-white text-slate-900 shadow-xs font-semibold" : "text-slate-600 hover:text-slate-900"}`}>{s.charAt(0).toUpperCase() + s.slice(1)} <span className="ml-1 opacity-60">{counts[s as keyof ResourceCounts] ?? 0}</span></button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="p-4 rounded-xl bg-white border border-slate-200 animate-pulse"><div className="flex items-center gap-4"><div className="flex-1"><div className="h-4 bg-slate-100 rounded w-48 mb-2" /><div className="h-3 bg-slate-100 rounded w-64" /></div></div></div>)}</div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4"><svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4" /></svg></div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">No resources found</h3>
          <p className="text-slate-500 text-sm text-center max-w-sm">{search || filter !== "all" ? "Try adjusting your search or filters." : "Get started by adding your first resource."}</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all">
                <div className="flex-1 min-w-0">
                  <h3 className="text-slate-900 font-medium truncate">{item.title}</h3>
                  <p className="text-slate-500 text-sm mt-0.5">{item.type} · {item.downloads} downloads</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400">{item.category}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${item.status === "published" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>{item.status}</span>
                <div className="flex items-center gap-1">
                  <Link href={`/admin/resources/${item.id}`} className="px-2.5 py-1 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded transition-colors">Edit</Link>
                  <button onClick={() => deleteItem(item.id)} className="px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded transition-colors">Delete</button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination controls */}
          <div className="mt-6 flex items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              Showing {total} total record{total !== 1 ? "s" : ""} &nbsp;|&nbsp;
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={!hasMore}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

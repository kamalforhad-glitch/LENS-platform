"use client";

import { useState, useEffect, useCallback } from "react";

interface Submission { id: string; name: string; email: string; subject: string; message: string; status: string; createdAt: string; }

interface SubmissionApiResponse {
  submissions: Submission[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

function SkeletonItem() {
  return (
    <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-4 w-24 rounded bg-slate-100 animate-pulse" />
          <div className="h-3 w-32 rounded bg-slate-100 animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-5 w-14 rounded-full bg-slate-100 animate-pulse" />
          <div className="h-3 w-16 rounded bg-slate-100 animate-pulse" />
        </div>
      </div>
      <div className="h-3 w-48 rounded bg-slate-100 animate-pulse mt-2" />
    </div>
  );
}

export default function ContactAdmin() {
  const [items, setItems] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Submission | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const loadItems = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    params.set("page", String(currentPage));
    params.set("limit", String(limit));
    if (search) params.set("search", search);
    if (filter !== "all") params.set("status", filter);

    fetch(`/api/admin/contact?${params.toString()}`)
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({ error: `Request failed (${r.status})` }));
          throw new Error(err.error || `Request failed (${r.status})`);
        }
        return r.json();
      })
      .then((d: SubmissionApiResponse) => {
        setItems(d.submissions || []);
        setTotal(d.total || 0);
        setTotalPages(d.totalPages || 1);
        setHasMore(d.hasMore || false);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load submissions.");
        setLoading(false);
      });
  }, [currentPage, limit, search, filter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const updateStatus = async (id: string, status: string) => {
    await fetch("/api/admin/contact", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i));
    if (selected?.id === id) setSelected({ ...selected, status });
  };

  return (
    <div className="p-6">
      {error && (
        <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-800 text-sm">
          {error}
        </div>
      )}
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Contact Submissions</h1>
      <p className="text-sm text-slate-500 mb-6">View and manage messages from the contact form.</p>

      <div className="flex flex-wrap gap-2 mb-6">
        <input placeholder="Search name, email, subject..." value={search} onChange={(e) => setSearch(e.target.value)} className="px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 w-64" />
        {["all", "new", "read", "resolved"].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === s ? "bg-teal-600 text-white shadow-xs" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"}`}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
        ))}
      </div>

      <div className="text-xs text-slate-500 mb-4">
        Showing {total} total record{total !== 1 ? "s" : ""} &nbsp;|&nbsp; Page {currentPage} of {totalPages}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonItem key={i} />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-12 h-12 mx-auto text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className="text-slate-400 text-sm font-medium">No submissions found</p>
          <p className="text-slate-600 text-xs mt-1">
            {filter !== "all" || search ? "Try selecting a different filter or adjusting your search." : "Messages from the contact form will appear here"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className={`p-4 rounded-xl border cursor-pointer transition-all ${item.status === "new" ? "bg-teal-50/50 border-teal-300" : "bg-white border-slate-200"} ${selected?.id === item.id ? "ring-1 ring-teal-400" : ""}`} onClick={() => setSelected(item)}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-slate-900 font-medium text-sm">{item.name}</span>
                  <span className="text-slate-500 text-xs ml-2">{item.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${item.status === "new" ? "bg-blue-50 text-blue-700 border border-blue-200" : item.status === "resolved" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-600 border border-slate-200"}`}>{item.status}</span>
                  <span className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <p className="text-slate-600 text-xs mt-1">{item.subject}</p>
            </div>
          ))}
        </div>
      )}

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

      {selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-900 mb-2">{selected.subject}</h2>
            <p className="text-sm text-slate-500 mb-4">From: {selected.name} ({selected.email}) · {new Date(selected.createdAt).toLocaleString()}</p>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 whitespace-pre-wrap mb-4">{selected.message}</div>
            <div className="flex gap-2">
              {["new", "read", "resolved"].map(s => (
                <button key={s} onClick={() => updateStatus(selected.id, s)} className={`px-3 py-1.5 rounded-full text-xs font-medium ${selected.status === s ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"}`}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

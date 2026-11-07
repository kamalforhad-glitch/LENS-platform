"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Program { id: string; slug: string; title: string; titleBn: string; description: string; category: string; status: string; }

interface ProgramApiResponse {
  programs: Program[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export default function ProgramsAdmin() {
  const [items, setItems] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    params.set("page", String(currentPage));
    params.set("limit", String(limit));

    fetch(`/api/admin/programs?${params.toString()}`)
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({ error: `Request failed (${r.status})` }));
          throw new Error(err.error || `Request failed (${r.status})`);
        }
        return r.json();
      })
      .then((d: ProgramApiResponse) => {
        setItems(d.programs || []);
        setTotal(d.total || 0);
        setTotalPages(d.totalPages || 1);
        setHasMore(d.hasMore || false);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load programs.");
        setLoading(false);
      });
  }, [currentPage, limit]);

  useEffect(() => { load(); }, [load]);

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this program?")) return;
    await fetch("/api/admin/programs", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
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
        <h1 className="text-2xl font-bold text-slate-900">Programs</h1>
        <Link href="/admin/programs/new" className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 shadow-xs">New Program</Link>
      </div>
      {loading ? <div className="text-slate-400">Loading...</div> : (
        <>
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xs">
                <div className="flex-1">
                  <h3 className="text-slate-900 font-medium">{item.title} {item.titleBn && <span className="text-slate-500 text-sm">/ {item.titleBn}</span>}</h3>
                  <p className="text-slate-500 text-sm mt-1">{item.description}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">{item.category}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${item.status === "published" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>{item.status}</span>
                <Link href={`/admin/programs/${item.id}`} className="px-2.5 py-1 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded border border-teal-200">Edit</Link>
                <button onClick={() => deleteItem(item.id)} className="px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded border border-red-200">Delete</button>
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

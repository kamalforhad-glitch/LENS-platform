"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getPublications, deletePublication } from "@/lib/actions/publications";
import type { AdminPublication, PaginatedResult } from "@/lib/admin-types";

const TYPES = ["All", "Policy Brief", "Working Paper", "Research Report", "Report"];
const STATUSES = ["All", "draft", "published", "archived"];

function SkeletonRow() {
  return (
    <tr className="border-b border-white/5">
      <td className="px-4 py-3">
        <div className="h-4 w-40 rounded bg-white/5 animate-pulse" />
        <div className="h-3 w-20 rounded bg-white/5 animate-pulse mt-2" />
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        <div className="h-3 w-24 rounded bg-white/5 animate-pulse" />
      </td>
      <td className="px-4 py-3">
        <div className="h-5 w-16 rounded-full bg-white/5 animate-pulse" />
      </td>
      <td className="px-4 py-3 hidden sm:table-cell">
        <div className="h-3 w-8 rounded bg-white/5 animate-pulse" />
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-2">
          <div className="h-6 w-12 rounded bg-white/5 animate-pulse" />
          <div className="h-6 w-14 rounded bg-white/5 animate-pulse" />
        </div>
      </td>
    </tr>
  );
}

export default function AdminPublicationsPage() {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResult<AdminPublication> | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await getPublications(page, 15, {
      status: status === "All" ? "all" : status,
      type: type === "All" ? "all" : type,
      search,
    });
    setData(result);
    setLoading(false);
  }, [page, status, type, search]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Publications</h1>
          <p className="text-sm text-slate-400 mt-1">Manage policy briefs, working papers, and reports.</p>
        </div>
        <Link href="/admin/publications/new" className="px-4 py-2.5 bg-blue-500 hover:bg-blue-400 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm text-center">
          + New Publication
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Search publications..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 w-60" />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30">
          {STATUSES.map((s) => <option key={s} value={s === "All" ? "all" : s}>{s === "All" ? "All Statuses" : s}</option>)}
        </select>
        <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30">
          {TYPES.map((t) => <option key={t} value={t === "All" ? "all" : t}>{t === "All" ? "All Types" : t}</option>)}
        </select>
      </div>

      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="text-left px-4 py-3 font-semibold text-slate-400">Title</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-400 hidden md:table-cell">Type</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-400">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-400 hidden sm:table-cell">Downloads</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : !data || data.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <svg className="w-12 h-12 mx-auto text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <p className="text-slate-400 text-sm font-medium">No publications found</p>
                    <p className="text-slate-600 text-xs mt-1">
                      {search || status !== "all" || type !== "all"
                        ? "Try adjusting your filters or search query"
                        : "Create your first publication to get started"}
                    </p>
                    {!search && status === "all" && type === "all" && (
                      <Link href="/admin/publications/new" className="inline-block mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white text-sm font-semibold rounded-lg transition-colors">
                        + New Publication
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                data.items.map((item) => (
                  <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white truncate max-w-[200px]">{item.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{new Date(item.dateCreated).toLocaleDateString()}</div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell"><span className="text-xs text-slate-400">{item.type}</span></td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${item.status === "published" ? "bg-emerald-500/20 text-emerald-400" : item.status === "archived" ? "bg-slate-500/20 text-slate-400" : "bg-amber-500/20 text-amber-400"}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell"><span className="text-xs text-slate-400">{item.downloads}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => router.push(`/admin/publications/${item.id}`)} className="px-2 py-1 text-xs text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors">Edit</button>
                        <button onClick={async () => { if (confirm("Delete?")) { await deletePublication(item.id); load(); } }} className="px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 rounded transition-colors">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data && data.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
            <span className="text-xs text-slate-500">Page {data.page} of {data.pages}</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1 text-xs border border-white/10 text-slate-400 rounded disabled:opacity-40 hover:bg-white/5 transition-colors">Prev</button>
              <button onClick={() => setPage(Math.min(data.pages, page + 1))} disabled={page === data.pages} className="px-3 py-1 text-xs border border-white/10 text-slate-400 rounded disabled:opacity-40 hover:bg-white/5 transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

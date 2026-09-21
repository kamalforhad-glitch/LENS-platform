"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getReviewQueue, getReviewStats } from "@/lib/actions/review";

interface ReviewItem {
  id: string;
  status: string;
  deadline: Date | null;
  notes: string;
  createdAt: Date;
  reviewer?: { id: string; name: string; email: string } | null;
  article?: { id: string; slug: string; title: string; category: string; author: string; reviewStatus: string; version: number };
  _count?: { comments: number };
}

interface Stats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  declined: number;
  unresolvedComments: number;
}

const STATUSES = ["all", "pending", "in_progress", "completed", "declined"];

export default function AdminReviewPage() {
  const [data, setData] = useState<{ items: ReviewItem[]; total: number; pages: number } | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [result, statsResult] = await Promise.all([
      getReviewQueue(page, 20, { status, search }),
      getReviewStats(),
    ]);
    setData(result);
    setStats(statsResult);
    setLoading(false);
  }, [page, status, search]);

  useEffect(() => { load(); }, [load]);

  const formatDate = (d: Date | null) => d ? new Date(d).toLocaleDateString() : "—";

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Review Queue</h1>
          <p className="text-sm text-slate-500 mt-1">Manage peer review assignments and comments.</p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-sm text-slate-500">Total</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-sm text-slate-500">Pending</div>
            <div className="text-2xl font-bold text-amber-600 mt-1">{stats.pending}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-sm text-slate-500">In Progress</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">{stats.inProgress}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-sm text-slate-500">Completed</div>
            <div className="text-2xl font-bold text-green-600 mt-1">{stats.completed}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-sm text-slate-500">Unresolved</div>
            <div className="text-2xl font-bold text-red-600 mt-1">{stats.unresolvedComments}</div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search articles..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 w-60"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s === "all" ? "All Statuses" : s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading...</div>
        ) : !data || data.items.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No review assignments found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Article</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">Reviewer</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden sm:table-cell">Deadline</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden lg:table-cell">Comments</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 truncate max-w-[250px]">{item.article?.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{item.article?.category} &middot; v{item.article?.version}</div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-slate-500">{item.reviewer?.name || "Unassigned"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        item.status === "completed" ? "bg-green-50 text-green-600" :
                        item.status === "in_progress" ? "bg-blue-50 text-blue-600" :
                        item.status === "declined" ? "bg-red-50 text-red-600" :
                        "bg-amber-50 text-amber-600"
                      }`}>
                        {item.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`text-xs ${item.deadline && new Date(item.deadline) < new Date() ? "text-red-500" : "text-slate-500"}`}>
                        {formatDate(item.deadline)}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-slate-500">{item._count?.comments}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/review/${item.id}`}
                        className="px-2 py-1 text-xs text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && data.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <span className="text-xs text-slate-400">Page {page} of {data.pages}</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1 text-xs border border-slate-200 rounded disabled:opacity-40 hover:bg-slate-50">Prev</button>
              <button onClick={() => setPage(Math.min(data.pages, page + 1))} disabled={page === data.pages} className="px-3 py-1 text-xs border border-slate-200 rounded disabled:opacity-40 hover:bg-slate-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

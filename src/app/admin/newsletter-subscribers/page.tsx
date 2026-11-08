"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  getNewsletterSubscribers,
  updateSubscriberStatus,
  deleteSubscriber,
} from "@/lib/actions/newsletter";
import type { PaginatedResult, NewsletterSubscriberAdmin } from "@/lib/actions/newsletter";

const STATUS_OPTIONS = ["all", "pending", "confirmed", "unsubscribed"] as const;

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-100">
      <td className="px-4 py-3">
        <div className="h-4 w-32 rounded bg-slate-100 animate-pulse" />
      </td>
      <td className="px-4 py-3 hidden sm:table-cell">
        <div className="h-3 w-24 rounded bg-slate-100 animate-pulse" />
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        <div className="h-3 w-20 rounded bg-slate-100 animate-pulse" />
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-2">
          <div className="h-6 w-12 rounded bg-slate-100 animate-pulse" />
          <div className="h-6 w-14 rounded bg-slate-100 animate-pulse" />
        </div>
      </td>
    </tr>
  );
}

export default function AdminNewsletterSubscribersPage() {
  const [data, setData] = useState<PaginatedResult<NewsletterSubscriberAdmin> | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await getNewsletterSubscribers(page, 25, {
      status: status === "all" ? undefined : status,
      search: search || undefined,
    });
    setData(result);
    setLoading(false);
  }, [page, status, search]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    await updateSubscriberStatus(id, newStatus);
    load();
  };

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Unsubscribe and delete ${email}?`)) return;
    await deleteSubscriber(id);
    load();
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "confirmed": return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "pending": return "bg-amber-50 text-amber-700 border border-amber-200";
      case "unsubscribed": return "bg-red-50 text-red-700 border border-red-200";
      default: return "bg-slate-50 text-slate-700 border border-slate-200";
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Newsletter Subscribers</h1>
          <Link href="/admin/newsletter-subscribers/new" className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg">
            + Add Subscriber
          </Link>
        </div>
        <table className="w-full text-sm">
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Newsletter Subscribers</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage newsletter subscriptions, confirmations, and suppressions.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/" target="_blank" rel="noopener noreferrer" className="px-4 py-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg">
            View Site
          </Link>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 pr-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 w-64"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value as any); setPage(1); }}
          className="px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider hidden sm:table-cell">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider hidden lg:table-cell">Subscribed</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!data || data.items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-16 text-center">
                    <p className="text-slate-400 text-sm font-medium">
                      {search || status !== "all"
                        ? "Try adjusting your filters or search query"
                        : "No subscribers found"}
                    </p>
                  </td>
                </tr>
              ) : (
                data.items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 truncate max-w-[200px]">{item.email}</div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-slate-600">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <select
                          value={item.status}
                          onChange={(e) => handleStatusChange(item.id, e.target.value)}
                          className="px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        >
                          {STATUS_OPTIONS.filter((s) => s !== "all").map((s) => (
                            <option key={s} value={s}>
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleDelete(item.id, item.email)}
                          className="ml-1 px-2 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded transition-colors"
                          title="Delete subscriber"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {data && data.pages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <p>Page {page} of {data.pages} ({data.total} subscribers)</p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
              disabled={page === data.pages}
              className="px-3 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

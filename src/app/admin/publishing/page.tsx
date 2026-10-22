"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import Link from "next/link";
import {
  Send,
  Eye,
  CheckCircle,
  Clock,
  Archive,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { updatePage } from "@/lib/actions/cms";

interface PagePublishingItem {
  id: string;
  slug: string;
  title: string;
  titleBn: string;
  status: string;
  dateModified: string;
  publishedAt?: string;
  sectionsCount?: number;
}

export default function PublishingAdminPage() {
  const [pages, setPages] = useState<PagePublishingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [toast, setToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadData = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/pages")
      .then((r) => r.json())
      .then((d) => {
        setPages(d.pages || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const setStatus = async (pageId: string, slug: string, status: string) => {
    setBusyId(pageId);
    try {
      await updatePage(pageId, { status });
      setToast(`Page "/${slug}" status changed to ${status.toUpperCase()}.`);
      startTransition(loadData);
      setTimeout(() => setToast(null), 3000);
    } catch {
      alert("Failed to update publication status.");
    } finally {
      setBusyId(null);
    }
  };

  const publishedCount = pages.filter((p) => p.status === "published").length;
  const draftCount = pages.filter((p) => p.status === "draft").length;
  const archivedCount = pages.filter((p) => p.status === "archived").length;

  const filtered = pages.filter((p) => (filter === "all" ? true : p.status === filter));

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Send className="w-6 h-6 text-teal-600" />
            <h1 className="text-2xl font-bold text-slate-900">Drafts & Publishing Control</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Publish updates without redeployment. Draft pages remain strictly isolated from public visitors.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-sm font-semibold text-slate-700 flex items-center gap-2 self-start"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Status
        </button>
      </div>

      {toast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs sm:text-sm">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{publishedCount}</div>
            <div className="text-xs font-medium text-slate-500">Live Public Pages</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{draftCount}</div>
            <div className="text-xs font-medium text-slate-500">Private Drafts</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
            <Archive className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{archivedCount}</div>
            <div className="text-xs font-medium text-slate-500">Archived Pages</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        {(["all", "published", "draft", "archived"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              filter === s
                ? "bg-teal-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            {s} ({s === "all" ? pages.length : s === "published" ? publishedCount : s === "draft" ? draftCount : archivedCount})
          </button>
        ))}
      </div>

      {/* Pages Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading publication registry...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No pages found in this category.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Page Route</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Last Modified</th>
                  <th className="px-5 py-3 text-right">Publication Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((page) => {
                  const isLive = page.status === "published";
                  const isBusy = busyId === page.id;

                  return (
                    <tr key={page.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">{page.title}</div>
                        <div className="text-xs text-slate-400 font-mono">
                          /{page.slug === "home" ? "" : page.slug}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            isLive
                              ? "bg-emerald-100 text-emerald-800"
                              : page.status === "draft"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {page.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">
                        {new Date(page.dateModified).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-2">
                        {isLive ? (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => setStatus(page.id, page.slug, "draft")}
                            className="px-3 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors disabled:opacity-50"
                          >
                            Unpublish (Draft)
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => setStatus(page.id, page.slug, "published")}
                            className="px-3 py-1 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-xs disabled:opacity-50"
                          >
                            Publish Now
                          </button>
                        )}

                        <Link
                          href={page.slug === "home" ? "/admin/pages/home" : `/admin/pages/${page.id}`}
                          className="px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors inline-block"
                        >
                          Edit
                        </Link>

                        <a
                          href={page.slug === "home" ? "/" : `/${page.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 text-xs text-slate-400 hover:text-slate-800 inline-block"
                          title="Open public page"
                        >
                          <ExternalLink className="w-3.5 h-3.5 inline" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


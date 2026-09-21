"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getResearchArticles, deleteResearchArticle, publishResearchArticle, unpublishResearchArticle } from "@/lib/actions/research";
import type { AdminResearchArticle, PaginatedResult } from "@/lib/admin-types";

const CATEGORIES = ["All", "Research Report", "Working Paper", "Policy Brief", "Data Analysis"];
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
      <td className="px-4 py-3 hidden lg:table-cell">
        <div className="h-3 w-20 rounded bg-white/5 animate-pulse" />
      </td>
      <td className="px-4 py-3">
        <div className="h-5 w-16 rounded-full bg-white/5 animate-pulse" />
      </td>
      <td className="px-4 py-3 hidden sm:table-cell">
        <div className="h-5 w-16 rounded-full bg-white/5 animate-pulse" />
      </td>
      <td className="px-4 py-3 hidden sm:table-cell">
        <div className="h-3 w-8 rounded bg-white/5 animate-pulse" />
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-2">
          <div className="h-6 w-12 rounded bg-white/5 animate-pulse" />
          <div className="h-6 w-16 rounded bg-white/5 animate-pulse" />
          <div className="h-6 w-14 rounded bg-white/5 animate-pulse" />
        </div>
      </td>
    </tr>
  );
}

export default function AdminResearchPage() {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResult<AdminResearchArticle> | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await getResearchArticles(page, 15, {
      status: status === "All" ? "all" : status,
      category: category === "All" ? "all" : category,
      search,
    });
    setData(result);
    setLoading(false);
  }, [page, status, category, search]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await deleteResearchArticle(id);
    load();
  };

  const handlePublish = async (id: string) => {
    await publishResearchArticle(id);
    load();
  };

  const handleUnpublish = async (id: string) => {
    await unpublishResearchArticle(id);
    load();
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Research Articles</h1>
          <p className="text-sm text-slate-400 mt-1">Manage research reports, working papers, and policy briefs.</p>
        </div>
        <Link
          href="/admin/research/new"
          className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm text-center"
        >
          + New Article
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search articles..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/50 w-60"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s === "All" ? "all" : s}>{s === "All" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c === "All" ? "all" : c}>{c === "All" ? "All Categories" : c}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="text-left px-4 py-3 font-semibold text-slate-400">Title</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-400 hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-400 hidden lg:table-cell">Author</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-400">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-400 hidden sm:table-cell">Review</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-400 hidden sm:table-cell">Downloads</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : !data || data.items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <svg className="w-12 h-12 mx-auto text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-slate-400 text-sm font-medium">No research articles found</p>
                    <p className="text-slate-600 text-xs mt-1">
                      {search || status !== "all" || category !== "all"
                        ? "Try adjusting your filters or search query"
                        : "Create your first article to get started"}
                    </p>
                    {!search && status === "all" && category === "all" && (
                      <Link href="/admin/research/new" className="inline-block mt-4 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold rounded-lg transition-colors">
                        + New Article
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
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-slate-400">{item.category}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-slate-400">{item.author}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        item.status === "published" ? "bg-emerald-500/20 text-emerald-400" :
                        item.status === "archived" ? "bg-slate-500/20 text-slate-400" :
                        "bg-amber-500/20 text-amber-400"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        item.reviewStatus === "approved" ? "bg-green-500/20 text-green-400" :
                        item.reviewStatus === "under_review" || item.reviewStatus === "pending" ? "bg-blue-500/20 text-blue-400" :
                        item.reviewStatus === "rejected" || item.reviewStatus === "revision_requested" ? "bg-red-500/20 text-red-400" :
                        "bg-slate-500/20 text-slate-400"
                      }`}>
                        {item.reviewStatus === "none" ? "—" : item.reviewStatus.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs text-slate-400">{item.downloads}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => router.push(`/admin/research/${item.id}`)}
                          className="px-2 py-1 text-xs text-slate-400 hover:text-teal-400 hover:bg-teal-500/10 rounded transition-colors"
                        >
                          Edit
                        </button>
                        {item.status === "draft" ? (
                          <button
                            onClick={() => handlePublish(item.id)}
                            className="px-2 py-1 text-xs text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors"
                          >
                            Publish
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUnpublish(item.id)}
                            className="px-2 py-1 text-xs text-amber-400 hover:bg-amber-500/10 rounded transition-colors"
                          >
                            Unpublish
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(item.id, item.title)}
                          className="px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 rounded transition-colors"
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

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
            <span className="text-xs text-slate-500">
              Showing {(data.page - 1) * data.limit + 1}–{Math.min(data.page * data.limit, data.total)} of {data.total}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-xs border border-white/10 text-slate-400 rounded disabled:opacity-40 hover:bg-white/5 transition-colors"
              >
                Prev
              </button>
              <button
                onClick={() => setPage(Math.min(data.pages, page + 1))}
                disabled={page === data.pages}
                className="px-3 py-1 text-xs border border-white/10 text-slate-400 rounded disabled:opacity-40 hover:bg-white/5 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

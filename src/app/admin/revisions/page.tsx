"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  History,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Clock,
  Layers,
  ArrowRight,
} from "lucide-react";
import { getPageRevisions, restorePageRevision, savePageRevision } from "@/lib/actions/cms";

interface PageOption {
  id: string;
  slug: string;
  title: string;
}

interface RevisionRow {
  id: string;
  label: string;
  createdAt: string;
  createdBy: string | null;
  createdByName: string | null;
  sectionsCount: number;
  status: string | null;
}

export default function RevisionsAdminPage() {
  const [pages, setPages] = useState<PageOption[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string>("");
  const [revisions, setRevisions] = useState<RevisionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [revisionsLoading, setRevisionsLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load pages list
  useEffect(() => {
    fetch("/api/admin/pages")
      .then((r) => r.json())
      .then((d) => {
        const pageList: PageOption[] = d.pages || [];
        setPages(pageList);
        if (pageList.length > 0) {
          // Default to home page if present, else first page
          const home = pageList.find((p) => p.slug === "home") || pageList[0];
          setSelectedPageId(home.id);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Load revisions when page selection changes
  const loadRevisions = async (pageId: string) => {
    if (!pageId) return;
    setRevisionsLoading(true);
    setError(null);
    try {
      const data = await getPageRevisions(pageId);
      setRevisions(
        data.map((r) => ({
          ...r,
          createdAt: new Date(r.createdAt).toISOString(),
          status: (r.status as string) || null,
        }))
      );
    } catch (err) {
      setError("Failed to load revisions for this page.");
    } finally {
      setRevisionsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPageId) {
      loadRevisions(selectedPageId);
    }
  }, [selectedPageId]);

  const handleCreateSnapshot = async () => {
    if (!selectedPageId) return;
    try {
      await savePageRevision(selectedPageId, "Manual Snapshot");
      setToast("New revision snapshot created.");
      await loadRevisions(selectedPageId);
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Snapshot failed.");
    }
  };

  const handleRestore = async (revisionId: string, label: string) => {
    if (!confirm(`Restore this revision (${label || "snapshot"})? The current state will be saved as an auto-snapshot first.`)) {
      return;
    }

    setRestoringId(revisionId);
    setError(null);
    try {
      await restorePageRevision(revisionId);
      setToast("Revision successfully restored!");
      await loadRevisions(selectedPageId);
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Restore failed.");
    } finally {
      setRestoringId(null);
    }
  };

  const selectedPage = pages.find((p) => p.id === selectedPageId);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-6 h-6 text-teal-600" />
            <h1 className="text-2xl font-bold text-slate-900">Revision History & Rollback</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Browse historical snapshots of any page and roll back with one click.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreateSnapshot}
          disabled={!selectedPageId || revisionsLoading}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold shadow-xs flex items-center gap-2 self-start disabled:opacity-50"
        >
          <Clock className="w-4 h-4" />
          Create Manual Snapshot
        </button>
      </div>

      {toast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs sm:text-sm">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-xs sm:text-sm">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Page Selector Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
            Select Page:
          </span>
          <select
            value={selectedPageId}
            onChange={(e) => setSelectedPageId(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            {pages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} (/{p.slug})
              </option>
            ))}
          </select>
        </div>

        {selectedPage && (
          <Link
            href={selectedPage.slug === "home" ? "/admin/pages/home" : `/admin/pages/${selectedPage.id}`}
            className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 self-start sm:self-auto"
          >
            Open in Editor <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Revision Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {revisionsLoading ? (
          <div className="p-12 text-center text-slate-400">Loading revision history...</div>
        ) : revisions.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p>No revisions found for this page yet.</p>
            <p className="text-xs text-slate-400 mt-1">
              Revisions are created automatically when published, or you can create one manually above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Label / Event</th>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Author</th>
                  <th className="px-5 py-3">Sections</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {revisions.map((rev) => (
                  <tr key={rev.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900">{rev.label || "Snapshot"}</div>
                      {rev.status && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full mt-1 inline-block">
                          {rev.status}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {new Date(rev.createdAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-700 font-medium">
                      {rev.createdByName || "System / Admin"}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1 font-medium text-slate-800">
                        <Layers className="w-3.5 h-3.5 text-teal-600" />
                        {rev.sectionsCount}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        disabled={restoringId === rev.id}
                        onClick={() => handleRestore(rev.id, rev.label)}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ml-auto disabled:opacity-50"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        {restoringId === rev.id ? "Restoring..." : "Restore"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

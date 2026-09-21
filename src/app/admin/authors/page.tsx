"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getAuthorProfiles, deleteAuthorProfile } from "@/lib/actions/authors";
import type { AdminAuthorProfile, PaginatedResult } from "@/lib/admin-types";

function SkeletonRow() {
  return (
    <tr className="border-b border-white/5">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />
          <div>
            <div className="h-4 w-28 rounded bg-white/5 animate-pulse" />
            <div className="h-3 w-24 rounded bg-white/5 animate-pulse mt-1.5" />
          </div>
        </div>
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        <div className="h-3 w-32 rounded bg-white/5 animate-pulse" />
      </td>
      <td className="px-4 py-3 hidden sm:table-cell">
        <div className="h-3 w-8 rounded bg-white/5 animate-pulse" />
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        <div className="h-3 w-28 rounded bg-white/5 animate-pulse" />
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

export default function AdminAuthorsPage() {
  const [data, setData] = useState<PaginatedResult<AdminAuthorProfile> | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await getAuthorProfiles(1, 50, { search });
    setData(result);
    setLoading(false);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Author Profiles</h1>
          <p className="text-sm text-slate-400 mt-1">Manage researcher and author profiles.</p>
        </div>
        <Link href="/admin/authors/new" className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm text-center">
          + New Author
        </Link>
      </div>

      <div className="mb-6">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Search authors..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/50 w-60" />
        </div>
      </div>

      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="text-left px-4 py-3 font-semibold text-slate-400">Author</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-400 hidden md:table-cell">Affiliation</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-400 hidden sm:table-cell">Articles</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-400 hidden lg:table-cell">ORCID</th>
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <p className="text-slate-400 text-sm font-medium">No authors found</p>
                    <p className="text-slate-600 text-xs mt-1">
                      {search
                        ? "Try adjusting your search query"
                        : "Create your first author profile to get started"}
                    </p>
                    {!search && (
                      <Link href="/admin/authors/new" className="inline-block mt-4 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold rounded-lg transition-colors">
                        + New Author
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                data.items.map((author) => (
                  <tr key={author.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {author.image ? (
                          <img src={author.image} alt={author.name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 text-xs font-bold">{author.name.charAt(0)}</div>
                        )}
                        <div>
                          <div className="font-medium text-white">{author.name}</div>
                          {author.email && <div className="text-xs text-slate-500">{author.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell"><span className="text-xs text-slate-400">{author.affiliation || "—"}</span></td>
                    <td className="px-4 py-3 hidden sm:table-cell"><span className="text-xs text-slate-400">{author.articleCount}</span></td>
                    <td className="px-4 py-3 hidden lg:table-cell"><span className="text-xs text-slate-400 font-mono">{author.orcid || "—"}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/authors/${author.id}`} className="px-2 py-1 text-xs text-slate-400 hover:text-teal-400 hover:bg-teal-500/10 rounded transition-colors">Edit</Link>
                        <button onClick={async () => { if (confirm(`Delete ${author.name}?`)) { await deleteAuthorProfile(author.id); load(); } }} className="px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 rounded transition-colors">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

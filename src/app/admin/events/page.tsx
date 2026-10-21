"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getEvents, deleteEvent } from "@/lib/actions/events";
import type { AdminEvent, PaginatedResult } from "@/lib/admin-types";

const CATEGORIES = ["All", "Summit", "Workshop", "Conference", "Launch", "Webinar"];
const STATUSES = ["All", "draft", "published", "cancelled"];

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-100">
      <td className="px-4 py-3">
        <div className="h-4 w-36 rounded bg-slate-100 animate-pulse" />
        <div className="h-3 w-20 rounded bg-slate-100 animate-pulse mt-2" />
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        <div className="h-3 w-24 rounded bg-slate-100 animate-pulse" />
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        <div className="h-3 w-28 rounded bg-slate-100 animate-pulse" />
      </td>
      <td className="px-4 py-3">
        <div className="h-5 w-16 rounded-full bg-slate-100 animate-pulse" />
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

export default function AdminEventsPage() {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResult<AdminEvent> | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await getEvents(page, 15, {
      status: status === "All" ? "all" : status,
      category: category === "All" ? "all" : category,
      search,
    });
    setData(result);
    setLoading(false);
  }, [page, status, category, search]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Events</h1>
          <p className="text-sm text-slate-500 mt-1">Manage summits, workshops, and conferences.</p>
        </div>
        <Link href="/admin/events/new" className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white shadow-xs text-sm font-semibold rounded-lg transition-colors shadow-sm text-center">
          + New Event
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Search events..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-10 pr-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 w-60" />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600">
          {STATUSES.map((s) => <option key={s} value={s === "All" ? "all" : s}>{s === "All" ? "All Statuses" : s}</option>)}
        </select>
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600">
          {CATEGORIES.map((c) => <option key={c} value={c === "All" ? "all" : c}>{c === "All" ? "All Categories" : c}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">Event</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider hidden md:table-cell">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider hidden lg:table-cell">Location</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : !data || data.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <svg className="w-12 h-12 mx-auto text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-slate-400 text-sm font-medium">No events found</p>
                    <p className="text-slate-600 text-xs mt-1">
                      {search || status !== "all" || category !== "all"
                        ? "Try adjusting your filters or search query"
                        : "Create your first event to get started"}
                    </p>
                    {!search && status === "all" && category === "all" && (
                      <Link href="/admin/events/new" className="inline-block mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold rounded-lg transition-colors">
                        + New Event
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                data.items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 truncate max-w-[200px]">{item.name}</div>
                      <div className="text-xs text-slate-500">{item.category}</div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell"><span className="text-xs text-slate-600">{new Date(item.startDate).toLocaleDateString()}</span></td>
                    <td className="px-4 py-3 hidden lg:table-cell"><span className="text-xs text-slate-600 truncate block max-w-[120px]">{item.location}</span></td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${item.status === "published" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : item.status === "cancelled" ? "bg-red-50 text-red-700 border border-red-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => router.push(`/admin/events/${item.id}`)} className="px-2 py-1 text-xs text-slate-600 hover:text-amber-400 hover:bg-amber-500/10 rounded transition-colors">Edit</button>
                        <button onClick={async () => { if (confirm("Delete?")) { await deleteEvent(item.id); load(); } }} className="px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded transition-colors">Delete</button>
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

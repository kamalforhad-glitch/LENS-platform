"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getTeamMembers, deleteTeamMember } from "@/lib/actions/team";
import type { AdminTeamMember, PaginatedResult } from "@/lib/admin-types";

function SkeletonCard() {
  return (
    <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-white/5 animate-pulse shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="h-4 w-28 rounded bg-white/5 animate-pulse" />
          <div className="h-3 w-20 rounded bg-white/5 animate-pulse mt-2" />
          <div className="h-3 w-24 rounded bg-white/5 animate-pulse mt-1.5" />
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <div className="h-6 w-12 rounded bg-white/5 animate-pulse" />
        <div className="h-6 w-14 rounded bg-white/5 animate-pulse" />
      </div>
    </div>
  );
}

export default function AdminTeamPage() {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResult<AdminTeamMember> | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await getTeamMembers(1, 50, { search });
    setData(result);
    setLoading(false);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Team Members</h1>
          <p className="text-sm text-slate-400 mt-1">Manage your organization&apos;s team.</p>
        </div>
        <Link href="/admin/team/new" className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm text-center">
          + Add Member
        </Link>
      </div>

      <div className="mb-6">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Search team..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 w-60" />
        </div>
      </div>

      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : !data || data.items.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-12 h-12 mx-auto text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-slate-400 text-sm font-medium">No team members found</p>
              <p className="text-slate-600 text-xs mt-1">
                {search
                  ? "Try adjusting your search query"
                  : "Add your first team member to get started"}
              </p>
              {!search && (
                <Link href="/admin/team/new" className="inline-block mt-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold rounded-lg transition-colors">
                  + Add Member
                </Link>
              )}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {data.items.map((member) => (
                <div key={member.id} className="p-4 rounded-xl border border-white/10 hover:border-white/20 bg-white/[0.02] transition-colors group">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                      {member.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white text-sm">{member.name}</h3>
                      <p className="text-xs text-teal-400">{member.role}</p>
                      <p className="text-xs text-slate-500">{member.department}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => router.push(`/admin/team/${member.id}`)} className="px-2 py-1 text-xs text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors">Edit</button>
                    <button onClick={async () => { if (confirm("Delete?")) { await deleteTeamMember(member.id); load(); } }} className="px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 rounded transition-colors">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

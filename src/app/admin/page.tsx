"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDashboardStats, getRecentActivity } from "@/lib/actions/dashboard";
import SkeletonCards from "@/components/admin/SkeletonCards";

interface Stats {
  totalResearch: number;
  publishedResearch: number;
  draftResearch: number;
  totalPublications: number;
  totalEvents: number;
  upcomingEvents: number;
  totalTeam: number;
  totalMedia: number;
  totalDownloads: number;
}

interface Activity {
  research: { id: string; title: string; status: string; dateCreated: Date; dateModified: Date }[];
  publications: { id: string; title: string; status: string; dateCreated: Date; dateModified: Date }[];
  events: { id: string; name: string; status: string; dateCreated: Date; dateModified: Date }[];
}

function StatCard({ label, value, sub, href, icon, trend, color }: {
  label: string; value: number; sub: string; href: string; icon: React.ReactNode; trend?: string; color: string;
}) {
  const colorMap: Record<string, { bg: string; icon: string; ring: string }> = {
    teal: { bg: "bg-teal-50", icon: "text-teal-600", ring: "ring-teal-500/10" },
    blue: { bg: "bg-blue-50", icon: "text-blue-600", ring: "ring-blue-500/10" },
    amber: { bg: "bg-amber-50", icon: "text-amber-600", ring: "ring-amber-500/10" },
    emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", ring: "ring-emerald-500/10" },
    purple: { bg: "bg-purple-50", icon: "text-purple-600", ring: "ring-purple-500/10" },
    gold: { bg: "bg-amber-50", icon: "text-amber-600", ring: "ring-amber-500/10" },
  };
  const c = colorMap[color] || colorMap.teal;

  return (
    <Link href={href} className="group p-5 rounded-xl bg-white border border-slate-200 hover:shadow-lg hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-bold text-slate-900 mt-1.5">{value.toLocaleString()}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <p className="text-xs text-slate-500">{sub}</p>
            {trend && (
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">{trend}</span>
            )}
          </div>
        </div>
        <div className={`w-11 h-11 rounded-xl ${c.bg} ring-1 ${c.ring} flex items-center justify-center ${c.icon} group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
      </div>
    </Link>
  );
}

function ActivityItem({ title, status, date, href }: { title: string; status: string; date: Date; href: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-slate-50 transition-colors group">
      <div className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-teal-400 transition-colors shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-700 truncate group-hover:text-slate-900">{title}</p>
        <p className="text-[11px] text-slate-400">{new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
      </div>
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
        status === "published" ? "bg-emerald-50 text-emerald-600" :
        status === "draft" ? "bg-amber-50 text-amber-600" :
        "bg-slate-100 text-slate-500"
      }`}>
        {status}
      </span>
    </Link>
  );
}

function ContentBreakdown({ stats }: { stats: Stats }) {
  const total = stats.totalResearch + stats.totalPublications + stats.totalEvents + stats.totalTeam;
  const items = [
    { label: "Research", count: stats.totalResearch, color: "bg-teal-500" },
    { label: "Publications", count: stats.totalPublications, color: "bg-blue-500" },
    { label: "Events", count: stats.totalEvents, color: "bg-amber-500" },
    { label: "Team", count: stats.totalTeam, color: "bg-emerald-500" },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-sm font-bold text-slate-900 mb-4">Content Breakdown</h3>
      <div className="flex h-3 rounded-full overflow-hidden bg-slate-100 mb-4">
        {items.map((item) => (
          <div
            key={item.label}
            className={`${item.color} transition-all duration-500`}
            style={{ width: total > 0 ? `${(item.count / total) * 100}%` : "25%" }}
            title={`${item.label}: ${item.count}`}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
            <span className="text-xs text-slate-600">{item.label}</span>
            <span className="text-xs font-bold text-slate-900 ml-auto">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickLinks() {
  const links = [
    { label: "Research", href: "/admin/research", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
    { label: "Publications", href: "/admin/publications", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253" },
    { label: "Programs", href: "/admin/programs", icon: "M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814" },
    { label: "Blog", href: "/admin/blog", icon: "M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5" },
    { label: "Events", href: "/admin/events", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { label: "Careers", href: "/admin/careers", icon: "M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25" },
    { label: "Media", href: "/admin/media-items", icon: "M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9" },
    { label: "Resources", href: "/admin/resources", icon: "M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4" },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-sm font-bold text-slate-900 mb-4">Quick Create</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-slate-50 transition-colors group">
            <div className="w-9 h-9 rounded-lg bg-slate-100 group-hover:bg-teal-50 flex items-center justify-center text-slate-400 group-hover:text-teal-600 transition-colors">
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
              </svg>
            </div>
            <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900">{link.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null);

  useEffect(() => {
    getDashboardStats().then(setStats);
    getRecentActivity().then(setActivity);
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Welcome back. Here&apos;s what&apos;s happening with your content.</p>
      </div>

      {/* Stats Grid */}
      {stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <StatCard label="Research" value={stats.totalResearch} sub={`${stats.publishedResearch} published`} href="/admin/research" color="teal"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>}
            trend={stats.draftResearch > 0 ? `${stats.draftResearch} drafts` : undefined} />
          <StatCard label="Publications" value={stats.totalPublications} sub="Total publications" href="/admin/publications" color="blue"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>} />
          <StatCard label="Events" value={stats.totalEvents} sub={`${stats.upcomingEvents} upcoming`} href="/admin/events" color="amber"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>}
            trend={stats.upcomingEvents > 0 ? `${stats.upcomingEvents} soon` : undefined} />
          <StatCard label="Team" value={stats.totalTeam} sub="Active members" href="/admin/team" color="emerald"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>} />
          <StatCard label="Media Files" value={stats.totalMedia} sub="Uploaded files" href="/admin/media" color="purple"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>} />
          <StatCard label="Downloads" value={stats.totalDownloads} sub="All content" href="/admin/analytics" color="gold"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>} />
        </div>
      ) : (
        <SkeletonCards />
      )}

      {/* Quick Links */}
      <div className="mb-8">
        <QuickLinks />
      </div>

      {/* Activity + Breakdown */}
      {activity && stats ? (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900">Recent Activity</h3>
                <span className="text-xs text-slate-400">Last 7 days</span>
              </div>
              <div className="space-y-1">
                {activity.research.length === 0 && activity.publications.length === 0 && activity.events.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-10 h-10 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                    <p className="text-sm text-slate-400">No recent activity</p>
                    <p className="text-xs text-slate-300 mt-1">Create your first content to see activity here</p>
                  </div>
                ) : (
                  <>
                    {activity.research.slice(0, 3).map((r) => (
                      <ActivityItem key={r.id} title={r.title} status={r.status} date={r.dateModified} href={`/admin/research/${r.id}`} />
                    ))}
                    {activity.publications.slice(0, 3).map((p) => (
                      <ActivityItem key={p.id} title={p.title} status={p.status} date={p.dateModified} href={`/admin/publications/${p.id}`} />
                    ))}
                    {activity.events.slice(0, 3).map((e) => (
                      <ActivityItem key={e.id} title={e.name} status={e.status} date={e.dateModified} href={`/admin/events/${e.id}`} />
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <ContentBreakdown stats={stats} />
          </div>
        </div>
      ) : activity && !stats ? (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-32 mb-4" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5">
                  <div className="w-2 h-2 bg-slate-100 rounded-full" />
                  <div className="h-3 bg-slate-100 rounded flex-1" />
                  <div className="h-3 bg-slate-100 rounded w-16" />
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-32 mb-4" />
              <div className="h-3 bg-slate-100 rounded-full mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-slate-100 rounded-full" />
                    <div className="h-3 bg-slate-100 rounded flex-1" />
                    <div className="h-3 bg-slate-100 rounded w-6" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

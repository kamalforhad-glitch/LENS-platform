"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  getAnalyticsOverview,
  getMonthlyActivity,
  getCategoryTrends,
  getAuthorImpact,
  getTopArticles,
  getSearchTrends,
} from "@/lib/actions/analytics";

type Overview = Awaited<ReturnType<typeof getAnalyticsOverview>>;
type Monthly = Awaited<ReturnType<typeof getMonthlyActivity>>;
type Categories = Awaited<ReturnType<typeof getCategoryTrends>>;
type Authors = Awaited<ReturnType<typeof getAuthorImpact>>;
type TopArticles = Awaited<ReturnType<typeof getTopArticles>>;
type Searches = Awaited<ReturnType<typeof getSearchTrends>>;

const COLORS = ["#0d9488", "#2563eb", "#d97706", "#dc2626", "#7c3aed", "#059669", "#ea580c", "#4f46e5"];

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [monthly, setMonthly] = useState<Monthly>([]);
  const [categories, setCategories] = useState<Categories>([]);
  const [authors, setAuthors] = useState<Authors>([]);
  const [topArticles, setTopArticles] = useState<TopArticles>([]);
  const [searches, setSearches] = useState<Searches>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getAnalyticsOverview(),
      getMonthlyActivity(12),
      getCategoryTrends(),
      getAuthorImpact(10),
      getTopArticles(10),
      getSearchTrends(10),
    ]).then(([ov, mo, ca, au, ta, se]) => {
      setOverview(ov);
      setMonthly(mo);
      setCategories(ca);
      setAuthors(au);
      setTopArticles(ta);
      setSearches(se);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading analytics...</div>;
  }

  const pieData = categories.map((c) => ({ name: c.category, value: c.count }));
  const barData = authors.map((a) => ({ name: a.name.split(" ").pop() || a.name, articles: a.articleCount, downloads: a.totalDownloads }));
  const lineData = monthly.map((m) => ({ month: m.month.slice(5), articles: m.articles, downloads: m.downloads, views: m.views }));
  const searchBarData = searches.map((s) => ({ query: s.query.length > 20 ? s.query.slice(0, 20) + "..." : s.query, searches: s.count }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Research Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Performance metrics and trends across all research content</p>
      </div>

      {/* Overview Cards */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Articles" value={overview.totalArticles} sub={`${overview.publishedArticles} published`} />
          <StatCard label="Total Downloads" value={overview.totalDownloads.toLocaleString()} sub={`${overview.avgDownloadsPerArticle} avg/article`} />
          <StatCard label="Total Citations" value={overview.totalCitations} sub={`${overview.avgCitationsPerArticle} avg/article`} />
          <StatCard label="Authors" value={overview.totalAuthors} sub={`${overview.totalSearches.toLocaleString()} searches`} />
        </div>
      )}

      {/* Monthly Activity Line Chart */}
      {lineData.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Monthly Activity (12 months)</h2>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="articles" stroke="#0d9488" strokeWidth={2} name="Articles" />
              <Line type="monotone" dataKey="downloads" stroke="#2563eb" strokeWidth={2} name="Downloads" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Category Pie Chart */}
        {pieData.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Articles by Category</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Author Impact Bar Chart */}
        {barData.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Author Impact (Top 10)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip />
                <Legend />
                <Bar dataKey="articles" fill="#0d9488" name="Articles" />
                <Bar dataKey="downloads" fill="#2563eb" name="Downloads" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Search Trends */}
      {searchBarData.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Top Search Queries</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={searchBarData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis dataKey="query" type="category" width={160} tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="searches" fill="#7c3aed" name="Searches" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top Articles Table */}
      {topArticles.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">Top Articles by Downloads</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Article</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Downloads</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Citations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {topArticles.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-3">
                      <a href={`/library/${a.slug}`} className="text-slate-900 font-medium hover:text-teal-600 line-clamp-1">{a.title}</a>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{a.category}</td>
                    <td className="px-4 py-3 text-right text-slate-700 font-medium">{a.downloads.toLocaleString()}</td>
                    <td className="px-6 py-3 text-right text-slate-700">{a.citationCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Category Trends Table */}
      {categories.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">Category Trends</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Articles</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Downloads</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {categories.map((c) => (
                  <tr key={c.category} className="hover:bg-slate-50/50">
                    <td className="px-6 py-3 text-slate-900 font-medium">{c.category}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{c.count}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{c.downloads.toLocaleString()}</td>
                    <td className="px-6 py-3 text-right">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                        c.trend === "up" ? "bg-green-50 text-green-600" :
                        c.trend === "down" ? "bg-red-50 text-red-600" :
                        "bg-slate-50 text-slate-500"
                      }`}>
                        {c.trend === "up" ? "↑" : c.trend === "down" ? "↓" : "→"} {c.trend}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

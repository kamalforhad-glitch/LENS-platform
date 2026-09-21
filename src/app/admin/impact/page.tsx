"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { getAnalyticsOverview, getMonthlyActivity, getCategoryTrends, getAuthorImpact, getTopArticles, getSearchTrends } from "@/lib/actions/analytics";

const COLORS = ["#0d9488", "#2563eb", "#d97706", "#dc2626", "#7c3aed", "#059669"];

type Overview = Awaited<ReturnType<typeof getAnalyticsOverview>>;
type Monthly = Awaited<ReturnType<typeof getMonthlyActivity>>;
type Categories = Awaited<ReturnType<typeof getCategoryTrends>>;
type Authors = Awaited<ReturnType<typeof getAuthorImpact>>;
type TopArticles = Awaited<ReturnType<typeof getTopArticles>>;
type Searches = Awaited<ReturnType<typeof getSearchTrends>>;

export default function AdminImpactPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [monthly, setMonthly] = useState<Monthly>([]);
  const [categories, setCategories] = useState<Categories>([]);
  const [authors, setAuthors] = useState<Authors>([]);
  const [topArticles, setTopArticles] = useState<TopArticles>([]);
  const [searches, setSearches] = useState<Searches>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

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

  const handleExport = async (format: "csv" | "json") => {
    const data = {
      overview,
      monthly,
      categories,
      topArticles,
      exportedAt: new Date().toISOString(),
      dateRange: { from: dateFrom, to: dateTo },
    };

    if (format === "json") {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lens-impact-report-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      let csv = "Metric,Value\n";
      if (overview) {
        csv += `Total Articles,${overview.totalArticles}\n`;
        csv += `Total Downloads,${overview.totalDownloads}\n`;
        csv += `Total Citations,${overview.totalCitations}\n`;
        csv += `Total Authors,${overview.totalAuthors}\n`;
        csv += `Total Searches,${overview.totalSearches}\n`;
      }
      csv += "\nCategory,Articles,Downloads\n";
      categories.forEach((c) => { csv += `${c.category},${c.count},${c.downloads}\n`; });
      csv += "\nArticle,Downloads,Category\n";
      topArticles.forEach((a) => { csv += `"${a.title}",${a.downloads},${a.category}\n`; });

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lens-impact-report-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Loading impact data...</div>;

  const pieData = categories.map((c) => ({ name: c.category, value: c.count }));
  const barData = authors.map((a) => ({ name: a.name.split(" ").pop() || a.name, articles: a.articleCount, downloads: a.totalDownloads }));
  const lineData = monthly.map((m) => ({ month: m.month.slice(5), articles: m.articles, downloads: m.downloads }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Institutional Impact</h1>
          <p className="text-sm text-slate-500 mt-1">Research impact, knowledge reach, and community engagement metrics</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleExport("csv")} className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">Export CSV</button>
          <button onClick={() => handleExport("json")} className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">Export JSON</button>
        </div>
      </div>

      {/* Date Filter */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
        <label className="text-sm text-slate-600">Date Range:</label>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm" />
        <span className="text-slate-400">to</span>
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm" />
      </div>

      {/* Overview */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Publications", value: overview.totalArticles },
            { label: "Downloads", value: overview.totalDownloads.toLocaleString() },
            { label: "Citations", value: overview.totalCitations },
            { label: "Researchers", value: overview.totalAuthors },
            { label: "Searches", value: overview.totalSearches.toLocaleString() },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5 text-center">
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {lineData.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Monthly Activity</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="articles" stroke="#0d9488" strokeWidth={2} name="Articles" />
                <Line type="monotone" dataKey="downloads" stroke="#2563eb" strokeWidth={2} name="Downloads" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {pieData.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Research Topics</h2>
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
      </div>

      {/* Top Articles Table */}
      {topArticles.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">Top Articles by Downloads</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Article</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Category</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase">Downloads</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {topArticles.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-3 text-slate-900 font-medium line-clamp-1">{a.title}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{a.category}</td>
                  <td className="px-6 py-3 text-right text-slate-700">{a.downloads.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

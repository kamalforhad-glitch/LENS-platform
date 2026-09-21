"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const COLORS = ["#0d9488", "#2563eb", "#d97706", "#dc2626", "#7c3aed", "#059669"];

interface ImpactData {
  overview: {
    totalArticles: number;
    totalDownloads: number;
    totalCitations: number;
    totalAuthors: number;
    totalSearches: number;
  };
  monthly: { month: string; articles: number; downloads: number }[];
  categories: { category: string; count: number; downloads: number }[];
  topArticles: { title: string; downloads: number; category: string }[];
}

export default function ImpactPage() {
  const [data, setData] = useState<ImpactData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/analytics/overview").then((r) => r.json()),
      fetch("/api/analytics/monthly").then((r) => r.json()),
      fetch("/api/analytics/categories").then((r) => r.json()),
      fetch("/api/analytics/top-articles").then((r) => r.json()),
    ]).then(([overview, monthly, categories, topArticles]) => {
      setData({
        overview: overview || { totalArticles: 0, totalDownloads: 0, totalCitations: 0, totalAuthors: 0, totalSearches: 0 },
        monthly: monthly?.data || [],
        categories: categories?.data || [],
        topArticles: topArticles?.data || [],
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <div className="text-white">Loading impact data...</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy-950 via-[#061224] to-navy-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(8,145,178,0.06)_0%,transparent_50%)]" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24 relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3">Institutional Impact</h1>
          <p className="text-slate-400 max-w-xl mx-auto">Measuring our contribution to media research and democratic discourse</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
          {[
            { label: "Publications", value: data.overview.totalArticles },
            { label: "Downloads", value: data.overview.totalDownloads.toLocaleString() },
            { label: "Citations", value: data.overview.totalCitations },
            { label: "Researchers", value: data.overview.totalAuthors },
            { label: "Searches", value: data.overview.totalSearches.toLocaleString() },
          ].map((s) => (
            <div key={s.label} className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
              <p className="text-2xl font-bold text-teal-400">{s.value}</p>
              <p className="text-xs text-slate-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Research Impact Section */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-white mb-6">Research Impact</h2>
          <div className="grid lg:grid-cols-2 gap-6">
            {data.monthly.length > 0 && (
              <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <h3 className="text-sm font-semibold text-slate-300 mb-4">Monthly Activity</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.monthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} stroke="rgba(255,255,255,0.1)" />
                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} stroke="rgba(255,255,255,0.1)" />
                    <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff" }} />
                    <Legend wrapperStyle={{ color: "#94a3b8" }} />
                    <Line type="monotone" dataKey="articles" stroke="#0d9488" strokeWidth={2} name="Articles" />
                    <Line type="monotone" dataKey="downloads" stroke="#2563eb" strokeWidth={2} name="Downloads" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {data.categories.length > 0 && (
              <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <h3 className="text-sm font-semibold text-slate-300 mb-4">Research Topics</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.categories.map((c) => ({ name: c.category, value: c.count }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {data.categories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Knowledge Reach Section */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-white mb-6">Knowledge Reach</h2>
          {data.topArticles.length > 0 && (
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Most Downloaded Research</h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={data.topArticles.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey={(d: any) => d.title.length > 30 ? d.title.slice(0, 30) + "..." : d.title} tick={{ fontSize: 10, fill: "#94a3b8" }} stroke="rgba(255,255,255,0.1)" />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} stroke="rgba(255,255,255,0.1)" />
                  <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff" }} />
                  <Bar dataKey="downloads" fill="#0d9488" name="Downloads" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Community Engagement */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-white mb-6">Community Engagement</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: "📊", label: "Active Researchers", value: data.overview.totalAuthors },
              { icon: "📥", label: "Total Downloads", value: data.overview.totalDownloads.toLocaleString() },
              { icon: "📚", label: "Published Works", value: data.overview.totalArticles },
              { icon: "🔍", label: "Knowledge Searches", value: data.overview.totalSearches.toLocaleString() },
            ].map((item) => (
              <div key={item.label} className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
                <div className="text-2xl mb-2">{item.icon}</div>
                <p className="text-lg font-bold text-white">{item.value}</p>
                <p className="text-xs text-slate-400 mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Partnership Network */}
        <div>
          <h2 className="text-xl font-bold text-white mb-6">Partnership Network</h2>
          <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
            <p className="text-slate-400 mb-4">LENS Bangladesh collaborates with academic institutions, media organizations, and civil society groups across Bangladesh and the region.</p>
            <div className="flex flex-wrap justify-center gap-3">
              {["Academic Institutions", "Media Organizations", "Civil Society", "International Partners", "Research Networks"].map((p) => (
                <span key={p} className="px-4 py-2 text-sm text-teal-400 bg-teal-500/10 rounded-full border border-teal-400/20">{p}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

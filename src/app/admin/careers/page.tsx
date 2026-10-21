"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Career { id: string; slug: string; title: string; titleBn: string; department: string; location: string; type: string; status: string; }

export default function CareersAdmin() {
  const [items, setItems] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => { fetch("/api/admin/careers").then(r => r.json()).then(d => { setItems(d.careers || []); setLoading(false); }); }, []);

  const filtered = items.filter(i => {
    const matchSearch = !search || i.title.toLowerCase().includes(search.toLowerCase()) || i.department.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || i.status === filter;
    return matchSearch && matchFilter;
  });

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this career listing?")) return;
    await fetch("/api/admin/careers", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const counts = { all: items.length, open: items.filter(i => i.status === "open").length, draft: items.filter(i => i.status === "draft").length, closed: items.filter(i => i.status === "closed").length };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-slate-900">Careers</h1><p className="text-slate-500 text-sm mt-1">Job openings and positions.</p></div>
        <Link href="/admin/careers/new" className="px-4 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 shadow-xs transition-colors">+ New Opening</Link>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input type="text" placeholder="Search positions..." value={search} onChange={e => setSearch(e.target.value)} className="px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 w-64" />
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1 border border-slate-200">
          {(["all", "open", "draft", "closed"] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filter === s ? "bg-white text-slate-900 shadow-xs font-semibold" : "text-slate-600 hover:text-slate-900"}`}>{s.charAt(0).toUpperCase() + s.slice(1)} <span className="ml-1 opacity-60">{counts[s]}</span></button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="p-4 rounded-xl bg-white border border-slate-200 animate-pulse"><div className="flex items-center gap-4"><div className="flex-1"><div className="h-4 bg-slate-100 rounded w-48 mb-2" /><div className="h-3 bg-slate-100 rounded w-64" /></div></div></div>)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4"><svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25" /></svg></div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">No career openings found</h3>
          <p className="text-slate-500 text-sm text-center max-w-sm">{search || filter !== "all" ? "Try adjusting your search or filters." : "Get started by posting your first job opening."}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => (
            <div key={item.id} className="flex items-center gap-3 p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all">
              <div className="flex-1 min-w-0">
                <h3 className="text-slate-900 font-medium truncate">{item.title}</h3>
                <p className="text-slate-500 text-sm mt-0.5">{item.department} · {item.location}</p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400">{item.type.replace("_", " ")}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${item.status === "open" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : item.status === "draft" ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-slate-100 text-slate-600 border border-slate-200"}`}>{item.status}</span>
              <div className="flex items-center gap-1">
                <Link href={`/admin/careers/${item.id}`} className="px-2.5 py-1 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded transition-colors">Edit</Link>
                <button onClick={() => deleteItem(item.id)} className="px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded transition-colors">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

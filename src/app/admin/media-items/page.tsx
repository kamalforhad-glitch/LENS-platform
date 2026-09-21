"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface MediaItem { id: string; slug: string; title: string; titleBn: string; type: string; source: string; status: string; }

export default function MediaItemsAdmin() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => { fetch("/api/admin/media-items").then(r => r.json()).then(d => { setItems(d.items || []); setLoading(false); }); }, []);

  const filtered = items.filter(i => {
    const matchSearch = !search || i.title.toLowerCase().includes(search.toLowerCase()) || i.source.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || i.status === filter;
    return matchSearch && matchFilter;
  });

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this media item?")) return;
    await fetch("/api/admin/media-items", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const counts = { all: items.length, published: items.filter(i => i.status === "published").length, draft: items.filter(i => i.status === "draft").length };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-white">Media & Press</h1><p className="text-slate-400 text-sm mt-1">Press releases, interviews and media coverage.</p></div>
        <Link href="/admin/media-items/new" className="px-4 py-2.5 bg-teal-500 text-white rounded-lg text-sm font-semibold hover:bg-teal-400 transition-colors">+ New Item</Link>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input type="text" placeholder="Search media..." value={search} onChange={e => setSearch(e.target.value)} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 w-64" />
        <div className="flex gap-1 bg-white/5 rounded-lg p-1">
          {(["all", "published", "draft"] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filter === s ? "bg-teal-500 text-white" : "text-slate-400 hover:text-white"}`}>{s.charAt(0).toUpperCase() + s.slice(1)} <span className="ml-1 opacity-60">{counts[s]}</span></button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 animate-pulse"><div className="flex items-center gap-4"><div className="flex-1"><div className="h-4 bg-white/10 rounded w-48 mb-2" /><div className="h-3 bg-white/5 rounded w-64" /></div><div className="h-5 bg-white/10 rounded-full w-16" /></div></div>)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 mb-4"><svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9" /></svg></div>
          <h3 className="text-lg font-semibold text-white mb-1">No media items found</h3>
          <p className="text-slate-400 text-sm text-center max-w-sm">{search || filter !== "all" ? "Try adjusting your search or filters." : "Get started by adding your first media item."}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => (
            <div key={item.id} className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-all">
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium truncate">{item.title}</h3>
                <p className="text-slate-400 text-sm mt-0.5">{item.source || "No source"}</p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400">{item.type.replace("_", " ")}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${item.status === "published" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>{item.status}</span>
              <div className="flex items-center gap-1">
                <Link href={`/admin/media-items/${item.id}`} className="px-2 py-1 text-xs text-teal-400 hover:bg-teal-500/10 rounded transition-colors">Edit</Link>
                <button onClick={() => deleteItem(item.id)} className="px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 rounded transition-colors">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

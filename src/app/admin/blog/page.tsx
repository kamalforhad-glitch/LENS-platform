"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface BlogPost { id: string; slug: string; title: string; titleBn: string; description: string; author: string; category: string; status: string; datePublished: string | null; }

export default function BlogAdmin() {
  const [items, setItems] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => { fetch("/api/admin/blog").then(r => r.json()).then(d => { setItems(d.posts || []); setLoading(false); }); }, []);

  const filtered = items.filter(i => {
    const matchSearch = !search || i.title.toLowerCase().includes(search.toLowerCase()) || i.description.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || i.status === filter;
    return matchSearch && matchFilter;
  });

  const toggleSelect = (id: string) => { const n = new Set(selected); n.has(id) ? n.delete(id) : n.add(id); setSelected(n); };
  const toggleAll = () => { selected.size === filtered.length ? setSelected(new Set()) : setSelected(new Set(filtered.map(i => i.id))); };

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this blog post?")) return;
    await fetch("/api/admin/blog", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const counts = { all: items.length, published: items.filter(i => i.status === "published").length, draft: items.filter(i => i.status === "draft").length };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Blog Posts</h1>
          <p className="text-slate-500 text-sm mt-1">Articles, analysis and commentary.</p>
        </div>
        <Link href="/admin/blog/new" className="px-4 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 shadow-xs transition-colors">
          + New Post
        </Link>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Search posts..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 w-64"
        />
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1 border border-slate-200">
          {(["all", "published", "draft"] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filter === s ? "bg-white text-slate-900 shadow-xs font-semibold" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)} <span className="ml-1 opacity-70">{counts[s]}</span>
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl bg-white border border-slate-200 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="h-4 bg-slate-100 rounded w-48 mb-2" />
                  <div className="h-3 bg-slate-100 rounded w-64" />
                </div>
                <div className="h-5 bg-slate-100 rounded-full w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 bg-white rounded-xl border border-slate-200 p-8">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">No blog posts found</h3>
          <p className="text-slate-500 text-sm text-center max-w-sm">
            {search || filter !== "all" ? "Try adjusting your search or filters." : "Get started by creating your first blog post."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => (
            <div key={item.id} className="flex items-center gap-3 p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all">
              <div className="flex-1 min-w-0">
                <h3 className="text-slate-900 font-medium truncate">{item.title}</h3>
                <p className="text-slate-500 text-sm mt-0.5 truncate">{item.author} · {item.category}</p>
              </div>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                item.status === "published"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}>
                {item.status}
              </span>
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/admin/blog/${item.id}`}
                  className="px-2.5 py-1 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded border border-teal-200 transition-colors"
                >
                  Edit
                </Link>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded border border-red-200 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

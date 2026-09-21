"use client";

import { useState, useEffect } from "react";

interface Submission { id: string; name: string; email: string; subject: string; message: string; status: string; createdAt: string; }

function SkeletonItem() {
  return (
    <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-4 w-24 rounded bg-white/5 animate-pulse" />
          <div className="h-3 w-32 rounded bg-white/5 animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-5 w-14 rounded-full bg-white/5 animate-pulse" />
          <div className="h-3 w-16 rounded bg-white/5 animate-pulse" />
        </div>
      </div>
      <div className="h-3 w-48 rounded bg-white/5 animate-pulse mt-2" />
    </div>
  );
}

export default function ContactAdmin() {
  const [items, setItems] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Submission | null>(null);

  useEffect(() => { loadItems(); }, [filter]);

  const loadItems = async () => {
    setLoading(true);
    const url = filter === "all" ? "/api/admin/contact" : `/api/admin/contact?status=${filter}`;
    const d = await fetch(url).then(r => r.json());
    setItems(d.submissions || []);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch("/api/admin/contact", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i));
    if (selected?.id === id) setSelected({ ...selected, status });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-2">Contact Submissions</h1>
      <p className="text-sm text-slate-400 mb-6">View and manage messages from the contact form.</p>

      <div className="flex gap-2 mb-6">
        {["all", "new", "read", "resolved"].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === s ? "bg-teal-500 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10"}`}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonItem key={i} />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-12 h-12 mx-auto text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className="text-slate-400 text-sm font-medium">No submissions found</p>
          <p className="text-slate-600 text-xs mt-1">
            {filter !== "all" ? "Try selecting a different filter" : "Messages from the contact form will appear here"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className={`p-4 rounded-xl border cursor-pointer transition-all ${item.status === "new" ? "bg-teal-500/5 border-teal-400/30" : "bg-white/[0.02] border-white/5"} ${selected?.id === item.id ? "ring-1 ring-teal-400" : ""}`} onClick={() => setSelected(item)}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-white font-medium text-sm">{item.name}</span>
                  <span className="text-slate-500 text-xs ml-2">{item.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${item.status === "new" ? "bg-blue-500/20 text-blue-400" : item.status === "resolved" ? "bg-green-500/20 text-green-400" : "bg-slate-500/20 text-slate-400"}`}>{item.status}</span>
                  <span className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <p className="text-slate-400 text-xs mt-1">{item.subject}</p>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-navy-900 rounded-2xl border border-white/10 w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-2">{selected.subject}</h2>
            <p className="text-sm text-slate-400 mb-4">From: {selected.name} ({selected.email}) · {new Date(selected.createdAt).toLocaleString()}</p>
            <div className="p-4 rounded-xl bg-white/5 text-sm text-slate-300 whitespace-pre-wrap mb-4">{selected.message}</div>
            <div className="flex gap-2">
              {["new", "read", "resolved"].map(s => (
                <button key={s} onClick={() => updateStatus(selected.id, s)} className={`px-3 py-1.5 rounded-full text-xs font-medium ${selected.status === s ? "bg-teal-500 text-white" : "bg-white/10 text-slate-400 hover:bg-white/20"}`}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

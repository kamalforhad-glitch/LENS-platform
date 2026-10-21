"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Program { id: string; slug: string; title: string; titleBn: string; description: string; category: string; status: string; }

export default function ProgramsAdmin() {
  const [items, setItems] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch("/api/admin/programs").then(r => r.json()).then(d => { setItems(d.programs || []); setLoading(false); }); }, []);

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this program?")) return;
    await fetch("/api/admin/programs", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setItems(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Programs</h1>
        <Link href="/admin/programs/new" className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 shadow-xs">New Program</Link>
      </div>
      {loading ? <div className="text-slate-400">Loading...</div> : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xs">
              <div className="flex-1">
                <h3 className="text-slate-900 font-medium">{item.title} {item.titleBn && <span className="text-slate-500 text-sm">/ {item.titleBn}</span>}</h3>
                <p className="text-slate-500 text-sm mt-1">{item.description}</p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">{item.category}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${item.status === "published" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>{item.status}</span>
              <Link href={`/admin/programs/${item.id}`} className="px-2.5 py-1 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded border border-teal-200">Edit</Link>
              <button onClick={() => deleteItem(item.id)} className="px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded border border-red-200">Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

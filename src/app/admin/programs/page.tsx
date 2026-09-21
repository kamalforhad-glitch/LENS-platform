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
        <h1 className="text-2xl font-bold text-white">Programs</h1>
        <Link href="/admin/programs/new" className="px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-400">New Program</Link>
      </div>
      {loading ? <div className="text-slate-400">Loading...</div> : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex-1">
                <h3 className="text-white font-medium">{item.title} {item.titleBn && <span className="text-slate-500 text-sm">/ {item.titleBn}</span>}</h3>
                <p className="text-slate-400 text-sm mt-1">{item.description}</p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">{item.category}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${item.status === "published" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>{item.status}</span>
              <Link href={`/admin/programs/${item.id}`} className="text-teal-400 text-sm hover:underline">Edit</Link>
              <button onClick={() => deleteItem(item.id)} className="text-red-400 text-sm hover:underline">Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

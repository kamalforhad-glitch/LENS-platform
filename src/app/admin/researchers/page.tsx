"use client";

import { useState, useEffect } from "react";

interface Researcher {
  id: string;
  slug: string;
  name: string;
  nameBn: string;
  email: string | null;
  affiliation: string;
  affiliationBn: string;
  position: string;
  positionBn: string;
  bio: string;
  bioBn: string;
  image: string | null;
  orcid: string | null;
  website: string | null;
  social: string;
  researchAreas: string;
  researchAreasBn: string;
  expertise: string;
  expertiseBn: string;
  education: string;
  educationBn: string;
  languages: string;
  languagesBn: string;
  totalDownloads: number;
  totalCitations: number;
  featured: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

function SkeletonItem() {
  return (
    <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-slate-100 animate-pulse" />
          <div className="h-4 w-32 rounded bg-slate-100 animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-5 w-14 rounded-full bg-slate-100 animate-pulse" />
          <div className="h-3 w-16 rounded bg-slate-100 animate-pulse" />
        </div>
      </div>
      <div className="h-3 w-48 rounded bg-slate-100 animate-pulse mt-2" />
    </div>
  );
}

export default function ResearchersAdmin() {
  const [items, setItems] = useState<Researcher[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [editingItem, setEditingItem] = useState<Researcher | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({
    name: "",
    nameBn: "",
    email: "",
    affiliation: "",
    affiliationBn: "",
    position: "",
    positionBn: "",
    bio: "",
    bioBn: "",
    image: "",
    orcid: "",
    website: "",
    social: "{}",
    researchAreas: "[]",
    researchAreasBn: "[]",
    expertise: "[]",
    expertiseBn: "[]",
    education: "[]",
    educationBn: "[]",
    languages: "[]",
    languagesBn: "[]",
    featured: false,
    status: "active",
  });

  const loadItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await fetch("/api/admin/researchers").then((r) => r.json());
      if (d.error) throw new Error(d.error);
      setItems(d.researchers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load researchers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadItems(); }, []);

  const saveItem = async (payload: Researcher | Record<string, unknown>) => {
    setError(null);
    try {
      const method = payload.id ? "PUT" : "POST";
      const res = await fetch("/api/admin/researchers", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Save failed");
      setEditingItem(null);
      setNewItem({
        name: "", nameBn: "", email: "", affiliation: "", affiliationBn: "",
        position: "", positionBn: "", bio: "", bioBn: "", image: "", orcid: "",
        website: "", social: "{}", researchAreas: "[]", researchAreasBn: "[]",
        expertise: "[]", expertiseBn: "[]", education: "[]", educationBn: "[]",
        languages: "[]", languagesBn: "[]", featured: false, status: "active",
      });
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this researcher profile?")) return;
    setError(null);
    try {
      const res = await fetch("/api/admin/researchers", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Delete failed");
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const parseJson = (str: string): string[] => {
    try { return JSON.parse(str); } catch { return []; }
  };

  const filtered = items.filter((r) =>
    (r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.affiliation.toLowerCase().includes(search.toLowerCase()) ||
      r.nameBn.includes(search)) &&
    (filter === "all" || r.status === filter)
  );

  if (loading) return <div className="p-6 space-y-2">{Array.from({ length: 5 }).map((_, i) => <SkeletonItem key={i} />)}</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Researcher Profiles</h1>
          <p className="text-sm text-slate-500 mt-1">Manage affiliated researchers and their profiles.</p>
        </div>
      </div>

      {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

      <div className="flex flex-wrap gap-2 mb-6">
        <input placeholder="Search name, affiliation..." value={search} onChange={(e) => setSearch(e.target.value)} className="px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 w-64" />
        {["all", "active", "inactive"].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === s ? "bg-teal-600 text-white shadow-xs" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"}`}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-12 h-12 mx-auto text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-slate-400 text-sm font-medium">No researchers found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => (
            <div key={item.id} className={`p-4 rounded-xl border cursor-pointer transition-all ${editingItem?.id === item.id ? "ring-1 ring-teal-400" : "bg-white border-slate-200 hover:border-slate-300 shadow-2xs"}`} onClick={() => setEditingItem(item)}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-lg font-bold shrink-0">
                  {item.image ? <img src={item.image} alt={item.name} className="w-12 h-12 rounded-full object-cover" /> : item.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-900 font-medium text-sm truncate">{item.name} {item.nameBn && <span className="text-slate-500 ml-2">/ {item.nameBn}</span>}</p>
                  <p className="text-xs text-slate-400 truncate">{item.affiliation}</p>
                  <p className="text-xs text-slate-500 truncate">{item.position}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${item.status === "active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-600 border border-slate-200"}`}>{item.status}</span>
                  {item.featured && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Featured</span>}
                  <span className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setEditingItem(null)}>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-900 mb-4">{editingItem.id ? "Edit researcher" : "Add researcher"}</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Name (EN)</label><input placeholder="Name" value={editingItem.name} onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600" /></div>
                <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Name (বাংলা)</label><input placeholder="Name (Bangla)" value={editingItem.nameBn} onChange={(e) => setEditingItem({ ...editingItem, nameBn: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-bangla" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Email</label><input placeholder="Email" value={editingItem.email || ""} onChange={(e) => setEditingItem({ ...editingItem, email: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600" /></div>
                <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">ORCID</label><input placeholder="ORCID" value={editingItem.orcid || ""} onChange={(e) => setEditingItem({ ...editingItem, orcid: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Affiliation (EN)</label><input placeholder="Affiliation" value={editingItem.affiliation} onChange={(e) => setEditingItem({ ...editingItem, affiliation: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600" /></div>
                <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Affiliation (বাংলা)</label><input placeholder="Affiliation (Bangla)" value={editingItem.affiliationBn} onChange={(e) => setEditingItem({ ...editingItem, affiliationBn: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-bangla" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Position (EN)</label><input placeholder="Position" value={editingItem.position} onChange={(e) => setEditingItem({ ...editingItem, position: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600" /></div>
                <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Position (বাংলা)</label><input placeholder="Position (Bangla)" value={editingItem.positionBn} onChange={(e) => setEditingItem({ ...editingItem, positionBn: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-bangla" /></div>
              </div>
              <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Bio (EN)</label><textarea placeholder="Bio (EN)" value={editingItem.bio} onChange={(e) => setEditingItem({ ...editingItem, bio: e.target.value })} rows={3} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600" /></div>
              <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Bio (বাংলা)</label><textarea placeholder="Bio (Bangla)" value={editingItem.bioBn} onChange={(e) => setEditingItem({ ...editingItem, bioBn: e.target.value })} rows={3} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-bangla" /></div>
              <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Image URL</label><input value={editingItem.image || ""} onChange={(e) => setEditingItem({ ...editingItem, image: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600" /></div>
              <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Website</label><input value={editingItem.website || ""} onChange={(e) => setEditingItem({ ...editingItem, website: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Social (JSON)</label><textarea value={editingItem.social} onChange={(e) => setEditingItem({ ...editingItem, social: e.target.value })} rows={2} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600" /></div>
                <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Research Areas (EN JSON)</label><textarea value={editingItem.researchAreas} onChange={(e) => setEditingItem({ ...editingItem, researchAreas: e.target.value })} rows={2} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Research Areas (BN JSON)</label><textarea value={editingItem.researchAreasBn} onChange={(e) => setEditingItem({ ...editingItem, researchAreasBn: e.target.value })} rows={2} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600" /></div>
                <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Expertise (EN JSON)</label><textarea value={editingItem.expertise} onChange={(e) => setEditingItem({ ...editingItem, expertise: e.target.value })} rows={2} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Expertise (BN JSON)</label><textarea value={editingItem.expertiseBn} onChange={(e) => setEditingItem({ ...editingItem, expertiseBn: e.target.value })} rows={2} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600" /></div>
                <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Education (EN JSON)</label><textarea value={editingItem.education} onChange={(e) => setEditingItem({ ...editingItem, education: e.target.value })} rows={2} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Education (BN JSON)</label><textarea value={editingItem.educationBn} onChange={(e) => setEditingItem({ ...editingItem, educationBn: e.target.value })} rows={2} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600" /></div>
                <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Languages (EN JSON)</label><textarea value={editingItem.languages} onChange={(e) => setEditingItem({ ...editingItem, languages: e.target.value })} rows={2} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600" /></div>
              </div>
              <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Languages (BN JSON)</label><textarea value={editingItem.languagesBn} onChange={(e) => setEditingItem({ ...editingItem, languagesBn: e.target.value })} rows={2} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600" /></div>
              <div className="grid grid-cols-3 gap-3">
                <label className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                  <input type="checkbox" checked={editingItem.featured} onChange={(e) => setEditingItem({ ...editingItem, featured: e.target.checked })} /> Featured
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                  <input type="checkbox" checked={editingItem.status === "active"} onChange={(e) => setEditingItem({ ...editingItem, status: e.target.checked ? "active" : "inactive" })} /> Active
                </label>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button onClick={() => setEditingItem(null)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900">Cancel</button>
                <button onClick={() => saveItem(editingItem)} className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 shadow-xs">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Button */}
      <button onClick={() => setEditingItem({ id: "", name: "", nameBn: "", email: "", affiliation: "", affiliationBn: "", position: "", positionBn: "", bio: "", bioBn: "", image: "", orcid: "", website: "", social: "{}", researchAreas: "[]", researchAreasBn: "[]", expertise: "[]", expertiseBn: "[]", education: "[]", educationBn: "[]", languages: "[]", languagesBn: "[]", featured: false, status: "active", createdAt: "", updatedAt: "" } as Researcher)} className="mt-6 w-full px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-400">+ Add Researcher</button>
    </div>
  );
}
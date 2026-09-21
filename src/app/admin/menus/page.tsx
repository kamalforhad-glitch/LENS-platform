"use client";

import { useState, useEffect } from "react";

interface MenuItem {
  id: string;
  location: string;
  label: string;
  labelBn: string;
  url: string;
  sortOrder: number;
  visible: boolean;
  target: string;
}

export default function MenusAdmin() {
  const [headerItems, setHeaderItems] = useState<MenuItem[]>([]);
  const [footerItems, setFooterItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [newItem, setNewItem] = useState({ location: "header", label: "", labelBn: "", url: "", visible: true, target: "_self" });

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/menus?location=header").then(r => r.json()),
      fetch("/api/admin/menus?location=footer").then(r => r.json()),
    ]).then(([h, f]) => { setHeaderItems(h.items || []); setFooterItems(f.items || []); setLoading(false); });
  }, []);

  const saveItem = async (item: Partial<MenuItem>) => {
    const method = item.id ? "PUT" : "POST";
    const body = item.id ? item : newItem;
    await fetch("/api/admin/menus", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const h = await fetch("/api/admin/menus?location=header").then(r => r.json());
    const f = await fetch("/api/admin/menus?location=footer").then(r => r.json());
    setHeaderItems(h.items || []);
    setFooterItems(f.items || []);
    setEditingItem(null);
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this menu item?")) return;
    await fetch("/api/admin/menus", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setHeaderItems(prev => prev.filter(i => i.id !== id));
    setFooterItems(prev => prev.filter(i => i.id !== id));
  };

  const ItemList = ({ items, location }: { items: MenuItem[]; location: string }) => (
    <div className="space-y-2">
      {items.sort((a, b) => a.sortOrder - b.sortOrder).map(item => (
        <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
          <span className="text-slate-500 text-xs w-4">{item.sortOrder}</span>
          <span className="text-white text-sm flex-1">{item.label} {item.labelBn && <span className="text-slate-500">/ {item.labelBn}</span>}</span>
          <span className="text-slate-400 text-xs">{item.url}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${item.visible ? "bg-green-500/20 text-green-400" : "bg-slate-500/20 text-slate-400"}`}>{item.visible ? "Visible" : "Hidden"}</span>
          <button onClick={() => setEditingItem(item)} className="text-xs text-teal-400 hover:underline">Edit</button>
          <button onClick={() => deleteItem(item.id)} className="text-xs text-red-400 hover:underline">Delete</button>
        </div>
      ))}
      <div className="flex gap-2 mt-3">
        <input placeholder="Label" value={newItem.location === location ? newItem.label : ""} onChange={e => setNewItem({ ...newItem, location, label: e.target.value })} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-xs w-32" />
        <input placeholder="Label (BN)" value={newItem.location === location ? newItem.labelBn : ""} onChange={e => setNewItem({ ...newItem, location, labelBn: e.target.value })} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-xs w-32" />
        <input placeholder="URL" value={newItem.location === location ? newItem.url : ""} onChange={e => setNewItem({ ...newItem, location, url: e.target.value })} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-xs flex-1" />
        <button onClick={() => saveItem(newItem)} className="px-3 py-1.5 bg-teal-500 text-white rounded-lg text-xs font-medium hover:bg-teal-400">Add</button>
      </div>
    </div>
  );

  if (loading) return <div className="p-6 text-slate-400">Loading menus...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Menu Management</h1>
      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Header Navigation</h2>
          <ItemList items={headerItems} location="header" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Footer Links</h2>
          <ItemList items={footerItems} location="footer" />
        </div>
      </div>

      {editingItem && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setEditingItem(null)}>
          <div className="bg-navy-900 rounded-2xl border border-white/10 w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-4">Edit Menu Item</h2>
            <div className="space-y-3">
              <div><label className="block text-xs text-slate-400 mb-1">Label (EN)</label><input value={editingItem.label} onChange={e => setEditingItem({ ...editingItem, label: e.target.value })} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm" /></div>
              <div><label className="block text-xs text-slate-400 mb-1">Label (BN)</label><input value={editingItem.labelBn} onChange={e => setEditingItem({ ...editingItem, labelBn: e.target.value })} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm" /></div>
              <div><label className="block text-xs text-slate-400 mb-1">URL</label><input value={editingItem.url} onChange={e => setEditingItem({ ...editingItem, url: e.target.value })} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm" /></div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setEditingItem(null)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
                <button onClick={() => saveItem(editingItem)} className="px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-400">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

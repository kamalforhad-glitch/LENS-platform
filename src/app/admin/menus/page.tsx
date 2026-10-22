"use client";

import { useState, useEffect } from "react";
import { reorderMenuItems } from "@/lib/actions/cms";

interface MenuItem {
  id: string;
  location: string;
  label: string;
  labelBn: string;
  url: string;
  sortOrder: number;
  visible: boolean;
  target: string;
  parentId?: string | null;
  [key: string]: unknown; // API rows include extra fields (dates); ignored here
}

export default function MenusAdmin() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({ location: "header", label: "", labelBn: "", url: "", visible: true, target: "_self", parentId: "" });

  const [locationFilter, setLocationFilter] = useState<"header" | "footer">("header");

  const load = async () => {
    setLoading(true);
    try {
      const d = await fetch("/api/admin/menus?location=*").then((r) => r.json());
      if (d.error) throw new Error(d.error);
      setItems(d.items || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load menus");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, []);

  const saveItem = async (payload: MenuItem | Record<string, unknown>) => {
    setError(null);
    try {
      const method = payload.id ? "PUT" : "POST";
      const res = await fetch("/api/admin/menus", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Save failed");
      setEditingItem(null);
      setNewItem((n) => ({ ...n, label: "", labelBn: "", url: "", parentId: "" }));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  };

  const toggleVisible = async (item: MenuItem) => {
    const next = !item.visible;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, visible: next } : i)));
    try {
      await fetch("/api/admin/menus", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id, visible: next }) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Visibility change failed");
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, visible: item.visible } : i)));
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this menu item? Hidden sub-items will become top-level.")) return;
    setError(null);
    try {
      const res = await fetch("/api/admin/menus", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Delete failed");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const move = async (item: MenuItem, dir: -1 | 1) => {
    const siblings = inLocation
      .filter((i) => i.parentId === item.parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = siblings.findIndex((i) => i.id === item.id);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= siblings.length) return;
    const swapped = [...siblings];
    [swapped[idx], swapped[swap]] = [swapped[swap], swapped[idx]];

    // Rebuild the location's full order: siblings keep their existing slots
    // (positions among all items), only their sequence inside the block changes.
    const siblingIds = new Set(swapped.map((s) => s.id));
    const fullSorted = [...inLocation].sort((a, b) => a.sortOrder - b.sortOrder);
    const siblingOrder = swapped.map((s) => s.id);
    let k = 0;
    const finalList = fullSorted.map((i) => (siblingIds.has(i.id) ? siblingOrder[k++] : i.id));

    // optimistic local
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, sortOrder: item.sortOrder } : i)));
    try {
      await reorderMenuItems(item.location, finalList);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reorder failed");
      await load();
    }
  };

  const inLocation = items.filter((i) => i.location === locationFilter);
  const topLevel = inLocation.filter((i) => !i.parentId);

  const childOptionsFor = (item: MenuItem | null) =>
    inLocation.filter((i) => !i.parentId && i.id !== item?.id);

  const renderItem = (item: MenuItem, depth: number) => {
    const children = inLocation.filter((i) => i.parentId === item.id);
    return (
      <div key={item.id} className="space-y-2">
        <div className={`flex items-center gap-2 p-3 rounded-lg bg-white border border-slate-200 shadow-2xs ${depth > 0 ? "ml-6 border-l-2 border-l-teal-500/40" : ""}`}>
          <button onClick={() => move(item, -1)} className="text-slate-600 hover:text-slate-900 text-xs" title="Move up">↑</button>
          <button onClick={() => move(item, 1)} className="text-slate-400 hover:text-white text-xs" title="Move down">↓</button>
          <div className="flex-1 min-w-0">
            <p className="text-slate-900 font-medium text-sm truncate">
              {depth > 0 && <span className="text-teal-600 mr-1 font-bold">↳</span>}
              {item.label} {item.labelBn && <span className="text-slate-500">/ {item.labelBn}</span>}
            </p>
            <p className="text-slate-500 text-xs truncate">
              {item.url} {item.target === "_blank" && <span className="text-[10px] text-slate-500">(new tab)</span>}
            </p>
          </div>
          <button onClick={() => toggleVisible(item)} className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${item.visible ? "text-emerald-700 border-emerald-300 bg-emerald-50" : "text-slate-600 border-slate-200 bg-slate-50"}`}>
            {item.visible ? "Visible" : "Hidden"}
          </button>
          <button onClick={() => setEditingItem(item)} className="text-xs px-2.5 py-1 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded border border-teal-200">Edit</button>
          <button onClick={() => deleteItem(item.id)} className="text-xs px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded border border-red-200">Delete</button>
        </div>
        {children.map((c) => renderItem(c, depth + 1))}
      </div>
    );
  };

  if (loading) return <div className="p-6 text-slate-400">Loading menus...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Menu Management</h1>
          <p className="text-slate-500 text-sm mt-1">Order, visibility, targets and nesting of site navigation.</p>
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1 border border-slate-200">
          {(["header", "footer"] as const).map((loc) => (
            <button key={loc} onClick={() => setLocationFilter(loc)} className={`px-4 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${locationFilter === loc ? "bg-white text-slate-900 shadow-xs font-semibold" : "text-slate-600 hover:text-slate-900"}`}>
              {loc}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

      {topLevel.length === 0 ? (
        <p className="text-slate-400 text-sm bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center">
          No {locationFilter} menu items yet — add one below.
        </p>
      ) : topLevel.map((item) => renderItem(item, 0))}

      {/* Add row */}
      <div className="flex flex-wrap gap-2 mt-6 p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
        <input placeholder="Label (EN)" value={newItem.label} onChange={(e) => setNewItem({ ...newItem, label: e.target.value })} className="px-3 py-1.5 bg-white border border-slate-200 shadow-2xs rounded-lg text-slate-900 text-xs w-36" />
        <input placeholder="Label (বাংলা)" value={newItem.labelBn} onChange={(e) => setNewItem({ ...newItem, labelBn: e.target.value })} className="px-3 py-1.5 bg-white border border-slate-200 shadow-2xs rounded-lg text-slate-900 text-xs w-36 font-bangla" />
        <input placeholder="URL (/path or https://…)" value={newItem.url} onChange={(e) => setNewItem({ ...newItem, url: e.target.value })} className="px-3 py-1.5 bg-white border border-slate-200 shadow-2xs rounded-lg text-slate-900 text-xs flex-1 min-w-40" />
        <select value={newItem.parentId} onChange={(e) => setNewItem({ ...newItem, parentId: e.target.value })} className="px-2 py-1.5 bg-white border border-slate-200 shadow-2xs rounded-lg text-slate-900 text-xs">
          <option value="" >Top level</option>
          {childOptionsFor(null).map((p) => (
            <option key={p.id} value={p.id} >Under {p.label}</option>
          ))}
        </select>
        <button
          onClick={async () => {
            if (!newItem.label || !newItem.url) { setError("Label and URL are required"); return; }
            await saveItem({ ...newItem, parentId: newItem.parentId || null });
          }}
          className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-700 shadow-xs px-4 py-2"
        >
          Add item
        </button>
      </div>

      {editingItem && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setEditingItem(null)}>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Edit menu item</h2>
            <div className="space-y-3">
              <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Label (EN)</label><input value={editingItem.label} onChange={(e) => setEditingItem({ ...editingItem, label: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 shadow-2xs rounded-lg text-white text-sm" /></div>
              <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Label (বাংলা)</label><input value={editingItem.labelBn} onChange={(e) => setEditingItem({ ...editingItem, labelBn: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 shadow-2xs rounded-lg text-white text-sm font-bangla" /></div>
              <div><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">URL</label><input value={editingItem.url} onChange={(e) => setEditingItem({ ...editingItem, url: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 shadow-2xs rounded-lg text-white text-sm" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Opens in</label>
                  <select value={editingItem.target || "_self"} onChange={(e) => setEditingItem({ ...editingItem, target: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 shadow-2xs rounded-lg text-white text-sm">
                    <option value="_self" >Same tab</option>
                    <option value="_blank" >New tab</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Parent</label>
                  <select value={editingItem.parentId || ""} onChange={(e) => setEditingItem({ ...editingItem, parentId: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 shadow-2xs rounded-lg text-white text-sm">
                    <option value="" >Top level</option>
                    {childOptionsFor(editingItem).map((p) => (
                      <option key={p.id} value={p.id} >Under {p.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                <input type="checkbox" checked={editingItem.visible} onChange={(e) => setEditingItem({ ...editingItem, visible: e.target.checked })} />
                Visible in navigation
              </label>
              <div className="flex gap-3 justify-end pt-2">
                <button onClick={() => setEditingItem(null)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
                <button onClick={() => saveItem({ ...editingItem, parentId: editingItem.parentId || null })} className="px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-400">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

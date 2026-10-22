"use client";

import { useState, useEffect } from "react";
import {
  Globe,
  Search,
  Plus,
  Save,
  Trash2,
  CheckCircle,
  AlertCircle,
  Filter,
} from "lucide-react";
import {
  getTranslations,
  upsertTranslation,
  deleteTranslation,
  type TranslationItem,
} from "@/lib/actions/translations";

export default function TranslationsAdminPage() {
  const [items, setItems] = useState<TranslationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [namespaceFilter, setNamespaceFilter] = useState("all");
  const [localeFilter, setLocaleFilter] = useState("all");
  const [editingItem, setEditingItem] = useState<{
    id?: string;
    locale: string;
    namespace: string;
    key: string;
    value: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getTranslations();
      setItems(data);
    } catch (err) {
      setError("Failed to load translations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setSaving(true);
    setError(null);
    try {
      await upsertTranslation(
        editingItem.locale,
        editingItem.namespace,
        editingItem.key,
        editingItem.value
      );
      setToast(`Saved translation for "${editingItem.key}".`);
      setEditingItem(null);
      await loadData();
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, key: string) => {
    if (!confirm(`Delete translation for "${key}"?`)) return;
    try {
      await deleteTranslation(id);
      setToast("Translation deleted.");
      await loadData();
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  };

  const namespaces = Array.from(new Set(items.map((it) => it.namespace)));

  const filtered = items.filter((it) => {
    const matchSearch =
      !search ||
      it.key.toLowerCase().includes(search.toLowerCase()) ||
      it.value.toLowerCase().includes(search.toLowerCase());
    const matchNs = namespaceFilter === "all" || it.namespace === namespaceFilter;
    const matchLoc = localeFilter === "all" || it.locale === localeFilter;
    return matchSearch && matchNs && matchLoc;
  });

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-6 h-6 text-teal-600" />
            <h1 className="text-2xl font-bold text-slate-900">Translations & Localization</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage multilingual dictionary keys and UI strings across English and Bengali.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setEditingItem({
              locale: "en",
              namespace: "common",
              key: "",
              value: "",
            })
          }
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold shadow-xs flex items-center gap-2 self-start"
        >
          <Plus className="w-4 h-4" />
          Add Translation Key
        </button>
      </div>

      {toast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs sm:text-sm">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-xs sm:text-sm">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search key or text value..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={namespaceFilter}
            onChange={(e) => setNamespaceFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">All Namespaces</option>
            {namespaces.map((ns) => (
              <option key={ns} value={ns}>
                {ns}
              </option>
            ))}
          </select>

          <select
            value={localeFilter}
            onChange={(e) => setLocaleFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">All Locales</option>
            <option value="en">English (en)</option>
            <option value="bn">বাংলা (bn)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading translations...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <Globe className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p>No translation records found matching your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Locale</th>
                  <th className="px-4 py-3">Namespace</th>
                  <th className="px-4 py-3">Key</th>
                  <th className="px-4 py-3">Value</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          item.locale === "bn"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {item.locale.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-500">{item.namespace}</td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-800">{item.key}</td>
                    <td className="px-4 py-3 text-slate-700 text-xs max-w-md truncate">{item.value}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => setEditingItem(item)}
                        className="text-xs text-teal-600 hover:text-teal-700 font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id, item.key)}
                        className="text-xs text-rose-500 hover:text-rose-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit / Create Modal */}
      {editingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setEditingItem(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-slate-900">
              {editingItem.id ? "Edit Translation" : "New Translation Key"}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Locale
                  </label>
                  <select
                    value={editingItem.locale}
                    onChange={(e) => setEditingItem({ ...editingItem, locale: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                  >
                    <option value="en">English (en)</option>
                    <option value="bn">বাংলা (bn)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Namespace
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="common"
                    value={editingItem.namespace}
                    onChange={(e) => setEditingItem({ ...editingItem, namespace: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Translation Key
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. hero_badge"
                  value={editingItem.key}
                  onChange={(e) => setEditingItem({ ...editingItem, key: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Text Value
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Translated string..."
                  value={editingItem.value}
                  onChange={(e) => setEditingItem({ ...editingItem, value: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Translation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


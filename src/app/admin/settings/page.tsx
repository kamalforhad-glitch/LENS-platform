"use client";

import { useEffect, useState } from "react";
import { getSiteSettings, updateSiteSettingsBulk } from "@/lib/actions/cms";
import { DEFAULT_SITE_SETTINGS } from "@/lib/cms-defaults";
import MediaPickerModal from "@/components/admin/MediaPickerModal";

interface SettingItem {
  id: string;
  key: string;
  value: string;
  valueBn: string;
  type: string;
  group: string;
  label: string;
  labelBn: string;
  sortOrder: number;
}

const GROUPS = [
  { id: "general", label: "General & Branding" },
  { id: "design", label: "Design & Navigation" },
  { id: "contact", label: "Contact Information" },
  { id: "social", label: "Social Media Links" },
  { id: "footer", label: "Footer Content" },
  { id: "seo", label: "Global SEO" },
];

export default function SiteSettingsAdminPage() {
  const [settings, setSettings] = useState<SettingItem[]>([]);
  const [activeGroup, setActiveGroup] = useState("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [mediaPickerKey, setMediaPickerKey] = useState<string | null>(null);

  useEffect(() => {
    getSiteSettings().then((items) => {
      const existingMap = new Map((items as SettingItem[]).map((it) => [it.key, it]));
      const merged: SettingItem[] = [...(items as SettingItem[])];
      for (const def of DEFAULT_SITE_SETTINGS) {
        if (!existingMap.has(def.key)) {
          merged.push({
            id: `temp-${def.key}`,
            key: def.key,
            value: def.value,
            valueBn: def.valueBn,
            type: def.type,
            group: def.group,
            label: def.label,
            labelBn: def.labelBn,
            sortOrder: def.sortOrder,
          });
        }
      }
      setSettings(merged);
      setLoading(false);
    });
  }, []);

  const handleChange = (key: string, field: "value" | "valueBn", val: string) => {
    setSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, [field]: val } : s))
    );
    setSavedSuccess(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const groupItems = settings.filter((s) => s.group === activeGroup);
      await updateSiteSettingsBulk(groupItems);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const currentGroupSettings = settings
    .filter((s) => s.group === activeGroup)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading site settings...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Global Site Settings</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage branding, contact information, social profiles, and site-wide metadata.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {savedSuccess && (
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-fadeIn">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Changes saved
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200 gap-1 mb-8 pb-px">
        {GROUPS.map((g) => {
          const isActive = activeGroup === g.id;
          return (
            <button
              key={g.id}
              onClick={() => {
                setActiveGroup(g.id);
                setSavedSuccess(false);
              }}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                isActive
                  ? "border-teal-600 text-teal-700 font-semibold"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              {g.label}
            </button>
          );
        })}
      </div>

      {/* Settings List */}
      <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-xs">
        {currentGroupSettings.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No settings found in this group.
          </div>
        ) : (
          currentGroupSettings.map((item) => (
            <div key={item.key} className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <label className="text-sm font-bold text-slate-800">
                  {item.label || item.key}
                  {item.labelBn && (
                    <span className="text-slate-400 font-normal ml-2">/ {item.labelBn}</span>
                  )}
                </label>
                <span className="text-[11px] font-mono text-slate-400">{item.key}</span>
              </div>

              {item.type === "boolean" ? (
                <div className="flex items-center gap-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.value === "true"}
                      onChange={(e) => {
                        const val = e.target.checked ? "true" : "false";
                        handleChange(item.key, "value", val);
                        handleChange(item.key, "valueBn", val);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600" />
                  </label>
                  <span className="text-xs font-medium text-slate-600">
                    {item.value === "true" ? "Enabled" : "Disabled"}
                  </span>
                </div>
              ) : item.type === "image" ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={item.value}
                      onChange={(e) => handleChange(item.key, "value", e.target.value)}
                      placeholder="/images/example.jpg or https://..."
                      className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                    <button
                      type="button"
                      onClick={() => setMediaPickerKey(item.key)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors shrink-0"
                    >
                      Browse Media
                    </button>
                  </div>
                  {item.value && (
                    <div className="w-32 h-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.value} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              ) : item.key === "brand_accent_color" ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={item.value.startsWith("#") ? item.value : "#0d9488"}
                      onChange={(e) => {
                        handleChange(item.key, "value", e.target.value);
                        handleChange(item.key, "valueBn", e.target.value);
                      }}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 p-0.5"
                    />
                    <input
                      type="text"
                      value={item.value}
                      onChange={(e) => {
                        handleChange(item.key, "value", e.target.value);
                        handleChange(item.key, "valueBn", e.target.value);
                      }}
                      className="w-36 px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="text-slate-400 self-center">Brand Presets:</span>
                    {[
                      { name: "Teal (Official)", hex: "#0d9488" },
                      { name: "Cyan", hex: "#06b6d4" },
                      { name: "Gold", hex: "#d4a843" },
                      { name: "Navy Blue", hex: "#1e3a8a" },
                      { name: "Emerald", hex: "#10b981" },
                    ].map((p) => (
                      <button
                        key={p.hex}
                        type="button"
                        onClick={() => {
                          handleChange(item.key, "value", p.hex);
                          handleChange(item.key, "valueBn", p.hex);
                        }}
                        className="px-2.5 py-1 rounded-md border border-slate-200 text-slate-700 hover:border-slate-400 text-xs flex items-center gap-1.5"
                      >
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.hex }} />
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : item.key === "header_layout" ? (
                <div className="flex gap-2">
                  {[
                    { id: "standard", label: "Standard (Nav between Logo & Actions)" },
                    { id: "compact", label: "Compact (Slim Bar)" },
                    { id: "centered", label: "Centered Nav" },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        handleChange(item.key, "value", preset.id);
                        handleChange(item.key, "valueBn", preset.id);
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                        item.value === preset.id
                          ? "bg-teal-50 border-teal-500 text-teal-800 font-semibold"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              ) : item.key.includes("description") || item.key.includes("keywords") || item.key.includes("address") ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      English
                    </span>
                    <textarea
                      rows={3}
                      value={item.value}
                      onChange={(e) => handleChange(item.key, "value", e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 resize-none"
                    />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Bengali
                    </span>
                    <textarea
                      rows={3}
                      value={item.valueBn}
                      onChange={(e) => handleChange(item.key, "valueBn", e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 resize-none font-bengali"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      English
                    </span>
                    <input
                      type="text"
                      value={item.value}
                      onChange={(e) => handleChange(item.key, "value", e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Bengali
                    </span>
                    <input
                      type="text"
                      value={item.valueBn}
                      onChange={(e) => handleChange(item.key, "valueBn", e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-bengali"
                    />
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Media Picker Modal */}
      {mediaPickerKey && (
        <MediaPickerModal
          open={true}
          onClose={() => setMediaPickerKey(null)}
          onSelect={(url) => {
            handleChange(mediaPickerKey, "value", url);
            handleChange(mediaPickerKey, "valueBn", url);
          }}
        />
      )}
    </div>
  );
}

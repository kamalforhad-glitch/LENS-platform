"use client";

import { useEffect, useState } from "react";
import { getSiteSettings, updateSiteSettingsBulk } from "@/lib/actions/cms";
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
      setSettings(items as SettingItem[]);
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

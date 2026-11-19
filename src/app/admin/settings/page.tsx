"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  getSiteSettings,
  updateSiteSettingsBulk,
  getAllMenuItems,
  updateMenuItem,
  deleteMenuItem,
} from "@/lib/actions/cms";
import { DEFAULT_SITE_SETTINGS } from "@/lib/cms-defaults";
import MediaPickerModal from "@/components/admin/MediaPickerModal";
import {
  Eye,
  EyeOff,
  Trash2,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Layers,
  FolderTree,
} from "lucide-react";

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

interface FooterMenuItem {
  id: string;
  label: string;
  labelBn: string;
  url: string;
  parentId: string | null;
  visible: boolean;
  sortOrder: number;
}

interface ConfirmModalState {
  title: string;
  message: string;
  itemName?: string;
  confirmLabel?: string;
  onConfirm: () => Promise<void> | void;
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
  const [saveError, setSaveError] = useState<string | null>(null);
  const [mediaPickerKey, setMediaPickerKey] = useState<string | null>(null);

  // Footer Navigation State
  const [footerMenuItems, setFooterMenuItems] = useState<FooterMenuItem[]>([]);
  const [loadingFooterMenu, setLoadingFooterMenu] = useState(false);
  const [footerActionError, setFooterActionError] = useState<string | null>(null);
  const [footerActionSuccess, setFooterActionSuccess] = useState<string | null>(null);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState | null>(null);
  const [, startTransition] = useTransition();

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

  const loadFooterMenuItems = async () => {
    setLoadingFooterMenu(true);
    try {
      const items = await getAllMenuItems("footer");
      setFooterMenuItems(items as FooterMenuItem[]);
    } catch {
      // Silently keep empty list if unseeded
    } finally {
      setLoadingFooterMenu(false);
    }
  };

  useEffect(() => {
    if (activeGroup === "footer") {
      loadFooterMenuItems();
    }
  }, [activeGroup]);

  const handleChange = (key: string, field: "value" | "valueBn", val: string) => {
    setSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, [field]: val } : s))
    );
    setSavedSuccess(false);
    setSaveError(null);
  };

  const isSettingDisabled = (val: string | undefined | null): boolean => {
    if (val === undefined || val === null) return false;
    const trimmed = val.trim();
    return trimmed === "" || trimmed === "__DISABLED__" || trimmed.startsWith("__DISABLED__:");
  };

  const getCleanSettingValue = (val: string): string => {
    if (!val) return "";
    if (val === "__DISABLED__") return "";
    if (val.startsWith("__DISABLED__:")) {
      return val.slice("__DISABLED__:".length);
    }
    return val;
  };

  const handleToggleDisabled = (key: string) => {
    setSettings((prev) =>
      prev.map((s) => {
        if (s.key !== key) return s;
        const currentlyDisabled = isSettingDisabled(s.value);
        if (currentlyDisabled) {
          // Re-enable
          const cleanVal = getCleanSettingValue(s.value);
          const cleanValBn = getCleanSettingValue(s.valueBn);
          const def = DEFAULT_SITE_SETTINGS.find((d) => d.key === key);
          const nextVal = cleanVal || def?.value || "";
          const nextValBn = cleanValBn || def?.valueBn || nextVal;
          return { ...s, value: nextVal, valueBn: nextValBn };
        } else {
          // Disable
          return {
            ...s,
            value: s.value ? `__DISABLED__:${s.value}` : "__DISABLED__",
            valueBn: s.valueBn ? `__DISABLED__:${s.valueBn}` : "__DISABLED__",
          };
        }
      })
    );
    setSavedSuccess(false);
    setSaveError(null);
  };

  const handlePromptRemoveSetting = (item: SettingItem) => {
    const isSocial = item.group === "social";
    setConfirmModal({
      title: isSocial ? "Remove this social media link?" : "Remove this footer content?",
      message: isSocial
        ? `Are you sure you want to remove the "${item.label || item.key}" link? The URL will be cleared and this platform will not appear on the website footer.`
        : `Are you sure you want to remove "${item.label || item.key}"? The content will be cleared and will no longer appear on the footer.`,
      itemName: item.label || item.key,
      confirmLabel: "Confirm Remove",
      onConfirm: () => {
        setSettings((prev) =>
          prev.map((s) =>
            s.key === item.key ? { ...s, value: "", valueBn: "" } : s
          )
        );
        setConfirmModal(null);
        setSavedSuccess(false);
        setSaveError(null);
      },
    });
  };

  const handleRestoreDefault = (key: string) => {
    const def = DEFAULT_SITE_SETTINGS.find((d) => d.key === key);
    if (!def) return;
    setSettings((prev) =>
      prev.map((s) =>
        s.key === key ? { ...s, value: def.value, valueBn: def.valueBn } : s
      )
    );
    setSavedSuccess(false);
    setSaveError(null);
  };

  const handleToggleFooterVisibility = async (item: FooterMenuItem) => {
    setFooterActionError(null);
    try {
      await updateMenuItem(item.id, { visible: !item.visible });
      setFooterMenuItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, visible: !it.visible } : it))
      );
      setFooterActionSuccess(`Updated visibility for "${item.label}".`);
      setTimeout(() => setFooterActionSuccess(null), 3000);
    } catch (err) {
      setFooterActionError(err instanceof Error ? err.message : "Failed to update visibility.");
    }
  };

  const handlePromptDeleteFooterItem = (item: FooterMenuItem) => {
    setConfirmModal({
      title: "Remove this footer link?",
      message: `Are you sure you want to remove "${item.label}" (${item.url}) from the footer navigation? This action will remove it from the footer immediately.`,
      itemName: item.label,
      confirmLabel: "Confirm Remove",
      onConfirm: async () => {
        setFooterActionError(null);
        try {
          await deleteMenuItem(item.id);
          setFooterMenuItems((prev) => prev.filter((it) => it.id !== item.id));
          setConfirmModal(null);
          setFooterActionSuccess(`Removed "${item.label}" from footer.`);
          setTimeout(() => setFooterActionSuccess(null), 3000);
        } catch (err) {
          setFooterActionError(err instanceof Error ? err.message : "Failed to remove footer link.");
        }
      },
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedSuccess(false);
    setSaveError(null);
    try {
      const groupItems = settings.filter((s) => s.group === activeGroup);
      await updateSiteSettingsBulk(groupItems);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (error) {
      setSaveError(
        error instanceof Error && error.message
          ? `Failed to save settings for this group. ${error.message}`
          : "Failed to save settings for this group. Some changes may not have been saved."
      );
    } finally {
      setSaving(false);
    }
  };

  const currentGroupSettings = settings
    .filter((s) => s.group === activeGroup)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const isSocialGroup = activeGroup === "social";
  const isFooterGroup = activeGroup === "footer";

  // Group footer menu items into columns (parents) and links (children)
  const footerColumns = footerMenuItems
    .filter((it) => !it.parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const footerChildrenByParent = new Map<string, FooterMenuItem[]>();
  footerMenuItems
    .filter((it) => it.parentId)
    .forEach((child) => {
      const pId = child.parentId!;
      if (!footerChildrenByParent.has(pId)) {
        footerChildrenByParent.set(pId, []);
      }
      footerChildrenByParent.get(pId)!.push(child);
    });

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading site settings...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Global Site Settings</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage branding, contact information, social profiles, footer content, and site-wide metadata.
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

      {saveError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
          {saveError}
        </div>
      )}

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200 gap-1 mb-8 pb-px">
        {GROUPS.map((g) => {
          const isActive = activeGroup === g.id;
          return (
            <button
              key={g.id}
              onClick={() => {
                startTransition(() => {
                  setActiveGroup(g.id);
                  setSavedSuccess(false);
                  setSaveError(null);
                });
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

      {/* Primary Group Settings List */}
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-xs">
          {currentGroupSettings.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No settings found in this group.
            </div>
          ) : (
            currentGroupSettings.map((item) => {
              const itemDisabled = isSettingDisabled(item.value);
              const cleanVal = getCleanSettingValue(item.value);
              const cleanValBn = getCleanSettingValue(item.valueBn);

              return (
                <div key={item.key} className="p-6 space-y-4">
                  {/* Item Header with Label, Key, Status Badge and Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="text-sm font-bold text-slate-800">
                        {item.label || item.key}
                        {item.labelBn && (
                          <span className="text-slate-400 font-normal ml-2">/ {item.labelBn}</span>
                        )}
                      </label>
                      <span className="text-[11px] font-mono text-slate-400">{item.key}</span>
                      {(isSocialGroup || isFooterGroup) && (
                        itemDisabled ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                            <EyeOff className="w-3 h-3 text-amber-600" /> Disabled / Hidden
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
                          </span>
                        )
                      )}
                    </div>

                    {/* Social & Footer Management Action Buttons */}
                    {(isSocialGroup || isFooterGroup) && (
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleToggleDisabled(item.key)}
                          className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition-colors flex items-center gap-1.5 ${
                            itemDisabled
                              ? "bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                          title={itemDisabled ? "Enable this item" : "Temporarily disable/hide this item"}
                        >
                          {itemDisabled ? (
                            <>
                              <Eye className="w-3.5 h-3.5 text-teal-600" />
                              Enable
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                              Disable
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handlePromptRemoveSetting(item)}
                          className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          title="Remove / Clear this item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRestoreDefault(item.key)}
                          className="px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 font-medium transition-colors flex items-center gap-1"
                          title="Restore default setting value"
                        >
                          <RotateCcw className="w-3 h-3 text-slate-400" />
                          Default
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Informational Banner if Disabled */}
                  {(isSocialGroup || isFooterGroup) && itemDisabled && (
                    <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-800 flex items-center justify-between gap-2">
                      <span>
                        This {isSocialGroup ? "social media link" : "footer item"} is currently <strong>disabled</strong> and will not appear on the public website.
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleDisabled(item.key)}
                        className="text-teal-700 underline font-semibold hover:text-teal-800 shrink-0"
                      >
                        Enable now
                      </button>
                    </div>
                  )}

                  {/* Field Editor */}
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
                          value={cleanVal}
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
                      {cleanVal && (
                        <div className="w-32 h-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={cleanVal} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  ) : item.key === "brand_accent_color" ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={cleanVal.startsWith("#") ? cleanVal : "#0d9488"}
                          onChange={(e) => {
                            handleChange(item.key, "value", e.target.value);
                            handleChange(item.key, "valueBn", e.target.value);
                          }}
                          className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 p-0.5"
                        />
                        <input
                          type="text"
                          value={cleanVal}
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
                            cleanVal === preset.id
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
                          value={cleanVal}
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
                          value={cleanValBn}
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
                          value={cleanVal}
                          onChange={(e) => handleChange(item.key, "value", e.target.value)}
                          placeholder={isSocialGroup ? "https://..." : ""}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                        />
                      </div>
                      <div>
                        <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                          Bengali
                        </span>
                        <input
                          type="text"
                          value={cleanValBn}
                          onChange={(e) => handleChange(item.key, "valueBn", e.target.value)}
                          placeholder={isSocialGroup ? "https://..." : ""}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-bengali"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Navigation Columns & Links Section (Displayed only when Footer tab is active) */}
        {isFooterGroup && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FolderTree className="w-5 h-5 text-teal-600" />
                  Footer Navigation Columns & Links
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Manage individual footer columns and link items. Toggle visibility to hide/disable, or remove links.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/admin/navigation"
                  className="px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  Open Full Navigation Manager
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {footerActionSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                {footerActionSuccess}
              </div>
            )}

            {footerActionError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
                {footerActionError}
              </div>
            )}

            {loadingFooterMenu ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                Loading footer navigation items...
              </div>
            ) : footerMenuItems.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p>No custom footer navigation items found.</p>
                <p className="text-xs text-slate-500 mt-1">
                  Default footer columns (Focus Areas, Organization, Resources, Discover) are rendering from static fallbacks.
                </p>
                <Link
                  href="/admin/navigation"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700 mt-3"
                >
                  Seed or customize in Navigation Manager →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {footerColumns.map((col) => {
                  const children = footerChildrenByParent.get(col.id) || [];
                  return (
                    <div
                      key={col.id}
                      className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50"
                    >
                      {/* Column Header */}
                      <div className="p-4 bg-slate-100/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-slate-500" />
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            {col.label}
                            {col.labelBn && (
                              <span className="text-slate-400 font-normal ml-2">/ {col.labelBn}</span>
                            )}
                          </span>
                          {!col.visible && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              Column Hidden
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <button
                            type="button"
                            onClick={() => handleToggleFooterVisibility(col)}
                            className={`p-1.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1 ${
                              col.visible
                                ? "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                            }`}
                            title={col.visible ? "Hide this entire column" : "Show this column"}
                          >
                            {col.visible ? (
                              <Eye className="w-3.5 h-3.5 text-slate-600" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePromptDeleteFooterItem(col)}
                            className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                            title="Delete this entire footer column"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Nested Links */}
                      {children.length === 0 ? (
                        <div className="p-4 text-xs text-slate-400 text-center">
                          No links in this column.
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100 bg-white">
                          {children.map((child) => (
                            <div
                              key={child.id}
                              className="p-3.5 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 hover:bg-slate-50/50 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-slate-800">
                                  {child.label}
                                </span>
                                {child.labelBn && (
                                  <span className="text-xs text-slate-400 font-normal">
                                    / {child.labelBn}
                                  </span>
                                )}
                                <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                                  {child.url}
                                </span>
                                {!child.visible && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                    Hidden
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 self-start sm:self-auto">
                                <button
                                  type="button"
                                  onClick={() => handleToggleFooterVisibility(child)}
                                  className={`p-1.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1 ${
                                    child.visible
                                      ? "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                      : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                                  }`}
                                  title={child.visible ? "Hide this link from footer" : "Show this link"}
                                >
                                  {child.visible ? (
                                    <Eye className="w-3.5 h-3.5 text-slate-600" />
                                  ) : (
                                    <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handlePromptDeleteFooterItem(child)}
                                  className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                  title="Remove this footer link"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
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

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">{confirmModal.title}</h3>
                {confirmModal.itemName && (
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{confirmModal.itemName}</p>
                )}
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{confirmModal.message}</p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
              >
                {confirmModal.confirmLabel || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

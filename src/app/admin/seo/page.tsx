"use client";

import { useState, useEffect } from "react";
import { Search, Share2, Globe, Save, CheckCircle, Image as ImageIcon } from "lucide-react";
import MediaPickerModal from "@/components/admin/MediaPickerModal";

interface Setting {
  id: string;
  key: string;
  value: string;
  valueBn: string;
  type: string;
  group: string;
  label: string;
}

export default function SEOAdmin() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings?group=seo")
      .then((r) => r.json())
      .then((d) => {
        setSettings(d.settings || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getVal = (key: string, bn = false) => {
    const s = settings.find((x) => x.key === key);
    return s ? (bn ? s.valueBn || s.value : s.value) : "";
  };

  const updateVal = (key: string, val: string, bn = false) => {
    setSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, [bn ? "valueBn" : "value"]: val } : s))
    );
  };

  const saveSetting = async (setting: Setting) => {
    setSavingKey(setting.key);
    try {
      await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(setting),
      });
      setSavedKey(setting.key);
      setTimeout(() => setSavedKey(null), 2500);
    } catch {
      alert(`Failed to save ${setting.key}`);
    } finally {
      setSavingKey(null);
    }
  };

  const saveAll = async () => {
    setSavingKey("all");
    try {
      for (const s of settings) {
        await fetch("/api/admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(s),
        });
      }
      setSavedKey("all");
      setTimeout(() => setSavedKey(null), 2500);
    } catch {
      alert("Failed to save some settings");
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-slate-400 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mr-3" />
        Loading SEO configuration...
      </div>
    );
  }

  const metaTitle = getVal("seo_meta_title") || "LENS — Youth, Technology & Society";
  const metaDescription =
    getVal("seo_meta_description") ||
    "Empowering youth and advancing evidence-based research and digital policy in Bangladesh.";
  const ogImage = getVal("seo_og_image") || "/og?title=LENS&subtitle=Lighthouse+for+Evolving+Narrative+Systems";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL && /^https?:\/\//.test(process.env.NEXT_PUBLIC_SITE_URL)
    ? process.env.NEXT_PUBLIC_SITE_URL
    : "https://www.lensbd.org";

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Globe className="w-6 h-6 text-teal-400" />
            SEO & Metadata Control Center
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Configure global search engine rankings, Open Graph cards, and social sharing previews.
          </p>
        </div>
        <button
          onClick={saveAll}
          disabled={savingKey === "all"}
          className="px-5 py-2.5 bg-teal-500 text-white rounded-lg text-sm font-semibold hover:bg-teal-400 transition-colors flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
        >
          {savedKey === "all" ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-200" />
              All Saved!
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {savingKey === "all" ? "Saving..." : "Save All SEO Settings"}
            </>
          )}
        </button>
      </div>

      {/* Visual Live Previews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Google SERP Preview */}
        <div className="p-5 rounded-2xl bg-[#0b121e] border border-white/10 shadow-lg">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">
            <Search className="w-4 h-4 text-blue-400" />
            Google Search Snippet Preview
          </div>
          <div className="bg-[#1f2124] p-4 rounded-xl border border-white/5 font-sans">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-4 rounded-full bg-teal-500/30 flex items-center justify-center text-[9px] text-teal-300 font-bold">
                L
              </div>
              <div className="text-xs text-[#bdc1c6] truncate">{siteUrl}</div>
            </div>
            <h3 className="text-base text-[#8ab4f8] hover:underline cursor-pointer font-medium line-clamp-1 leading-snug">
              {metaTitle}
            </h3>
            <p className="text-xs text-[#bdc1c6] mt-1 line-clamp-2 leading-relaxed">
              {metaDescription}
            </p>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Characters: Title ({metaTitle.length}/60 optimal) · Description ({metaDescription.length}/160 optimal)
          </p>
        </div>

        {/* Social Card Preview */}
        <div className="p-5 rounded-2xl bg-[#0b121e] border border-white/10 shadow-lg">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">
            <Share2 className="w-4 h-4 text-teal-400" />
            Social Media Card Preview (Facebook/Twitter/LinkedIn)
          </div>
          <div className="bg-[#1a2332] rounded-xl overflow-hidden border border-white/10">
            <div className="w-full h-32 bg-black/40 overflow-hidden relative">
              {ogImage ? (
                <img src={ogImage} alt="OG Card" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">
                  No OG Image Selected
                </div>
              )}
            </div>
            <div className="p-3">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">lensbd.org</span>
              <h4 className="text-sm font-semibold text-white truncate mt-0.5">{metaTitle}</h4>
              <p className="text-xs text-slate-300 line-clamp-2 mt-1">{metaDescription}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Structured SEO Settings Form */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">Global SEO Configuration</h2>

        {settings.map((s) => (
          <div
            key={s.key}
            className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all space-y-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-semibold text-white">{s.label || s.key}</label>
                <span className="text-xs text-slate-500 font-mono ml-2">({s.key})</span>
              </div>
              <div className="flex items-center gap-2">
                {savedKey === s.key && (
                  <span className="text-xs text-green-400 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Saved
                  </span>
                )}
                {savingKey === s.key && <span className="text-xs text-teal-400">Saving...</span>}
                <button
                  type="button"
                  onClick={() => saveSetting(s)}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-xs font-medium transition-colors"
                >
                  Save
                </button>
              </div>
            </div>

            {s.key === "seo_og_image" ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={s.value}
                  onChange={(e) => updateVal(s.key, e.target.value)}
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                  placeholder="https://www.lensbd.org/og-image.png"
                />
                <button
                  type="button"
                  onClick={() => setShowMediaPicker(true)}
                  className="px-3 py-2 bg-teal-500/10 border border-teal-500/30 text-teal-400 rounded-lg text-sm hover:bg-teal-500/20 transition-colors flex items-center gap-1.5"
                >
                  <ImageIcon className="w-4 h-4" />
                  Media Library
                </button>
              </div>
            ) : s.key.includes("description") ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">English Value</span>
                  <textarea
                    rows={2}
                    value={s.value}
                    onChange={(e) => updateVal(s.key, e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 resize-none"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">Bangla Value (বাংলা)</span>
                  <textarea
                    rows={2}
                    value={s.valueBn}
                    onChange={(e) => updateVal(s.key, e.target.value, true)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 resize-none font-bangla"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">English Value</span>
                  <input
                    type="text"
                    value={s.value}
                    onChange={(e) => updateVal(s.key, e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">Bangla Value (বাংলা)</span>
                  <input
                    type="text"
                    value={s.valueBn}
                    onChange={(e) => updateVal(s.key, e.target.value, true)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 font-bangla"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Media Picker for OG Image */}
      <MediaPickerModal
        open={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={(url) => {
          updateVal("og_image", url);
          setShowMediaPicker(false);
        }}
      />
    </div>
  );
}

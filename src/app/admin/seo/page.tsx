"use client";

import { useState, useEffect } from "react";

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
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings?group=seo").then(r => r.json()).then(d => { setSettings(d.settings || []); setLoading(false); });
  }, []);

  const save = async (setting: Setting) => {
    setSaving(setting.key);
    await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(setting) });
    setSaving(null);
  };

  if (loading) return <div className="p-6 text-slate-400">Loading SEO settings...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">SEO Control Panel</h1>
      <p className="text-slate-400 text-sm mb-6">Manage page titles, meta descriptions, OG images, and keywords for each page.</p>
      <div className="space-y-4">
        {settings.map(s => (
          <div key={s.key} className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-white">{s.label || s.key}</label>
              {saving === s.key && <span className="text-xs text-teal-400">Saving...</span>}
            </div>
            <input value={s.value} onChange={e => setSettings(prev => prev.map(x => x.key === s.key ? { ...x, value: e.target.value } : x))} onBlur={() => save(s)} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm mb-2" placeholder="English value" />
            <input value={s.valueBn} onChange={e => setSettings(prev => prev.map(x => x.key === s.key ? { ...x, valueBn: e.target.value } : x))} onBlur={() => save(s)} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm" placeholder="Bangla value" />
          </div>
        ))}
      </div>
    </div>
  );
}

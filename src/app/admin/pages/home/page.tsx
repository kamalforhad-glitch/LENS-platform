"use client";

import { useState, useEffect } from "react";

interface Section {
  id: string;
  type: string;
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  sortOrder: number;
  visible: boolean;
  settings: string;
  content: string;
  contentBn: string;
}

export default function HomepageCMS() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [pageId, setPageId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/pages?slug=home").then(r => r.json()).then(d => {
      if (d.page) {
        setPageId(d.page.id);
        setSections(d.page.sections || []);
      }
      setLoading(false);
    });
  }, []);

  const saveSection = async (section: Section) => {
    setSaving(true);
    await fetch("/api/admin/pages/sections", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(section),
    });
    setSections(prev => prev.map(s => s.id === section.id ? section : s));
    setEditingSection(null);
    setSaving(false);
  };

  const toggleVisibility = async (section: Section) => {
    const updated = { ...section, visible: !section.visible };
    await saveSection(updated);
  };

  const sectionTypes: Record<string, string> = {
    hero: "Hero Section",
    text: "Text Block",
    cards: "Cards Grid",
    image: "Image Section",
    stats: "Statistics",
    timeline: "Timeline",
    cta: "Call to Action",
    newsletter: "Newsletter",
    gallery: "Gallery",
  };

  if (loading) return <div className="p-6 text-slate-400">Loading homepage...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Homepage CMS</h1>
      <p className="text-slate-400 text-sm mb-6">Manage homepage sections. Drag to reorder, toggle visibility, or edit content in English and Bangla.</p>
      
      <div className="space-y-3">
        {sections.sort((a, b) => a.sortOrder - b.sortOrder).map((section) => (
          <div key={section.id} className={`p-4 rounded-xl border transition-all ${section.visible ? "bg-white/5 border-white/10" : "bg-white/[0.02] border-white/5 opacity-50"}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-400 font-medium">{sectionTypes[section.type] || section.type}</span>
                <span className="text-white font-medium">{section.title || "Untitled"}</span>
                {section.titleBn && <span className="text-slate-500 text-sm">/ {section.titleBn}</span>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleVisibility(section)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${section.visible ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" : "bg-slate-500/20 text-slate-400 hover:bg-slate-500/30"}`}>
                  {section.visible ? "Visible" : "Hidden"}
                </button>
                <button onClick={() => setEditingSection(section)} className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white hover:bg-white/20 transition-colors">Edit</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editingSection && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setEditingSection(null)}>
          <div className="bg-navy-900 rounded-2xl border border-white/10 w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-4">Edit Section: {sectionTypes[editingSection.type]}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Title (English)</label>
                <input value={editingSection.title} onChange={e => setEditingSection({ ...editingSection, title: e.target.value })} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Title (Bangla)</label>
                <input value={editingSection.titleBn} onChange={e => setEditingSection({ ...editingSection, titleBn: e.target.value })} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Description (English)</label>
                <textarea value={editingSection.description} onChange={e => setEditingSection({ ...editingSection, description: e.target.value })} rows={3} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm resize-none" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Description (Bangla)</label>
                <textarea value={editingSection.descriptionBn} onChange={e => setEditingSection({ ...editingSection, descriptionBn: e.target.value })} rows={3} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm resize-none" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Content JSON</label>
                <textarea value={editingSection.content} onChange={e => setEditingSection({ ...editingSection, content: e.target.value })} rows={6} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm font-mono resize-none" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Content JSON (Bangla)</label>
                <textarea value={editingSection.contentBn} onChange={e => setEditingSection({ ...editingSection, contentBn: e.target.value })} rows={6} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm font-mono resize-none" />
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setEditingSection(null)} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
                <button onClick={() => saveSection(editingSection)} disabled={saving} className="px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-400 disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

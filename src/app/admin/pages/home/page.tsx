"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getPageBySlug, updateSection, reorderSections } from "@/lib/actions/cms";

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

const SECTION_LABELS: Record<string, string> = {
  hero: "Hero Section",
  focus: "Focus Areas & Cards",
  featured_research: "Featured Research & Highlights",
  impact: "Impact Statistics",
  events_newsletter: "Events & Newsletter",
};

export default function HomepageCMS() {
  const [sections, setSections] = useState<Section[]>([]);
  const [pageId, setPageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<{
    title: string;
    titleBn: string;
    description: string;
    descriptionBn: string;
    content: Record<string, unknown>;
    contentBn: Record<string, unknown>;
  } | null>(null);

  const loadData = async () => {
    try {
      const page = await getPageBySlug("home");
      if (page) {
        setPageId(page.id);
        setSections(page.sections as Section[]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openEdit = (section: Section) => {
    let contentObj = {};
    let contentBnObj = {};
    try { contentObj = JSON.parse(section.content || "{}"); } catch { /* ignore */ }
    try { contentBnObj = JSON.parse(section.contentBn || "{}"); } catch { /* ignore */ }

    setEditingId(section.id);
    setEditFormData({
      title: section.title,
      titleBn: section.titleBn,
      description: section.description,
      descriptionBn: section.descriptionBn,
      content: contentObj,
      contentBn: contentBnObj,
    });
  };

  const handleSaveSection = async (sectionId: string) => {
    if (!editFormData) return;
    setSavingId(sectionId);
    try {
      await updateSection(sectionId, {
        title: editFormData.title,
        titleBn: editFormData.titleBn,
        description: editFormData.description,
        descriptionBn: editFormData.descriptionBn,
        content: JSON.stringify(editFormData.content),
        contentBn: JSON.stringify(editFormData.contentBn),
      });

      setSections((prev) =>
        prev.map((s) =>
          s.id === sectionId
            ? {
                ...s,
                title: editFormData.title,
                titleBn: editFormData.titleBn,
                description: editFormData.description,
                descriptionBn: editFormData.descriptionBn,
                content: JSON.stringify(editFormData.content),
                contentBn: JSON.stringify(editFormData.contentBn),
              }
            : s
        )
      );
      setEditingId(null);
      setEditFormData(null);
    } finally {
      setSavingId(null);
    }
  };

  const toggleVisibility = async (section: Section) => {
    const updated = !section.visible;
    await updateSection(section.id, { visible: updated });
    setSections((prev) =>
      prev.map((s) => (s.id === section.id ? { ...s, visible: updated } : s))
    );
  };

  const moveSection = async (index: number, direction: "up" | "down") => {
    if (!pageId) return;
    const newIdx = direction === "up" ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= sections.length) return;

    const reordered = [...sections];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIdx, 0, moved);

    setSections(reordered);
    await reorderSections(
      pageId,
      reordered.map((s) => s.id)
    );
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading Homepage CMS...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Landing Page Editor</h1>
          <p className="text-sm text-slate-500 mt-1">
            Customize non-animated content, headlines, statistics, and cards for the homepage.
          </p>
        </div>
        <Link
          href="/"
          target="_blank"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors shrink-0"
        >
          View Public Homepage
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </Link>
      </div>

      <div className="space-y-4">
        {sections.map((section, idx) => {
          const isEditing = editingId === section.id;
          const label = SECTION_LABELS[section.type] || section.title || section.type;

          return (
            <div
              key={section.id}
              className={`rounded-2xl border transition-all ${
                section.visible
                  ? "bg-white border-slate-200 shadow-xs"
                  : "bg-slate-50 border-slate-200 opacity-60"
              }`}
            >
              {/* Section Header Row */}
              <div className="flex items-center justify-between p-5">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs px-2.5 py-1 rounded-md bg-teal-50 text-teal-700 font-bold uppercase tracking-wider shrink-0">
                    {section.type}
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-slate-900 truncate">{label}</h2>
                    <p className="text-xs text-slate-400 truncate">{section.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Reorder Buttons */}
                  <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                    <button
                      onClick={() => moveSection(idx, "up")}
                      disabled={idx === 0}
                      className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-200 disabled:opacity-30 transition-colors"
                      title="Move Up"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveSection(idx, "down")}
                      disabled={idx === sections.length - 1}
                      className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-200 disabled:opacity-30 transition-colors"
                      title="Move Down"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* Visibility Button */}
                  <button
                    onClick={() => toggleVisibility(section)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      section.visible
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                        : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200"
                    }`}
                  >
                    {section.visible ? "Visible" : "Hidden"}
                  </button>

                  {/* Edit Toggle */}
                  <button
                    onClick={() => (isEditing ? setEditingId(null) : openEdit(section))}
                    className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    {isEditing ? "Close" : "Edit Content"}
                  </button>
                </div>
              </div>

              {/* Editing Form */}
              {isEditing && editFormData && (
                <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-6">
                  {/* Hero Section Form */}
                  {section.type === "hero" && (
                    <div className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Badge (EN)</label>
                          <input
                            type="text"
                            value={(editFormData.content.badge as string) || ""}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                content: { ...editFormData.content, badge: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Badge (BN)</label>
                          <input
                            type="text"
                            value={(editFormData.contentBn.badge as string) || ""}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                contentBn: { ...editFormData.contentBn, badge: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bengali"
                          />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Brand Line (EN)</label>
                          <input
                            type="text"
                            value={(editFormData.content.brandLine as string) || ""}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                content: { ...editFormData.content, brandLine: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Brand Line (BN)</label>
                          <input
                            type="text"
                            value={(editFormData.contentBn.brandLine as string) || ""}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                contentBn: { ...editFormData.contentBn, brandLine: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bengali"
                          />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description (EN)</label>
                          <textarea
                            rows={3}
                            value={(editFormData.content.description as string) || ""}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                content: { ...editFormData.content, description: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm resize-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description (BN)</label>
                          <textarea
                            rows={3}
                            value={(editFormData.contentBn.description as string) || ""}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                contentBn: { ...editFormData.contentBn, description: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm resize-none font-bengali"
                          />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Primary CTA Text</label>
                          <input
                            type="text"
                            value={(editFormData.content.primaryCtaText as string) || ""}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                content: { ...editFormData.content, primaryCtaText: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Primary CTA Link</label>
                          <input
                            type="text"
                            value={(editFormData.content.primaryCtaLink as string) || ""}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                content: { ...editFormData.content, primaryCtaLink: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Focus Areas Form */}
                  {section.type === "focus" && (
                    <div className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Section Title (EN)</label>
                          <input
                            type="text"
                            value={(editFormData.content.sectionTitle as string) || ""}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                content: { ...editFormData.content, sectionTitle: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Section Title (BN)</label>
                          <input
                            type="text"
                            value={(editFormData.contentBn.sectionTitle as string) || ""}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                contentBn: { ...editFormData.contentBn, sectionTitle: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bengali"
                          />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Section Description (EN)</label>
                          <textarea
                            rows={2}
                            value={(editFormData.content.sectionDescription as string) || ""}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                content: { ...editFormData.content, sectionDescription: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm resize-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Section Description (BN)</label>
                          <textarea
                            rows={2}
                            value={(editFormData.contentBn.sectionDescription as string) || ""}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                contentBn: { ...editFormData.contentBn, sectionDescription: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm resize-none font-bengali"
                          />
                        </div>
                      </div>

                      {/* Focus Cards List */}
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <h4 className="text-xs font-bold text-slate-700 uppercase mb-3">Focus Area Cards (8 Focus Items)</h4>
                        <div className="space-y-3">
                          {Array.isArray(editFormData.content.cards) &&
                            (editFormData.content.cards as Array<Record<string, unknown>>).map((card, cardIdx) => {
                              const cardBn = Array.isArray(editFormData.contentBn.cards)
                                ? (editFormData.contentBn.cards as Array<Record<string, unknown>>)[cardIdx] || {}
                                : {};

                              return (
                                <div key={cardIdx} className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-800">
                                      Card #{cardIdx + 1}: {String(card.title || card.key)}
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-400">{String(card.key)}</span>
                                  </div>
                                  <div className="grid sm:grid-cols-2 gap-3">
                                    <input
                                      type="text"
                                      placeholder="Title (English)"
                                      value={String(card.title || "")}
                                      onChange={(e) => {
                                        const newCards = [...(editFormData.content.cards as Array<Record<string, unknown>>)];
                                        newCards[cardIdx] = { ...newCards[cardIdx], title: e.target.value };
                                        setEditFormData({ ...editFormData, content: { ...editFormData.content, cards: newCards } });
                                      }}
                                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Title (Bengali)"
                                      value={String(cardBn.title || "")}
                                      onChange={(e) => {
                                        const newCards = Array.isArray(editFormData.contentBn.cards)
                                          ? [...(editFormData.contentBn.cards as Array<Record<string, unknown>>)]
                                          : [];
                                        newCards[cardIdx] = { ...newCards[cardIdx], title: e.target.value };
                                        setEditFormData({ ...editFormData, contentBn: { ...editFormData.contentBn, cards: newCards } });
                                      }}
                                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bengali"
                                    />
                                  </div>
                                  <div className="grid sm:grid-cols-2 gap-3">
                                    <textarea
                                      rows={2}
                                      placeholder="Description (English)"
                                      value={String(card.description || "")}
                                      onChange={(e) => {
                                        const newCards = [...(editFormData.content.cards as Array<Record<string, unknown>>)];
                                        newCards[cardIdx] = { ...newCards[cardIdx], description: e.target.value };
                                        setEditFormData({ ...editFormData, content: { ...editFormData.content, cards: newCards } });
                                      }}
                                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs resize-none"
                                    />
                                    <textarea
                                      rows={2}
                                      placeholder="Description (Bengali)"
                                      value={String(cardBn.description || "")}
                                      onChange={(e) => {
                                        const newCards = Array.isArray(editFormData.contentBn.cards)
                                          ? [...(editFormData.contentBn.cards as Array<Record<string, unknown>>)]
                                          : [];
                                        newCards[cardIdx] = { ...newCards[cardIdx], description: e.target.value };
                                        setEditFormData({ ...editFormData, contentBn: { ...editFormData.contentBn, cards: newCards } });
                                      }}
                                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs resize-none font-bengali"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Impact Stats Form */}
                  {section.type === "impact" && (
                    <div className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Section Title (EN)</label>
                          <input
                            type="text"
                            value={(editFormData.content.sectionTitle as string) || ""}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                content: { ...editFormData.content, sectionTitle: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Section Title (BN)</label>
                          <input
                            type="text"
                            value={(editFormData.contentBn.sectionTitle as string) || ""}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                contentBn: { ...editFormData.contentBn, sectionTitle: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bengali"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700 uppercase">Impact Number Counters (4 metrics)</label>
                        {Array.isArray(editFormData.content.stats) &&
                          (editFormData.content.stats as Array<Record<string, unknown>>).map((st, sIdx) => {
                            const stBn = Array.isArray(editFormData.contentBn.stats)
                              ? (editFormData.contentBn.stats as Array<Record<string, unknown>>)[sIdx] || {}
                              : {};

                            return (
                              <div key={sIdx} className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 bg-white rounded-xl border border-slate-200 items-center">
                                <div>
                                  <label className="block text-[10px] text-slate-400 uppercase font-semibold">Value</label>
                                  <input
                                    type="number"
                                    value={Number(st.value || 0)}
                                    onChange={(e) => {
                                      const newStats = [...(editFormData.content.stats as Array<Record<string, unknown>>)];
                                      newStats[sIdx] = { ...newStats[sIdx], value: parseInt(e.target.value) || 0 };
                                      setEditFormData({ ...editFormData, content: { ...editFormData.content, stats: newStats } });
                                    }}
                                    className="w-full px-2 py-1 border border-slate-200 rounded text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-slate-400 uppercase font-semibold">Suffix</label>
                                  <input
                                    type="text"
                                    value={String(st.suffix || "+")}
                                    onChange={(e) => {
                                      const newStats = [...(editFormData.content.stats as Array<Record<string, unknown>>)];
                                      newStats[sIdx] = { ...newStats[sIdx], suffix: e.target.value };
                                      setEditFormData({ ...editFormData, content: { ...editFormData.content, stats: newStats } });
                                    }}
                                    className="w-full px-2 py-1 border border-slate-200 rounded text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-slate-400 uppercase font-semibold">Label (English)</label>
                                  <input
                                    type="text"
                                    value={String(st.label || "")}
                                    onChange={(e) => {
                                      const newStats = [...(editFormData.content.stats as Array<Record<string, unknown>>)];
                                      newStats[sIdx] = { ...newStats[sIdx], label: e.target.value };
                                      setEditFormData({ ...editFormData, content: { ...editFormData.content, stats: newStats } });
                                    }}
                                    className="w-full px-2 py-1 border border-slate-200 rounded text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-slate-400 uppercase font-semibold">Label (Bengali)</label>
                                  <input
                                    type="text"
                                    value={String(stBn.label || "")}
                                    onChange={(e) => {
                                      const newStatsBn = Array.isArray(editFormData.contentBn.stats)
                                        ? [...(editFormData.contentBn.stats as Array<Record<string, unknown>>)]
                                        : [];
                                      newStatsBn[sIdx] = { ...newStatsBn[sIdx], label: e.target.value };
                                      setEditFormData({ ...editFormData, contentBn: { ...editFormData.contentBn, stats: newStatsBn } });
                                    }}
                                    className="w-full px-2 py-1 border border-slate-200 rounded text-xs font-bengali"
                                  />
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Featured Research Form */}
                  {section.type === "featured_research" && (
                    <div className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Section Label (EN)</label>
                          <input
                            type="text"
                            value={(editFormData.content.sectionLabel as string) || ""}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                content: { ...editFormData.content, sectionLabel: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Latest List Heading (EN)</label>
                          <input
                            type="text"
                            value={(editFormData.content.latestPublicationsHeading as string) || ""}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                content: { ...editFormData.content, latestPublicationsHeading: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Events & Newsletter Form */}
                  {section.type === "events_newsletter" && (
                    <div className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Newsletter Title (EN)</label>
                          <input
                            type="text"
                            value={(editFormData.content.newsletterTitle as string) || ""}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                content: { ...editFormData.content, newsletterTitle: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Newsletter Title (BN)</label>
                          <input
                            type="text"
                            value={(editFormData.contentBn.newsletterTitle as string) || ""}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                contentBn: { ...editFormData.contentBn, newsletterTitle: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bengali"
                          />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Newsletter Description (EN)</label>
                          <textarea
                            rows={2}
                            value={(editFormData.content.newsletterDescription as string) || ""}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                content: { ...editFormData.content, newsletterDescription: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm resize-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Newsletter Description (BN)</label>
                          <textarea
                            rows={2}
                            value={(editFormData.contentBn.newsletterDescription as string) || ""}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                contentBn: { ...editFormData.contentBn, newsletterDescription: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm resize-none font-bengali"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="px-4 py-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveSection(section.id)}
                      disabled={savingId === section.id}
                      className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
                    >
                      {savingId === section.id ? "Saving..." : "Save Section"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

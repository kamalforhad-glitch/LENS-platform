"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  getPageBySlug,
  updateSection,
  createSection,
  deleteSection,
  duplicateSection,
  reorderSections,
  updatePage,
} from "@/lib/actions/cms";
import { firstUsable } from "@/lib/cms-content";
import MediaPickerModal from "@/components/admin/MediaPickerModal";
import { SECTION_TYPE_DEFS } from "@/components/admin/PageSectionEditor";

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
  logo_cloud: "Partner Logos",
  testimonial: "Testimonials",
  cards: "Card Grid",
  cta: "Call to Action",
  rich_text: "Rich Text",
  gallery: "Image Gallery",
  faq: "FAQ Accordion",
  timeline: "Timeline",
  video: "Video Block",
};

function prefillEditorKeys(obj: Record<string, unknown>, pairs: Array<[string, string]>) {
  for (const [editorKey, legacyKey] of pairs) {
    if (firstUsable(obj, [editorKey]) !== undefined) continue;
    const legacy = firstUsable(obj, [legacyKey]);
    if (legacy !== undefined && typeof legacy !== "object") obj[editorKey] = legacy;
  }
}

const HERO_PAIRS: Array<[string, string]> = [
  ["brandLine", "brand"],
  ["primaryCtaText", "cta_research"],
  ["secondaryCtaText", "cta_publications"],
];
const SECTION_TEXT_PAIRS: Array<[string, string]> = [
  ["sectionLabel", "badge"],
  ["sectionTitle", "title"],
  ["sectionDescription", "description"],
];
const NEWSLETTER_PAIRS: Array<[string, string]> = [
  ["newsletterTitle", "newsletter_title"],
  ["newsletterDescription", "newsletter_subtitle"],
];

export default function HomepageCMS() {
  const [sections, setSections] = useState<Section[]>([]);
  const [pageId, setPageId] = useState<string | null>(null);
  const [pageStatus, setPageStatus] = useState<string>("published");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [languageMode, setLanguageMode] = useState<"all" | "en" | "bn">("all");
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<string | null>(null);

  const [editFormData, setEditFormData] = useState<{
    title: string;
    titleBn: string;
    description: string;
    descriptionBn: string;
    content: Record<string, unknown>;
    contentBn: Record<string, unknown>;
    settings: Record<string, unknown>;
  } | null>(null);

  const loadData = () => {
    getPageBySlug("home")
      .then((page) => {
        if (page) {
          setPageId(page.id);
          setPageStatus((page as unknown as { status?: string }).status || "published");
          setSections(page.sections as Section[]);
        } else {
          setSections([]);
        }
        setLoadError(null);
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : "Failed to load the homepage sections.");
        setSections([]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const retryLoad = () => {
    setLoading(true);
    setLoadError(null);
    loadData();
  };

  const openEdit = (section: Section) => {
    let contentObj: Record<string, unknown> = {};
    let contentBnObj: Record<string, unknown> = {};
    let settingsObj: Record<string, unknown> = {};

    try {
      const parsed = JSON.parse(section.content || "{}");
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) contentObj = parsed;
    } catch { /* ignore */ }
    try {
      const parsedBn = JSON.parse(section.contentBn || "{}");
      if (parsedBn && typeof parsedBn === "object" && !Array.isArray(parsedBn)) contentBnObj = parsedBn;
    } catch { /* ignore */ }
    try {
      const parsedSettings = JSON.parse(section.settings || "{}");
      if (parsedSettings && typeof parsedSettings === "object" && !Array.isArray(parsedSettings)) settingsObj = parsedSettings;
    } catch { /* ignore */ }

    if (section.type === "hero") {
      prefillEditorKeys(contentObj, HERO_PAIRS);
      prefillEditorKeys(contentBnObj, HERO_PAIRS);
    } else if (section.type === "focus" || section.type === "impact" || section.type === "featured_research") {
      prefillEditorKeys(contentObj, SECTION_TEXT_PAIRS);
      prefillEditorKeys(contentBnObj, SECTION_TEXT_PAIRS);
    } else if (section.type === "events_newsletter") {
      prefillEditorKeys(contentObj, SECTION_TEXT_PAIRS);
      prefillEditorKeys(contentBnObj, SECTION_TEXT_PAIRS);
      prefillEditorKeys(contentObj, NEWSLETTER_PAIRS);
      prefillEditorKeys(contentBnObj, NEWSLETTER_PAIRS);
    }

    setEditingId(section.id);
    setEditFormData({
      title: section.title,
      titleBn: section.titleBn,
      description: section.description,
      descriptionBn: section.descriptionBn,
      content: contentObj,
      contentBn: contentBnObj,
      settings: settingsObj,
    });
  };

  const handleSaveSection = async (sectionId: string) => {
    if (!editFormData) return;
    setSavingId(sectionId);
    setSaveError(null);
    setSuccessMsg(null);
    try {
      await updateSection(sectionId, {
        title: editFormData.title,
        titleBn: editFormData.titleBn,
        description: editFormData.description,
        descriptionBn: editFormData.descriptionBn,
        content: JSON.stringify(editFormData.content),
        contentBn: JSON.stringify(editFormData.contentBn),
        settings: JSON.stringify(editFormData.settings),
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
                settings: JSON.stringify(editFormData.settings),
              }
            : s
        )
      );
      setEditingId(null);
      setEditFormData(null);
      setSuccessMsg("Section changes saved successfully.");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingId(null);
    }
  };

  const toggleVisibility = async (section: Section) => {
    const updated = !section.visible;
    try {
      await updateSection(section.id, { visible: updated });
      setSections((prev) =>
        prev.map((s) => (s.id === section.id ? { ...s, visible: updated } : s))
      );
      setSaveError(null);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not change visibility");
    }
  };

  const moveSection = async (index: number, direction: "up" | "down") => {
    if (!pageId) return;
    const newIdx = direction === "up" ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= sections.length) return;

    const reordered = [...sections];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIdx, 0, moved);

    setSections(reordered);
    try {
      await reorderSections(
        pageId,
        reordered.map((s) => s.id)
      );
      setSaveError(null);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Reorder failed");
      await loadData();
    }
  };

  const handleAddSection = async (type: string) => {
    if (!pageId) return;
    setShowAddMenu(false);
    setLoading(true);
    try {
      const typeDef = SECTION_TYPE_DEFS.find((t) => t.type === type);
      const title = typeDef ? typeDef.label : type;
      await createSection(pageId, {
        type,
        title,
        titleBn: title,
        visible: true,
        content: JSON.stringify({}),
        contentBn: JSON.stringify({}),
      });
      await loadData();
      setSuccessMsg(`Added new ${title} section.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not add section");
      setLoading(false);
    }
  };

  const handleDeleteSection = async (section: Section) => {
    if (section.type === "hero") {
      alert("The Hero section is essential to the homepage layout and cannot be deleted.");
      return;
    }
    if (!confirm(`Are you sure you want to delete the "${section.title || section.type}" section?`)) return;
    try {
      await deleteSection(section.id);
      setSections((prev) => prev.filter((s) => s.id !== section.id));
      if (editingId === section.id) setEditingId(null);
      setSuccessMsg("Section removed.");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const handleDuplicateSection = async (section: Section) => {
    try {
      await duplicateSection(section.id);
      await loadData();
      setSuccessMsg(`Duplicated "${section.title || section.type}".`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Duplicate failed");
    }
  };

  const handleTogglePublish = async () => {
    if (!pageId) return;
    const nextStatus = pageStatus === "published" ? "draft" : "published";
    setPublishing(true);
    setSaveError(null);
    try {
      await updatePage(pageId, { status: nextStatus });
      setPageStatus(nextStatus);
      setSuccessMsg(`Homepage status changed to ${nextStatus.toUpperCase()}.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Status update failed");
    } finally {
      setPublishing(false);
    }
  };

  const onMediaPick = (url: string) => {
    if (!pickerTarget || !editFormData) return;
    const [section, fieldName] = pickerTarget.split(":");
    void section;
    setEditFormData({
      ...editFormData,
      content: { ...editFormData.content, [fieldName]: url },
    });
    setPickerTarget(null);
  };

  const totalTranslatedPct = useMemo(() => {
    if (sections.length === 0) return 100;
    let totalScore = 0;
    let currentScore = 0;

    for (const sec of sections) {
      totalScore += 2; // title & description
      if (sec.titleBn && sec.titleBn.trim()) currentScore += 1;
      if (sec.descriptionBn && sec.descriptionBn.trim()) currentScore += 1;

      try {
        const c = JSON.parse(sec.content || "{}");
        const cBn = JSON.parse(sec.contentBn || "{}");
        const keys = Object.keys(c).filter((k) => typeof c[k] === "string" && (c[k] as string).trim());
        totalScore += keys.length;
        for (const k of keys) {
          if (typeof cBn[k] === "string" && (cBn[k] as string).trim()) currentScore += 1;
        }
      } catch { /* ignore */ }
    }
    if (totalScore === 0) return 100;
    return Math.round((currentScore / totalScore) * 100);
  }, [sections]);

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading Homepage CMS...</div>;
  }

  if (loadError) {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-semibold text-red-700 mb-3">Failed to load homepage sections</p>
          <p className="text-xs text-red-600 mb-4">{loadError}</p>
          <button
            type="button"
            onClick={retryLoad}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Banner & Workflow Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Homepage CMS Builder</h1>
            <span
              className={`px-3 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                pageStatus === "published"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              {pageStatus}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage hero background video &amp; media, copy, interactive section sequence, and bilingual translations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {pageId && (
            <Link
              href={`/admin/preview/${pageId}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
            >
              <span>Preview Draft</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </Link>
          )}

          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            <span>Live Site</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>

          <button
            type="button"
            onClick={handleTogglePublish}
            disabled={publishing}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all shadow-xs ${
              pageStatus === "published"
                ? "bg-amber-600 hover:bg-amber-700 text-white"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            } disabled:opacity-50`}
          >
            {publishing
              ? "Updating…"
              : pageStatus === "published"
              ? "Revert to Draft"
              : "Publish Homepage"}
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAddMenu((v) => !v)}
              className="inline-flex items-center gap-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
            >
              <span>+ Add Section</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showAddMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1 divide-y divide-slate-100">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Section Type
                </div>
                <div className="py-1">
                  {[
                    { type: "focus", label: "Focus Areas Grid" },
                    { type: "impact", label: "Impact Statistics" },
                    { type: "featured_research", label: "Featured Highlights" },
                    { type: "events_newsletter", label: "Events & Newsletter" },
                    { type: "logo_cloud", label: "Partner Logos" },
                    { type: "testimonial", label: "Testimonials" },
                    { type: "cta", label: "Call to Action Banner" },
                    { type: "cards", label: "Custom Cards Grid" },
                    { type: "gallery", label: "Image Gallery" },
                    { type: "faq", label: "FAQ Accordion" },
                    { type: "timeline", label: "Timeline" },
                  ].map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => handleAddSection(item.type)}
                      className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-teal-50 hover:text-teal-800 transition-colors"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Language filter and translation status bar */}
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3 px-4 shadow-2xs flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">Display Language:</span>
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setLanguageMode("all")}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                languageMode === "all" ? "bg-white text-navy-950 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Fields (Side by Side)
            </button>
            <button
              type="button"
              onClick={() => setLanguageMode("en")}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                languageMode === "en" ? "bg-white text-navy-950 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              English Only (EN)
            </button>
            <button
              type="button"
              onClick={() => setLanguageMode("bn")}
              className={`px-3 py-1 rounded-md font-semibold transition-all font-bangla ${
                languageMode === "bn" ? "bg-white text-teal-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              বাংলা Only (BN)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium">Homepage Translation:</span>
          <div className="flex items-center gap-2">
            <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
              <div
                className="bg-teal-500 h-full transition-all"
                style={{ width: `${totalTranslatedPct}%` }}
              />
            </div>
            <span className="text-xs font-bold text-slate-700">{totalTranslatedPct}%</span>
          </div>
        </div>
      </div>

      {saveError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          <strong>Save error:</strong> {saveError}
        </div>
      )}
      {successMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
          {successMsg}
        </div>
      )}

      {/* Sections List */}
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
                  <span className="text-[11px] px-2.5 py-1 rounded-md bg-teal-50 text-teal-700 font-bold uppercase tracking-wider shrink-0">
                    {section.type}
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-slate-900 truncate">{label}</h2>
                    <p className="text-xs text-slate-400 truncate">{section.description || "Homepage section block"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Reorder Buttons */}
                  <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                    <button
                      type="button"
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
                      type="button"
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
                    type="button"
                    onClick={() => toggleVisibility(section)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      section.visible
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                        : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200"
                    }`}
                  >
                    {section.visible ? "Visible" : "Hidden"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDuplicateSection(section)}
                    className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Duplicate Section"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>

                  {section.type !== "hero" && (
                    <button
                      type="button"
                      onClick={() => handleDeleteSection(section)}
                      className="p-1.5 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Section"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}

                  {/* Edit Toggle */}
                  <button
                    type="button"
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
                  {/* HERO SECTION COMPREHENSIVE EDITOR */}
                  {section.type === "hero" && (
                    <div className="space-y-6">
                      {/* Sub-heading: Background Media & Video */}
                      <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
                        <div className="border-b border-slate-100 pb-2">
                          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            Hero Background Media &amp; Video
                          </h3>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Upload or select responsive background images, HTML5 video (.mp4/.webm), and video fallback posters.
                          </p>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                              Background Image URL
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="/images/hero-bg.jpg or https://..."
                                value={(editFormData.content.backgroundImage as string) || ""}
                                onChange={(e) =>
                                  setEditFormData({
                                    ...editFormData,
                                    content: { ...editFormData.content, backgroundImage: e.target.value },
                                  })
                                }
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                              />
                              <button
                                type="button"
                                onClick={() => setPickerTarget("hero:backgroundImage")}
                                className="px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-200 whitespace-nowrap"
                              >
                                Browse…
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                              Background Video URL (.mp4/.webm)
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="/videos/hero-loop.mp4 or https://..."
                                value={(editFormData.content.backgroundVideo as string) || ""}
                                onChange={(e) =>
                                  setEditFormData({
                                    ...editFormData,
                                    content: { ...editFormData.content, backgroundVideo: e.target.value },
                                  })
                                }
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                              />
                              <button
                                type="button"
                                onClick={() => setPickerTarget("hero:backgroundVideo")}
                                className="px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-200 whitespace-nowrap"
                              >
                                Browse…
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                              Poster / Fallback Image URL
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Poster image shown while video loads or if reduced-motion active"
                                value={(editFormData.content.posterImage as string) || ""}
                                onChange={(e) =>
                                  setEditFormData({
                                    ...editFormData,
                                    content: { ...editFormData.content, posterImage: e.target.value },
                                  })
                                }
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                              />
                              <button
                                type="button"
                                onClick={() => setPickerTarget("hero:posterImage")}
                                className="px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-200 whitespace-nowrap"
                              >
                                Browse…
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                              Image / Media Alt Text
                            </label>
                            <input
                              type="text"
                              placeholder="Descriptive text for accessibility"
                              value={(editFormData.content.imageAlt as string) || ""}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  content: { ...editFormData.content, imageAlt: e.target.value },
                                })
                              }
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                            />
                          </div>
                        </div>

                        {/* Visual & Layout Controls */}
                        <div className="grid sm:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                              Overlay Color
                            </label>
                            <select
                              value={(editFormData.content.overlayColor as string) || "navy"}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  content: { ...editFormData.content, overlayColor: e.target.value },
                                })
                              }
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                            >
                              <option value="navy">Navy Blue</option>
                              <option value="dark">Dark Slate</option>
                              <option value="teal">Teal</option>
                              <option value="none">None / Transparent</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                              Overlay Opacity
                            </label>
                            <select
                              value={String(editFormData.content.overlayOpacity ?? "0.55")}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  content: { ...editFormData.content, overlayOpacity: Number(e.target.value) },
                                })
                              }
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                            >
                              <option value="0.2">20% (Subtle)</option>
                              <option value="0.4">40%</option>
                              <option value="0.55">55% (Default)</option>
                              <option value="0.75">75% (Darker)</option>
                              <option value="0.9">90% (Near Solid)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                              Layout Variant
                            </label>
                            <select
                              value={(editFormData.content.layoutVariant as string) || "default"}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  content: { ...editFormData.content, layoutVariant: e.target.value },
                                })
                              }
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                            >
                              <option value="default">Default (Left Aligned)</option>
                              <option value="centered">Centered</option>
                              <option value="split">Split (Content + Side Media)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                              Text Alignment
                            </label>
                            <select
                              value={(editFormData.content.textAlignment as string) || "left"}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  content: { ...editFormData.content, textAlignment: e.target.value },
                                })
                              }
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                            >
                              <option value="left">Left</option>
                              <option value="center">Center</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Sub-heading: Hero Copy & Actions */}
                      <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
                        <div className="border-b border-slate-100 pb-2">
                          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            Hero Copy &amp; Call to Actions (Bilingual)
                          </h3>
                        </div>

                        {/* Badge / Announcement */}
                        {(languageMode === "all" || languageMode === "en") && (
                          <div className={languageMode === "all" ? "grid sm:grid-cols-2 gap-4" : ""}>
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
                            {languageMode === "all" && (
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
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bangla"
                                />
                              </div>
                            )}
                          </div>
                        )}
                        {languageMode === "bn" && (
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
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bangla"
                            />
                          </div>
                        )}

                        {/* Brand Line */}
                        {(languageMode === "all" || languageMode === "en") && (
                          <div className={languageMode === "all" ? "grid sm:grid-cols-2 gap-4" : ""}>
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
                            {languageMode === "all" && (
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
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bangla"
                                />
                              </div>
                            )}
                          </div>
                        )}
                        {languageMode === "bn" && (
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
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bangla"
                            />
                          </div>
                        )}

                        {/* Description */}
                        {(languageMode === "all" || languageMode === "en") && (
                          <div className={languageMode === "all" ? "grid sm:grid-cols-2 gap-4" : ""}>
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
                            {languageMode === "all" && (
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
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm resize-none font-bangla"
                                />
                              </div>
                            )}
                          </div>
                        )}
                        {languageMode === "bn" && (
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
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm resize-none font-bangla"
                            />
                          </div>
                        )}

                        {/* Primary CTA */}
                        <div className="grid sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Primary Button (EN)</label>
                            <input
                              type="text"
                              value={(editFormData.content.primaryCtaText as string) || ""}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  content: { ...editFormData.content, primaryCtaText: e.target.value },
                                })
                              }
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Primary Button (BN)</label>
                            <input
                              type="text"
                              value={(editFormData.contentBn.primaryCtaText as string) || ""}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  contentBn: { ...editFormData.contentBn, primaryCtaText: e.target.value },
                                })
                              }
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bangla"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Primary Button URL</label>
                            <input
                              type="text"
                              value={(editFormData.content.primaryCtaLink as string) || ""}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  content: { ...editFormData.content, primaryCtaLink: e.target.value },
                                })
                              }
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                            />
                          </div>
                        </div>

                        {/* Secondary CTA */}
                        <div className="grid sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Secondary Button (EN)</label>
                            <input
                              type="text"
                              value={(editFormData.content.secondaryCtaText as string) || ""}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  content: { ...editFormData.content, secondaryCtaText: e.target.value },
                                })
                              }
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Secondary Button (BN)</label>
                            <input
                              type="text"
                              value={(editFormData.contentBn.secondaryCtaText as string) || ""}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  contentBn: { ...editFormData.contentBn, secondaryCtaText: e.target.value },
                                })
                              }
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bangla"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Secondary Button URL</label>
                            <input
                              type="text"
                              value={(editFormData.content.secondaryCtaLink as string) || ""}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  content: { ...editFormData.content, secondaryCtaLink: e.target.value },
                                })
                              }
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                            />
                          </div>
                        </div>

                        {/* Scroll Text */}
                        <div className="grid sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Scroll Indicator Text (EN)</label>
                            <input
                              type="text"
                              placeholder="SCROLL DOWN"
                              value={(editFormData.content.scrollText as string) || ""}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  content: { ...editFormData.content, scrollText: e.target.value },
                                })
                              }
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Scroll Indicator Text (BN)</label>
                            <input
                              type="text"
                              placeholder="নিচে স্ক্রল করুন"
                              value={(editFormData.contentBn.scrollText as string) || ""}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  contentBn: { ...editFormData.contentBn, scrollText: e.target.value },
                                })
                              }
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bangla"
                            />
                          </div>
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
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bangla"
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
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm resize-none font-bangla"
                          />
                        </div>
                      </div>

                      {/* Focus Cards List */}
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <h4 className="text-xs font-bold text-slate-700 uppercase mb-3">Focus Area Cards</h4>
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
                                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bangla"
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
                                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs resize-none font-bangla"
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
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bangla"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700 uppercase">Impact Number Counters</label>
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
                                    className="w-full px-2 py-1 border border-slate-200 rounded text-xs font-bangla"
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
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Section Label (BN)</label>
                          <input
                            type="text"
                            value={(editFormData.contentBn.sectionLabel as string) || ""}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                contentBn: { ...editFormData.contentBn, sectionLabel: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bangla"
                          />
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Latest Publications Heading (EN)</label>
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
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Latest Publications Heading (BN)</label>
                          <input
                            type="text"
                            value={(editFormData.contentBn.latestPublicationsHeading as string) || ""}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                contentBn: { ...editFormData.contentBn, latestPublicationsHeading: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bangla"
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
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bangla"
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
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm resize-none font-bangla"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Fallback Form for any Custom Added Section Types */}
                  {!["hero", "focus", "impact", "featured_research", "events_newsletter"].includes(section.type) && (
                    <div className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Title (EN)</label>
                          <input
                            type="text"
                            value={editFormData.title}
                            onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Title (BN)</label>
                          <input
                            type="text"
                            value={editFormData.titleBn}
                            onChange={(e) => setEditFormData({ ...editFormData, titleBn: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bangla"
                          />
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description (EN)</label>
                          <textarea
                            rows={2}
                            value={editFormData.description}
                            onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm resize-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description (BN)</label>
                          <textarea
                            rows={2}
                            value={editFormData.descriptionBn}
                            onChange={(e) => setEditFormData({ ...editFormData, descriptionBn: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm resize-none font-bangla"
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

      {/* Media Picker Modal */}
      {pickerTarget && (
        <MediaPickerModal
          open
          onClose={() => setPickerTarget(null)}
          onSelect={onMediaPick}
          title="Select Media Asset"
        />
      )}
    </div>
  );
}

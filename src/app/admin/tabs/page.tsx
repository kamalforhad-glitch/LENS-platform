"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Layers,
  FolderTree,
  Save,
  CheckCircle,
  AlertCircle,
  Eye,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import TabsHierarchyEditor from "@/components/admin/TabsHierarchyEditor";
import TabsSection, { type TabItem } from "@/components/page/TabsSection";
import { getPageBySlug, updateSection } from "@/lib/actions/cms";

interface SectionWithPage {
  id: string;
  pageId: string;
  pageSlug: string;
  pageTitle: string;
  title: string;
  titleBn: string;
  content: Record<string, unknown>;
  contentBn: Record<string, unknown>;
}

export default function TabsAdminPage() {
  const [sections, setSections] = useState<SectionWithPage[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewLang, setPreviewLang] = useState<"en" | "bn">("en");

  const [activeTabsEn, setActiveTabsEn] = useState<TabItem[]>([]);
  const [activeTabsBn, setActiveTabsBn] = useState<TabItem[]>([]);

  // Load pages with tabs sections, defaulting to Homepage's tabs section
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const homePage = await getPageBySlug("home");
        const foundSections: SectionWithPage[] = [];

        if (homePage?.sections) {
          for (const s of homePage.sections) {
            if (s.type === "tabs" || s.type === "nested_tabs") {
              const c = typeof s.content === "string" ? JSON.parse(s.content || "{}") : (s.content || {});
              const cBn = typeof s.contentBn === "string" ? JSON.parse(s.contentBn || "{}") : (s.contentBn || {});
              foundSections.push({
                id: s.id,
                pageId: homePage.id,
                pageSlug: "home",
                pageTitle: "Homepage",
                title: s.title || "Research-Driven Think Tank",
                titleBn: s.titleBn || "গবেষণাভিত্তিক থিংক ট্যাংক",
                content: c,
                contentBn: cBn,
              });
            }
          }
        }

        // Fetch other pages that might have tabs
        const allPagesRes = await fetch("/api/admin/pages").then((r) => r.json()).catch(() => ({ pages: [] }));
        for (const p of allPagesRes.pages || []) {
          if (p.slug === "home") continue;
          const pageData = await getPageBySlug(p.slug).catch(() => null);
          if (pageData?.sections) {
            for (const s of pageData.sections) {
              if (s.type === "tabs" || s.type === "nested_tabs") {
                const c = typeof s.content === "string" ? JSON.parse(s.content || "{}") : (s.content || {});
                const cBn = typeof s.contentBn === "string" ? JSON.parse(s.contentBn || "{}") : (s.contentBn || {});
                foundSections.push({
                  id: s.id,
                  pageId: p.id,
                  pageSlug: p.slug,
                  pageTitle: p.title,
                  title: s.title,
                  titleBn: s.titleBn,
                  content: c,
                  contentBn: cBn,
                });
              }
            }
          }
        }

        setSections(foundSections);
        if (foundSections.length > 0) {
          const first = foundSections[0];
          setSelectedSectionId(first.id);
          setActiveTabsEn(Array.isArray(first.content.tabs) ? (first.content.tabs as TabItem[]) : []);
          setActiveTabsBn(Array.isArray(first.contentBn.tabs) ? (first.contentBn.tabs as TabItem[]) : []);
        }
      } catch (err) {
        setErrorMsg("Failed to load tab sections.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSelectSection = (secId: string) => {
    const sec = sections.find((s) => s.id === secId);
    if (!sec) return;
    setSelectedSectionId(secId);
    setActiveTabsEn(Array.isArray(sec.content.tabs) ? (sec.content.tabs as TabItem[]) : []);
    setActiveTabsBn(Array.isArray(sec.contentBn.tabs) ? (sec.contentBn.tabs as TabItem[]) : []);
  };

  const handleSave = async () => {
    const sec = sections.find((s) => s.id === selectedSectionId);
    if (!sec) return;

    setSaving(true);
    setErrorMsg(null);
    try {
      const updatedContent = { ...sec.content, tabs: activeTabsEn };
      const updatedContentBn = { ...sec.contentBn, tabs: activeTabsBn };

      await updateSection(sec.id, {
        content: JSON.stringify(updatedContent),
        contentBn: JSON.stringify(updatedContentBn),
      });

      // Update local state
      setSections((prev) =>
        prev.map((s) =>
          s.id === sec.id
            ? { ...s, content: updatedContent, contentBn: updatedContentBn }
            : s
        )
      );

      setSuccessMsg("Tabs hierarchy saved and published successfully.");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to save tabs.");
    } finally {
      setSaving(false);
    }
  };

  const activeSection = sections.find((s) => s.id === selectedSectionId);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-6 h-6 text-teal-600" />
            <h1 className="text-2xl font-bold text-slate-900">Tabs & Nested Tabs Builder</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Visual control for multi-level tabs, sub-tabs, and structured content blocks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all flex items-center gap-2 ${
              previewMode
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Eye className="w-4 h-4" />
            {previewMode ? "Close Preview" : "Live Preview"}
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !selectedSectionId}
            className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save & Publish Tabs"}
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm">
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Target Section Selector */}
      {sections.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
              Target Section:
            </span>
            <select
              value={selectedSectionId}
              onChange={(e) => handleSelectSection(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.pageTitle} ({s.pageSlug}) — {s.title || "Tabs Section"}
                </option>
              ))}
            </select>
          </div>

          {activeSection && (
            <Link
              href={activeSection.pageSlug === "home" ? "/admin/pages/home" : `/admin/pages/${activeSection.pageId}`}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 self-start sm:self-auto"
            >
              Open in Page Editor <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      )}

      {/* Live Preview Panel */}
      {previewMode && (
        <div className="bg-white rounded-2xl border-2 border-teal-500 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Live Tab Hierarchy Preview
              </h3>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setPreviewLang("en")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md ${
                  previewLang === "en" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setPreviewLang("bn")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md ${
                  previewLang === "bn" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
                }`}
              >
                বাংলা
              </button>
            </div>
          </div>

          <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100">
            <TabsSection
              content={{ tabs: activeTabsEn }}
              contentBn={{ tabs: activeTabsBn }}
              bn={previewLang === "bn"}
            />
          </div>
        </div>
      )}

      {/* Main Hierarchy Editor */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading tab configurations...</div>
      ) : sections.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 mb-1">No Tab Sections Found</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            Add a &ldquo;Tabs &amp; Nested Tabs&rdquo; section to any page or the homepage to start configuring the hierarchy.
          </p>
          <Link
            href="/admin/pages/home"
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold shadow-xs inline-flex items-center gap-2"
          >
            Go to Homepage Builder
          </Link>
        </div>
      ) : (
        <TabsHierarchyEditor
          value={activeTabsEn}
          valueBn={activeTabsBn}
          onChange={(newEn, newBn) => {
            setActiveTabsEn(newEn);
            setActiveTabsBn(newBn);
          }}
        />
      )}
    </div>
  );
}


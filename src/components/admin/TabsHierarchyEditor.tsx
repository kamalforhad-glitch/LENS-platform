"use client";

import { useState } from "react";
import {
  Layers,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Copy,
  FolderTree,
  FileText,
  Image as ImageIcon,
  Video,
  CreditCard,
  List,
  Download,
  MousePointerClick,
  Sparkles,
} from "lucide-react";
import type { TabItem, InnerTabItem, ContentBlockItem } from "@/components/page/TabsSection";
import MediaPickerModal from "./MediaPickerModal";

export interface TabsHierarchyEditorProps {
  value: TabItem[];
  valueBn?: TabItem[];
  onChange: (tabsEn: TabItem[], tabsBn: TabItem[]) => void;
  activeLanguage?: "en" | "bn";
}

function generateId(): string {
  return "tab-" + Math.random().toString(36).substring(2, 9);
}

export default function TabsHierarchyEditor({
  value,
  valueBn = [],
  onChange,
  activeLanguage = "en",
}: TabsHierarchyEditorProps) {
  const [tabsEn, setTabsEn] = useState<TabItem[]>(() => (Array.isArray(value) ? value : []));
  const [tabsBn, setTabsBn] = useState<TabItem[]>(() => (Array.isArray(valueBn) ? valueBn : []));
  const [selectedTabId, setSelectedTabId] = useState<string>(() => tabsEn[0]?.id || "");
  const [selectedInnerTabId, setSelectedInnerTabId] = useState<string>("");
  const [lang, setLang] = useState<"en" | "bn">(activeLanguage);
  const [pickerTarget, setPickerTarget] = useState<{ blockId: string; field: "imageUrl" | "videoUrl" | "videoPoster" } | null>(null);

  const update = (newEn: TabItem[], newBn: TabItem[]) => {
    setTabsEn(newEn);
    setTabsBn(newBn);
    onChange(newEn, newBn);
  };

  const selectedTab = tabsEn.find((t) => t.id === selectedTabId) || tabsEn[0];
  const selectedTabBn = tabsBn.find((t) => t.id === selectedTabId) || tabsBn[0];

  // Helper to ensure BN has matching mirror structure
  const syncBnWithEn = (enList: TabItem[], currentBn: TabItem[]): TabItem[] => {
    return enList.map((tab, idx) => {
      const existing = currentBn.find((b) => b.id === tab.id) || currentBn[idx];
      return {
        ...tab,
        labelBn: existing?.labelBn || existing?.label || "",
        descriptionBn: existing?.descriptionBn || existing?.description || "",
        innerTabs: (tab.innerTabs || []).map((it, itIdx) => {
          const exIt = existing?.innerTabs?.find((b) => b.id === it.id) || existing?.innerTabs?.[itIdx];
          return {
            ...it,
            labelBn: exIt?.labelBn || exIt?.label || "",
            descriptionBn: exIt?.descriptionBn || exIt?.description || "",
            contentBlocks: it.contentBlocks || [],
          };
        }),
      };
    });
  };

  // Tab CRUD
  const addTab = () => {
    const newId = generateId();
    const newTab: TabItem = {
      id: newId,
      label: `New Tab ${tabsEn.length + 1}`,
      labelBn: `নতুন ট্যাব ${tabsEn.length + 1}`,
      description: "",
      descriptionBn: "",
      sortOrder: tabsEn.length,
      visible: true,
      innerTabs: [],
      contentBlocks: [
        {
          id: generateId(),
          type: "rich_text",
          title: "Introduction",
          titleBn: "পরিচিতি",
          richText: "Add your content here...",
          richTextBn: "এখানে আপনার বিবরণ যোগ করুন...",
        },
      ],
    };
    const nextEn = [...tabsEn, newTab];
    const nextBn = syncBnWithEn(nextEn, tabsBn);
    setSelectedTabId(newId);
    setSelectedInnerTabId("");
    update(nextEn, nextBn);
  };

  const deleteTab = (tabId: string) => {
    if (!confirm("Are you sure you want to delete this tab and all its inner content?")) return;
    const nextEn = tabsEn.filter((t) => t.id !== tabId);
    const nextBn = tabsBn.filter((t) => t.id !== tabId);
    if (selectedTabId === tabId) {
      setSelectedTabId(nextEn[0]?.id || "");
      setSelectedInnerTabId("");
    }
    update(nextEn, nextBn);
  };

  const moveTab = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= tabsEn.length) return;
    const nextEn = [...tabsEn];
    const nextBn = [...tabsBn];
    const [movedEn] = nextEn.splice(index, 1);
    const [movedBn] = nextBn.splice(index, 1);
    nextEn.splice(target, 0, movedEn);
    if (movedBn) nextBn.splice(target, 0, movedBn);
    update(nextEn, nextBn);
  };

  // Inner Tab CRUD
  const addInnerTab = (tabId: string) => {
    const tab = tabsEn.find((t) => t.id === tabId);
    if (!tab) return;
    const innerTabs = tab.innerTabs || [];
    const newId = generateId();
    const newInner: InnerTabItem = {
      id: newId,
      label: `Sub-Tab ${innerTabs.length + 1}`,
      labelBn: `উপ-ট্যাব ${innerTabs.length + 1}`,
      description: "",
      descriptionBn: "",
      sortOrder: innerTabs.length,
      visible: true,
      contentBlocks: [
        {
          id: generateId(),
          type: "rich_text",
          title: "Overview",
          titleBn: "সারসংক্ষেপ",
          richText: "Add details for this sub-topic...",
          richTextBn: "এই উপ-বিষয়ের বিস্তারিত বিবরণ যোগ করুন...",
        },
      ],
    };

    const nextEn = tabsEn.map((t) =>
      t.id === tabId ? { ...t, innerTabs: [...innerTabs, newInner] } : t
    );
    const nextBn = syncBnWithEn(nextEn, tabsBn);
    setSelectedInnerTabId(newId);
    update(nextEn, nextBn);
  };

  const deleteInnerTab = (tabId: string, innerTabId: string) => {
    const nextEn = tabsEn.map((t) => {
      if (t.id !== tabId) return t;
      return {
        ...t,
        innerTabs: (t.innerTabs || []).filter((it) => it.id !== innerTabId),
      };
    });
    const nextBn = syncBnWithEn(nextEn, tabsBn);
    if (selectedInnerTabId === innerTabId) {
      setSelectedInnerTabId("");
    }
    update(nextEn, nextBn);
  };

  // Content Block CRUD
  const addContentBlock = (type: ContentBlockItem["type"]) => {
    const newBlock: ContentBlockItem = {
      id: generateId(),
      type,
      title: type === "rich_text" ? "Overview" : type === "cards" ? "Key Highlights" : "Content Block",
      titleBn: type === "rich_text" ? "সারসংক্ষেপ" : type === "cards" ? "প্রধান বৈশিষ্ট্য" : "কন্টেন্ট ব্লক",
      description: "",
      descriptionBn: "",
      richText: type === "rich_text" ? "Enter narrative content..." : undefined,
      richTextBn: type === "rich_text" ? "এখানে আপনার বিবরণ লিখুন..." : undefined,
      cards: type === "cards" ? [
        { id: generateId(), title: "Highlight 1", titleBn: "হাইলাইট ১", description: "Details...", descriptionBn: "বিস্তারিত..." }
      ] : undefined,
      items: type === "list" ? [
        { id: generateId(), text: "Key point 1", textBn: "প্রধান পয়েন্ট ১", subtext: "Context note", subtextBn: "প্রাসঙ্গিক নোট" }
      ] : undefined,
      downloads: type === "downloads" ? [
        { id: generateId(), title: "Report PDF", titleBn: "রিপোর্ট পিডিএফ", fileUrl: "#", fileType: "PDF", fileSize: "1.2 MB" }
      ] : undefined,
      ctaLabel: type === "cta" ? "Learn More" : undefined,
      ctaLabelBn: type === "cta" ? "আরও জানুন" : undefined,
      ctaUrl: type === "cta" ? "/about" : undefined,
    };

    if (selectedInnerTabId && selectedTab) {
      const nextEn = tabsEn.map((t) => {
        if (t.id !== selectedTab.id) return t;
        return {
          ...t,
          innerTabs: (t.innerTabs || []).map((it) =>
            it.id === selectedInnerTabId
              ? { ...it, contentBlocks: [...(it.contentBlocks || []), newBlock] }
              : it
          ),
        };
      });
      update(nextEn, syncBnWithEn(nextEn, tabsBn));
    } else if (selectedTab) {
      const nextEn = tabsEn.map((t) =>
        t.id === selectedTab.id
          ? { ...t, contentBlocks: [...(t.contentBlocks || []), newBlock] }
          : t
      );
      update(nextEn, syncBnWithEn(nextEn, tabsBn));
    }
  };

  const updateBlock = (blockId: string, patch: Partial<ContentBlockItem>) => {
    const nextEn = tabsEn.map((t) => {
      if (t.id !== selectedTab?.id) return t;
      if (selectedInnerTabId) {
        return {
          ...t,
          innerTabs: (t.innerTabs || []).map((it) => {
            if (it.id !== selectedInnerTabId) return it;
            return {
              ...it,
              contentBlocks: (it.contentBlocks || []).map((b) =>
                b.id === blockId ? { ...b, ...patch } : b
              ),
            };
          }),
        };
      }
      return {
        ...t,
        contentBlocks: (t.contentBlocks || []).map((b) =>
          b.id === blockId ? { ...b, ...patch } : b
        ),
      };
    });
    update(nextEn, syncBnWithEn(nextEn, tabsBn));
  };

  const deleteBlock = (blockId: string) => {
    const nextEn = tabsEn.map((t) => {
      if (t.id !== selectedTab?.id) return t;
      if (selectedInnerTabId) {
        return {
          ...t,
          innerTabs: (t.innerTabs || []).map((it) =>
            it.id === selectedInnerTabId
              ? { ...it, contentBlocks: (it.contentBlocks || []).filter((b) => b.id !== blockId) }
              : it
          ),
        };
      }
      return {
        ...t,
        contentBlocks: (t.contentBlocks || []).filter((b) => b.id !== blockId),
      };
    });
    update(nextEn, syncBnWithEn(nextEn, tabsBn));
  };

  const currentInnerTabs = selectedTab?.innerTabs || [];
  const currentInnerTab = currentInnerTabs.find((it) => it.id === selectedInnerTabId);
  const currentBlocks = currentInnerTab
    ? currentInnerTab.contentBlocks || []
    : selectedTab?.contentBlocks || [];

  return (
    <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-6">
      {/* Header & Language Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-teal-600" />
            <h3 className="text-base font-bold text-slate-900">Tabs & Nested Tabs Hierarchy</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage primary tabs, sub-tabs, and rich structured content blocks for English and Bengali.
          </p>
        </div>

        {/* Language Mode Toggle */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl shadow-xs self-start">
          <button
            type="button"
            onClick={() => setLang("en")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              lang === "en" ? "bg-teal-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            English (EN)
          </button>
          <button
            type="button"
            onClick={() => setLang("bn")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              lang === "bn" ? "bg-teal-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            বাংলা (BN)
          </button>
        </div>
      </div>

      {/* Level 1: Primary Tabs Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Primary Tabs ({tabsEn.length})
          </label>
          <button
            type="button"
            onClick={addTab}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Primary Tab
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {tabsEn.map((tab, idx) => {
            const isSelected = tab.id === selectedTabId;
            const label = lang === "bn" ? tab.labelBn || tab.label : tab.label;

            return (
              <div
                key={tab.id}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all shrink-0 ${
                  isSelected
                    ? "bg-white border-teal-500 text-teal-700 shadow-xs ring-1 ring-teal-500/20"
                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTabId(tab.id);
                    setSelectedInnerTabId("");
                  }}
                  className="truncate max-w-[150px] text-left cursor-pointer focus:outline-none"
                >
                  {label || "Untitled Tab"}
                </button>
                <div className="flex items-center gap-0.5 ml-1 border-l border-slate-100 pl-1">
                  <button
                    type="button"
                    onClick={() => moveTab(idx, -1)}
                    disabled={idx === 0}
                    className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                    title="Move Left"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => moveTab(idx, 1)}
                    disabled={idx === tabsEn.length - 1}
                    className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                    title="Move Right"
                  >
                    →
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteTab(tab.id)}
                    className="p-0.5 text-rose-400 hover:text-rose-600 ml-1"
                    title="Delete Tab"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Tab Properties */}
      {selectedTab && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Tab Label ({lang === "bn" ? "বাংলা" : "English"})
              </label>
              <input
                type="text"
                value={lang === "bn" ? selectedTab.labelBn || "" : selectedTab.label || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  const nextEn = tabsEn.map((t) =>
                    t.id === selectedTab.id ? { ...t, [lang === "bn" ? "labelBn" : "label"]: val } : t
                  );
                  update(nextEn, syncBnWithEn(nextEn, tabsBn));
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Description / Intro ({lang === "bn" ? "বাংলা" : "English"})
              </label>
              <input
                type="text"
                value={lang === "bn" ? selectedTab.descriptionBn || "" : selectedTab.description || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  const nextEn = tabsEn.map((t) =>
                    t.id === selectedTab.id ? { ...t, [lang === "bn" ? "descriptionBn" : "description"]: val } : t
                  );
                  update(nextEn, syncBnWithEn(nextEn, tabsBn));
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
          </div>

          {/* Level 2: Inner Tabs Section */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Nested Sub-Tabs ({currentInnerTabs.length})
                </h4>
              </div>
              <button
                type="button"
                onClick={() => addInnerTab(selectedTab.id)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Sub-Tab
              </button>
            </div>

            {currentInnerTabs.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4 bg-slate-50 p-2 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedInnerTabId("")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    !selectedInnerTabId
                      ? "bg-teal-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 bg-white"
                  }`}
                >
                  Root Content Blocks
                </button>
                {currentInnerTabs.map((it) => {
                  const isSelected = it.id === selectedInnerTabId;
                  const label = lang === "bn" ? it.labelBn || it.label : it.label;
                  return (
                    <div
                      key={it.id}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        isSelected
                          ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedInnerTabId(it.id)}
                        className="truncate max-w-[130px] text-left cursor-pointer"
                      >
                        {label || "Untitled Sub-Tab"}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteInnerTab(selectedTab.id, it.id)}
                        className="opacity-60 hover:opacity-100 hover:text-rose-200 ml-1"
                        title="Delete Sub-Tab"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {currentInnerTab && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 bg-teal-50/40 border border-teal-100 p-3 rounded-xl">
                <div>
                  <label className="block text-xs font-medium text-teal-900 mb-1">
                    Sub-Tab Label ({lang === "bn" ? "বাংলা" : "English"})
                  </label>
                  <input
                    type="text"
                    value={lang === "bn" ? currentInnerTab.labelBn || "" : currentInnerTab.label || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      const nextEn = tabsEn.map((t) => {
                        if (t.id !== selectedTab.id) return t;
                        return {
                          ...t,
                          innerTabs: (t.innerTabs || []).map((it) =>
                            it.id === currentInnerTab.id
                              ? { ...it, [lang === "bn" ? "labelBn" : "label"]: val }
                              : it
                          ),
                        };
                      });
                      update(nextEn, syncBnWithEn(nextEn, tabsBn));
                    }}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-teal-900 mb-1">
                    Sub-Tab Description ({lang === "bn" ? "বাংলা" : "English"})
                  </label>
                  <input
                    type="text"
                    value={lang === "bn" ? currentInnerTab.descriptionBn || "" : currentInnerTab.description || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      const nextEn = tabsEn.map((t) => {
                        if (t.id !== selectedTab.id) return t;
                        return {
                          ...t,
                          innerTabs: (t.innerTabs || []).map((it) =>
                            it.id === currentInnerTab.id
                              ? { ...it, [lang === "bn" ? "descriptionBn" : "description"]: val }
                              : it
                          ),
                        };
                      });
                      update(nextEn, syncBnWithEn(nextEn, tabsBn));
                    }}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
              </div>
            )}

            {/* Level 3: Content Blocks Toolbar */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {currentInnerTab ? `Content Blocks for "${currentInnerTab.label}"` : "Root Content Blocks"} ({currentBlocks.length})
                </span>

                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => addContentBlock("rich_text")}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    + Text
                  </button>
                  <button
                    type="button"
                    onClick={() => addContentBlock("cards")}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-teal-600" />
                    + Cards
                  </button>
                  <button
                    type="button"
                    onClick={() => addContentBlock("image")}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
                    + Image
                  </button>
                  <button
                    type="button"
                    onClick={() => addContentBlock("video")}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  >
                    <Video className="w-3.5 h-3.5 text-rose-600" />
                    + Video
                  </button>
                  <button
                    type="button"
                    onClick={() => addContentBlock("list")}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  >
                    <List className="w-3.5 h-3.5 text-indigo-600" />
                    + List
                  </button>
                  <button
                    type="button"
                    onClick={() => addContentBlock("downloads")}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    + Download
                  </button>
                  <button
                    type="button"
                    onClick={() => addContentBlock("cta")}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  >
                    <MousePointerClick className="w-3.5 h-3.5 text-violet-600" />
                    + CTA
                  </button>
                </div>
              </div>

              {/* Render Content Blocks Editor List */}
              <div className="space-y-3">
                {currentBlocks.map((block, bIdx) => (
                  <div
                    key={block.id || bIdx}
                    className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                          {block.type.replace("_", " ")}
                        </span>
                        <span className="text-xs font-semibold text-slate-800">
                          {lang === "bn" ? block.titleBn || block.title : block.title}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteBlock(block.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-md"
                        title="Delete Block"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Common Title & Description */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                          Block Title ({lang === "bn" ? "বাংলা" : "English"})
                        </label>
                        <input
                          type="text"
                          value={lang === "bn" ? block.titleBn || "" : block.title || ""}
                          onChange={(e) => updateBlock(block.id, { [lang === "bn" ? "titleBn" : "title"]: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                          Subtitle / Description ({lang === "bn" ? "বাংলা" : "English"})
                        </label>
                        <input
                          type="text"
                          value={lang === "bn" ? block.descriptionBn || "" : block.description || ""}
                          onChange={(e) => updateBlock(block.id, { [lang === "bn" ? "descriptionBn" : "description"]: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                        />
                      </div>
                    </div>

                    {/* Type specific fields */}
                    {block.type === "rich_text" && (
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                          Rich Text Content ({lang === "bn" ? "বাংলা" : "English"})
                        </label>
                        <textarea
                          rows={3}
                          value={lang === "bn" ? block.richTextBn || "" : block.richText || ""}
                          onChange={(e) => updateBlock(block.id, { [lang === "bn" ? "richTextBn" : "richText"]: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white resize-y"
                        />
                      </div>
                    )}

                    {block.type === "image" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Image URL</label>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={block.imageUrl || ""}
                              onChange={(e) => updateBlock(block.id, { imageUrl: e.target.value })}
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                            />
                            <button
                              type="button"
                              onClick={() => setPickerTarget({ blockId: block.id, field: "imageUrl" })}
                              className="px-2.5 py-1 text-xs font-semibold bg-slate-200 hover:bg-slate-300 rounded-lg whitespace-nowrap"
                            >
                              Browse
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                            Image Caption ({lang === "bn" ? "বাংলা" : "English"})
                          </label>
                          <input
                            type="text"
                            value={lang === "bn" ? block.captionBn || "" : block.caption || ""}
                            onChange={(e) => updateBlock(block.id, { [lang === "bn" ? "captionBn" : "caption"]: e.target.value })}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                          />
                        </div>
                      </div>
                    )}

                    {block.type === "video" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Video URL (.mp4/.webm)</label>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={block.videoUrl || ""}
                              onChange={(e) => updateBlock(block.id, { videoUrl: e.target.value })}
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                            />
                            <button
                              type="button"
                              onClick={() => setPickerTarget({ blockId: block.id, field: "videoUrl" })}
                              className="px-2.5 py-1 text-xs font-semibold bg-slate-200 hover:bg-slate-300 rounded-lg whitespace-nowrap"
                            >
                              Browse
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Poster Image URL</label>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={block.videoPoster || ""}
                              onChange={(e) => updateBlock(block.id, { videoPoster: e.target.value })}
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                            />
                            <button
                              type="button"
                              onClick={() => setPickerTarget({ blockId: block.id, field: "videoPoster" })}
                              className="px-2.5 py-1 text-xs font-semibold bg-slate-200 hover:bg-slate-300 rounded-lg whitespace-nowrap"
                            >
                              Browse
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {block.type === "cta" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                            Button Label ({lang === "bn" ? "বাংলা" : "English"})
                          </label>
                          <input
                            type="text"
                            value={lang === "bn" ? block.ctaLabelBn || "" : block.ctaLabel || ""}
                            onChange={(e) => updateBlock(block.id, { [lang === "bn" ? "ctaLabelBn" : "ctaLabel"]: e.target.value })}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Button URL</label>
                          <input
                            type="text"
                            value={block.ctaUrl || ""}
                            onChange={(e) => updateBlock(block.id, { ctaUrl: e.target.value })}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Media Picker Modal */}
      {pickerTarget && (
        <MediaPickerModal
          open={true}
          onClose={() => setPickerTarget(null)}
          onSelect={(url) => {
            if (pickerTarget) {
              updateBlock(pickerTarget.blockId, { [pickerTarget.field]: url });
              setPickerTarget(null);
            }
          }}
        />
      )}
    </div>
  );
}


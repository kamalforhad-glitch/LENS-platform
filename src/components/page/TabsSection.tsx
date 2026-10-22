"use client";

import { useState, useRef, useEffect, useCallback, useId, useMemo } from "react";
import Link from "next/link";
import { pickLocale } from "@/lib/cms-content";
import { asString } from "./PageSectionsView";

export { pickLocale };
import {
  FileText,
  Download,
  ChevronRight,
  Layers,
} from "lucide-react";

export interface ContentBlockItem {
  id: string;
  type: "rich_text" | "image" | "video" | "cards" | "list" | "downloads" | "cta";
  title?: string;
  titleBn?: string;
  description?: string;
  descriptionBn?: string;
  richText?: string;
  richTextBn?: string;
  imageUrl?: string;
  imageAlt?: string;
  imageAltBn?: string;
  caption?: string;
  captionBn?: string;
  videoUrl?: string;
  videoPoster?: string;
  videoCaption?: string;
  videoCaptionBn?: string;
  cards?: Array<{
    id?: string;
    title: string;
    titleBn?: string;
    description: string;
    descriptionBn?: string;
    image?: string;
    linkUrl?: string;
    linkLabel?: string;
    linkLabelBn?: string;
  }>;
  items?: Array<{
    id?: string;
    text: string;
    textBn?: string;
    subtext?: string;
    subtextBn?: string;
    url?: string;
  }>;
  downloads?: Array<{
    id?: string;
    title: string;
    titleBn?: string;
    fileUrl: string;
    fileSize?: string;
    fileType?: string;
  }>;
  ctaLabel?: string;
  ctaLabelBn?: string;
  ctaUrl?: string;
  ctaVariant?: "primary" | "secondary" | "outline";
  sortOrder?: number;
  visible?: boolean;
}

export interface InnerTabItem {
  id: string;
  label: string;
  labelBn?: string;
  description?: string;
  descriptionBn?: string;
  sortOrder?: number;
  visible?: boolean;
  contentBlocks?: ContentBlockItem[];
  blocks?: ContentBlockItem[];
}

export interface TabItem {
  id: string;
  label: string;
  labelBn?: string;
  description?: string;
  descriptionBn?: string;
  sortOrder?: number;
  visible?: boolean;
  innerTabs?: InnerTabItem[];
  contentBlocks?: ContentBlockItem[];
  blocks?: ContentBlockItem[];
}

export function parseTabsConfig(raw: unknown): { tabs: TabItem[] } {
  if (!raw) return { tabs: [] };
  let rawList: any[] = [];
  if (Array.isArray(raw)) {
    rawList = raw;
  } else if (typeof raw === "object" && raw !== null && "tabs" in raw && Array.isArray((raw as any).tabs)) {
    rawList = (raw as any).tabs;
  } else {
    return { tabs: [] };
  }

  const tabs: TabItem[] = rawList.map((t) => {
    const rawInners = Array.isArray(t.innerTabs) ? t.innerTabs : [];
    const innerTabs: InnerTabItem[] = rawInners.map((it: any) => {
      const blks = it.blocks || it.contentBlocks || [];
      return {
        ...it,
        blocks: blks,
        contentBlocks: blks,
      };
    });

    const rootBlks = t.blocks || t.contentBlocks || [];
    return {
      ...t,
      blocks: rootBlks,
      contentBlocks: rootBlks,
      innerTabs,
    };
  });

  return { tabs };
}

export interface TabsSectionProps {
  content: Record<string, unknown>;
  contentBn?: Record<string, unknown>;
  bn: boolean;
}

export default function TabsSection({ content, contentBn, bn }: TabsSectionProps) {
  const sectionId = useId();

  // Normalize tabs array from content / contentBn
  const rawTabsEn = Array.isArray(content?.tabs) ? (content.tabs as TabItem[]) : [];
  const rawTabsBn = Array.isArray(contentBn?.tabs) ? (contentBn.tabs as TabItem[]) : [];

  // Merge tabs respecting order and visibility
  const tabs: TabItem[] = rawTabsEn
    .filter((t) => t.visible !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((tabEn, index) => {
      const tabBn = rawTabsBn.find((t) => t.id === tabEn.id) || rawTabsBn[index];
      const innerEn = Array.isArray(tabEn.innerTabs) ? tabEn.innerTabs : [];
      const innerBn = Array.isArray(tabBn?.innerTabs) ? tabBn.innerTabs : [];

      const mergedInner: InnerTabItem[] = innerEn
        .filter((it) => it.visible !== false)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((itEn, itIdx) => {
          const itBn = innerBn.find((it) => it.id === itEn.id) || innerBn[itIdx];
          return {
            ...itEn,
            labelBn: itBn?.labelBn || itBn?.label || itEn.labelBn || "",
            descriptionBn: itBn?.descriptionBn || itBn?.description || itEn.descriptionBn || "",
            contentBlocks: itEn.contentBlocks || itBn?.contentBlocks || [],
          };
        });

      return {
        ...tabEn,
        labelBn: tabBn?.labelBn || tabBn?.label || tabEn.labelBn || "",
        descriptionBn: tabBn?.descriptionBn || tabBn?.description || tabEn.descriptionBn || "",
        innerTabs: mergedInner,
        contentBlocks: tabEn.contentBlocks || tabBn?.contentBlocks || [],
      };
    });

  const [activeTabId, setActiveTabId] = useState<string>(() => tabs[0]?.id || "");
  const [activeInnerTabId, setActiveInnerTabId] = useState<string>("");

  const tabListRef = useRef<HTMLDivElement>(null);
  const innerTabListRef = useRef<HTMLDivElement>(null);

  // Sync active tab if initial selection is not found or tabs change
  useEffect(() => {
    if (tabs.length > 0 && !tabs.some((t) => t.id === activeTabId)) {
      setActiveTabId(tabs[0].id);
    }
  }, [tabs, activeTabId]);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
  const innerTabs = useMemo(() => activeTab?.innerTabs || [], [activeTab]);

  // Sync active inner tab when active top tab changes
  useEffect(() => {
    if (innerTabs.length > 0) {
      if (!innerTabs.some((it) => it.id === activeInnerTabId)) {
        setActiveInnerTabId(innerTabs[0].id);
      }
    } else {
      setActiveInnerTabId("");
    }
  }, [innerTabs, activeInnerTabId]);

  const activeInnerTab = innerTabs.find((it) => it.id === activeInnerTabId) || innerTabs[0];

  // Active blocks: inner tab blocks if present, otherwise top tab content blocks
  const activeBlocks = activeInnerTab
    ? activeInnerTab.contentBlocks || []
    : activeTab?.contentBlocks || [];

  // Accessible keyboard navigation for top tablist
  const handleTabKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      let targetIndex = -1;
      if (e.key === "ArrowRight") {
        targetIndex = (index + 1) % tabs.length;
      } else if (e.key === "ArrowLeft") {
        targetIndex = (index - 1 + tabs.length) % tabs.length;
      } else if (e.key === "Home") {
        targetIndex = 0;
      } else if (e.key === "End") {
        targetIndex = tabs.length - 1;
      }

      if (targetIndex >= 0) {
        e.preventDefault();
        const nextId = tabs[targetIndex].id;
        setActiveTabId(nextId);
        const buttons = tabListRef.current?.querySelectorAll<HTMLButtonElement>("[role='tab']");
        buttons?.[targetIndex]?.focus();
      }
    },
    [tabs]
  );

  // Accessible keyboard navigation for inner tablist
  const handleInnerTabKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      let targetIndex = -1;
      if (e.key === "ArrowRight") {
        targetIndex = (index + 1) % innerTabs.length;
      } else if (e.key === "ArrowLeft") {
        targetIndex = (index - 1 + innerTabs.length) % innerTabs.length;
      } else if (e.key === "Home") {
        targetIndex = 0;
      } else if (e.key === "End") {
        targetIndex = innerTabs.length - 1;
      }

      if (targetIndex >= 0) {
        e.preventDefault();
        const nextId = innerTabs[targetIndex].id;
        setActiveInnerTabId(nextId);
        const buttons = innerTabListRef.current?.querySelectorAll<HTMLButtonElement>("[role='tab']");
        buttons?.[targetIndex]?.focus();
      }
    },
    [innerTabs]
  );

  if (!tabs || tabs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-400 text-sm">
        <Layers className="w-8 h-8 mx-auto mb-2 text-slate-300" />
        <p>No tabs configured in this section.</p>
      </div>
    );
  }

  const tabTitle = activeTab ? (bn && activeTab.labelBn ? activeTab.labelBn : activeTab.label) : "";
  const tabDesc = activeTab ? (bn && activeTab.descriptionBn ? activeTab.descriptionBn : activeTab.description) : "";

  return (
    <div className="w-full">
      {/* Level 1: Primary Tabs Navigation */}
      <div className="border-b border-slate-200 mb-6">
        <div
          ref={tabListRef}
          role="tablist"
          aria-label={bn ? "প্রধান ট্যাব" : "Primary Tabs"}
          className="flex gap-2 overflow-x-auto scrollbar-none pb-px"
        >
          {tabs.map((tab, idx) => {
            const isSelected = tab.id === activeTabId;
            const label = bn && tab.labelBn ? tab.labelBn : tab.label;
            const tabDomId = `${sectionId}-tab-${tab.id}`;
            const panelDomId = `${sectionId}-panel-${tab.id}`;

            return (
              <button
                key={tab.id}
                id={tabDomId}
                role="tab"
                type="button"
                aria-selected={isSelected}
                aria-controls={panelDomId}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => setActiveTabId(tab.id)}
                onKeyDown={(e) => handleTabKeyDown(e, idx)}
                className={`px-4 sm:px-6 py-3 text-sm sm:text-base font-semibold border-b-2 whitespace-nowrap transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded-t-lg ${
                  isSelected
                    ? "border-teal-600 text-teal-600 bg-teal-50/50"
                    : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Level 1 Header / Description */}
      {tabDesc && (
        <div className="mb-6 max-w-3xl">
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">{tabDesc}</p>
        </div>
      )}

      {/* Level 2: Nested Sub-tabs if present */}
      {innerTabs.length > 0 && (
        <div className="mb-8 bg-slate-50 p-1.5 rounded-xl border border-slate-200/80">
          <div
            ref={innerTabListRef}
            role="tablist"
            aria-label={bn ? "অভ্যন্তরীণ ট্যাব" : "Inner Sub-Tabs"}
            className="flex flex-wrap gap-1"
          >
            {innerTabs.map((it, idx) => {
              const isSelected = it.id === activeInnerTabId;
              const label = bn && it.labelBn ? it.labelBn : it.label;
              const innerTabDomId = `${sectionId}-innertab-${it.id}`;
              const innerPanelDomId = `${sectionId}-innerpanel-${it.id}`;

              return (
                <button
                  key={it.id}
                  id={innerTabDomId}
                  role="tab"
                  type="button"
                  aria-selected={isSelected}
                  aria-controls={innerPanelDomId}
                  tabIndex={isSelected ? 0 : -1}
                  onClick={() => setActiveInnerTabId(it.id)}
                  onKeyDown={(e) => handleInnerTabKeyDown(e, idx)}
                  className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                    isSelected
                      ? "bg-white text-navy-950 shadow-xs font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Tab Panel */}
      <div
        id={`${sectionId}-panel-${activeTabId}`}
        role="tabpanel"
        aria-labelledby={`${sectionId}-tab-${activeTabId}`}
        tabIndex={0}
        className="focus:outline-none"
      >
        {activeInnerTab && (
          <div className="mb-6">
            {activeInnerTab.description && (
              <p className="text-sm text-slate-500">
                {bn && activeInnerTab.descriptionBn ? activeInnerTab.descriptionBn : activeInnerTab.description}
              </p>
            )}
          </div>
        )}

        {/* Content Blocks for the Active Tab / Inner Tab */}
        {activeBlocks.length > 0 ? (
          <div className="space-y-8">
            {activeBlocks
              .filter((b) => b.visible !== false)
              .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
              .map((block) => (
                <RenderContentBlock key={block.id} block={block} bn={bn} />
              ))}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-8 text-center text-slate-500 text-sm">
            <p>{bn ? "এই ট্যাবের অধীনে এখনো কোনো উপাদান যোগ করা হয়নি।" : "No content blocks in this tab yet."}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Content Block Renderer for Tab hierarchy
// ------------------------------------------------------------

function RenderContentBlock({ block, bn }: { block: ContentBlockItem; bn: boolean }) {
  const title = bn && block.titleBn ? block.titleBn : block.title;
  const desc = bn && block.descriptionBn ? block.descriptionBn : block.description;

  switch (block.type) {
    case "rich_text": {
      const text = bn && block.richTextBn ? block.richTextBn : block.richText;
      return (
        <div className="prose max-w-none text-slate-700">
          {title && <h3 className="text-lg sm:text-xl font-bold text-navy-950 mb-2">{title}</h3>}
          {desc && <p className="text-slate-500 mb-4">{desc}</p>}
          <div className="whitespace-pre-line text-sm sm:text-base leading-relaxed">{text}</div>
        </div>
      );
    }

    case "image": {
      const url = block.imageUrl;
      const alt = bn && block.imageAltBn ? block.imageAltBn : block.imageAlt || title || "Tab Image";
      const caption = bn && block.captionBn ? block.captionBn : block.caption;
      if (!url) return null;

      return (
        <figure className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={alt} className="w-full max-h-[500px] object-cover" />
          {caption && (
            <figcaption className="p-3 text-xs text-slate-500 italic bg-white border-t border-slate-100 text-center">
              {caption}
            </figcaption>
          )}
        </figure>
      );
    }

    case "video": {
      const videoUrl = block.videoUrl;
      const poster = block.videoPoster;
      const caption = bn && block.videoCaptionBn ? block.videoCaptionBn : block.videoCaption;
      if (!videoUrl) return null;

      return (
        <div className="rounded-2xl overflow-hidden border border-slate-200 bg-navy-950">
          <div className="relative aspect-video">
            <video
              controls
              playsInline
              poster={poster || undefined}
              className="w-full h-full object-cover"
            >
              <source src={videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
          {caption && (
            <div className="p-3 text-xs text-slate-300 bg-navy-900 border-t border-white/10 text-center">
              {caption}
            </div>
          )}
        </div>
      );
    }

    case "cards": {
      const cards = block.cards || [];
      return (
        <div>
          {title && <h3 className="text-lg sm:text-xl font-bold text-navy-950 mb-2">{title}</h3>}
          {desc && <p className="text-slate-500 mb-6">{desc}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {cards.map((c, i) => {
              const cTitle = bn && c.titleBn ? c.titleBn : c.title;
              const cDesc = bn && c.descriptionBn ? c.descriptionBn : c.description;
              const cLinkLabel = bn && c.linkLabelBn ? c.linkLabelBn : c.linkLabel;

              return (
                <div
                  key={c.id || i}
                  className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col hover:border-teal-500/40 hover:shadow-md transition-all"
                >
                  {c.image && (
                    <div className="aspect-video rounded-lg overflow-hidden bg-slate-100 mb-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.image} alt={cTitle} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <h4 className="text-base font-bold text-slate-900 mb-2">{cTitle}</h4>
                  <p className="text-xs sm:text-sm text-slate-600 flex-1 leading-relaxed mb-4">{cDesc}</p>
                  {c.linkUrl && (
                    <Link
                      href={c.linkUrl}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors"
                    >
                      {cLinkLabel || (bn ? "আরও জানুন" : "Learn More")}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    case "list": {
      const items = block.items || [];
      return (
        <div>
          {title && <h3 className="text-lg sm:text-xl font-bold text-navy-950 mb-2">{title}</h3>}
          {desc && <p className="text-slate-500 mb-4">{desc}</p>}
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden">
            {items.map((it, idx) => {
              const text = bn && it.textBn ? it.textBn : it.text;
              const subtext = bn && it.subtextBn ? it.subtextBn : it.subtext;

              return (
                <li key={it.id || idx} className="p-4 flex items-start gap-3 hover:bg-slate-50/50 transition-colors">
                  <div className="w-2 h-2 rounded-full bg-teal-500 mt-2 shrink-0" />
                  <div className="flex-1">
                    {it.url ? (
                      <Link href={it.url} className="text-sm font-semibold text-teal-700 hover:underline">
                        {text}
                      </Link>
                    ) : (
                      <span className="text-sm font-semibold text-slate-900">{text}</span>
                    )}
                    {subtext && <p className="text-xs text-slate-500 mt-0.5">{subtext}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      );
    }

    case "downloads": {
      const downloads = block.downloads || [];
      return (
        <div>
          {title && <h3 className="text-lg sm:text-xl font-bold text-navy-950 mb-2">{title}</h3>}
          {desc && <p className="text-slate-500 mb-4">{desc}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {downloads.map((d, i) => {
              const dTitle = bn && d.titleBn ? d.titleBn : d.title;
              return (
                <a
                  key={d.id || i}
                  href={d.fileUrl}
                  download
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-teal-500/50 hover:shadow-xs transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate group-hover:text-teal-600 transition-colors">
                        {dTitle}
                      </p>
                      {(d.fileSize || d.fileType) && (
                        <p className="text-xs text-slate-400">
                          {[d.fileType, d.fileSize].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors shrink-0 ml-3" />
                </a>
              );
            })}
          </div>
        </div>
      );
    }

    case "cta": {
      const label = bn && block.ctaLabelBn ? block.ctaLabelBn : block.ctaLabel;
      const url = block.ctaUrl;
      const variant = block.ctaVariant || "primary";
      if (!label || !url) return null;

      const btnCls =
        variant === "secondary"
          ? "bg-slate-900 hover:bg-slate-800 text-white"
          : variant === "outline"
          ? "border-2 border-teal-600 text-teal-600 hover:bg-teal-50"
          : "bg-teal-600 hover:bg-teal-700 text-white shadow-xs";

      return (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-teal-50/30 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            {title && <h4 className="text-base sm:text-lg font-bold text-navy-950 mb-1">{title}</h4>}
            {desc && <p className="text-xs sm:text-sm text-slate-600 max-w-xl">{desc}</p>}
          </div>
          <Link
            href={url}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shrink-0 ${btnCls}`}
          >
            {label}
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      );
    }

    default:
      return null;
  }
}

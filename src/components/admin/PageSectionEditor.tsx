"use client";

// ============================================================
// PageSectionEditor — visual builder for CMS page sections.
// Talks to the hardened server actions in src/lib/actions/cms.ts
// (createSection / updateSection / deleteSection / duplicateSection /
// reorderSections). All JSON written through those actions is
// deep-sanitized server-side; this component only collects data.
// ============================================================

import { useEffect, useMemo, useState } from "react";
import {
  createSection,
  updateSection,
  deleteSection,
  duplicateSection,
  reorderSections,
} from "@/lib/actions/cms";
import MediaPickerModal from "./MediaPickerModal";
import TabsHierarchyEditor from "./TabsHierarchyEditor";

export interface SectionRow {
  id: string;
  pageId: string;
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

type FieldKind =
  | "text" | "textarea" | "url" | "number" | "select" | "image" | "paragraphs";

interface FieldDef {
  key: string;
  label: string;
  kind: FieldKind;
  target: "content" | "settings";
  options?: Array<{ value: string; label: string }>;
  itemFields?: FieldDef[];
  itemLabelKey?: string;
  help?: string;
}

interface SectionTypeDef {
  type: string;
  label: string;
  description: string;
  fields: FieldDef[];
}

// ---------- small helpers ----------
const obj = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" ? (v as Record<string, unknown>) : {};
const records = (v: unknown): Record<string, unknown>[] =>
  Array.isArray(v)
    ? ((v.filter((x) => x && typeof x === "object") as unknown[]) as Record<string, unknown>[])
    : [];
const asStr = (v: unknown): string => (typeof v === "string" ? v : "");
const tryParse = (raw: string): Record<string, unknown> => {
  try {
    const parsed = JSON.parse(raw || "{}");
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
};

const CARD_ITEM_FIELDS: FieldDef[] = [
  { key: "title", label: "Card title", kind: "text", target: "content" },
  { key: "description", label: "Card description", kind: "textarea", target: "content" },
  { key: "image", label: "Card image", kind: "image", target: "content" },
  { key: "imageAlt", label: "Image alt text", kind: "text", target: "content" },
  { key: "linkLabel", label: "Link label", kind: "text", target: "content" },
  { key: "linkUrl", label: "Link URL", kind: "url", target: "content" },
];

// Section type registry — builder types served by the public renderer.
export const SECTION_TYPE_DEFS: SectionTypeDef[] = [
  {
    type: "hero",
    label: "Hero",
    description: "Large banner with background image/video, CTAs, overlay and layout options.",
    fields: [
      { key: "eyebrow", label: "Eyebrow text", kind: "text", target: "content" },
      { key: "subtitle", label: "Subtitle", kind: "textarea", target: "content" },
      { key: "image", label: "Background image", kind: "image", target: "content" },
      { key: "backgroundVideo", label: "Background video URL (.mp4/.webm)", kind: "url", target: "content", help: "Upload to Media Library and copy URL or relative path" },
      { key: "posterImage", label: "Video poster / fallback image", kind: "image", target: "content" },
      { key: "imageAlt", label: "Media alt / accessibility text", kind: "text", target: "content" },
      { key: "overlayColor", label: "Overlay color", kind: "select", target: "content",
        options: [
          { value: "navy", label: "Navy blue (LENS default)" },
          { value: "dark", label: "Dark slate" },
          { value: "teal", label: "Teal" },
          { value: "none", label: "None / transparent" },
        ] },
      { key: "overlayOpacity", label: "Overlay opacity", kind: "select", target: "content",
        options: [
          { value: "0.2", label: "20% (Subtle)" },
          { value: "0.4", label: "40%" },
          { value: "0.6", label: "60% (Default)" },
          { value: "0.8", label: "80% (Dark)" },
          { value: "0.95", label: "95% (Almost solid)" },
        ] },
      { key: "layoutVariant", label: "Layout variant", kind: "select", target: "content",
        options: [
          { value: "default", label: "Default (Full-width text left)" },
          { value: "centered", label: "Centered" },
          { value: "split", label: "Split (Text left, Media right)" },
        ] },
      { key: "textAlignment", label: "Text alignment", kind: "select", target: "content",
        options: [
          { value: "left", label: "Left" },
          { value: "center", label: "Center" },
        ] },
      { key: "ctaLabel", label: "Primary button label", kind: "text", target: "content" },
      { key: "ctaUrl", label: "Primary button URL", kind: "url", target: "content" },
      { key: "ctaLabel2", label: "Secondary button label", kind: "text", target: "content" },
      { key: "ctaUrl2", label: "Secondary button URL", kind: "url", target: "content" },
      { key: "width", label: "Width", kind: "select", target: "settings",
        options: [
          { value: "default", label: "Default" },
          { value: "narrow", label: "Narrow" },
          { value: "wide", label: "Wide" },
        ] },
    ],
  },
  {
    type: "heading",
    label: "Heading",
    description: "Standalone heading block with optional eyebrow.",
    fields: [{ key: "eyebrow", label: "Eyebrow text", kind: "text", target: "content" }],
  },
  {
    type: "rich_text",
    label: "Rich Text",
    description: "Paragraphs with *italics*, **bold** and [links](/#).",
    fields: [{ key: "paragraphs", label: "Content", kind: "paragraphs", target: "content" }],
  },
  {
    type: "image_text",
    label: "Image + Text",
    description: "Two-column image beside paragraphs.",
    fields: [
      { key: "image", label: "Image", kind: "image", target: "content" },
      { key: "alt", label: "Image alt text", kind: "text", target: "content" },
      { key: "imagePosition", label: "Image position", kind: "select", target: "content",
        options: [
          { value: "left", label: "Left" },
          { value: "right", label: "Right" },
        ] },
      { key: "paragraphs", label: "Text", kind: "paragraphs", target: "content" },
    ],
  },
  {
    type: "banner",
    label: "Banner",
    description: "Slim hero-style banner with image or video.",
    fields: [
      { key: "eyebrow", label: "Eyebrow text", kind: "text", target: "content" },
      { key: "subtitle", label: "Subtitle", kind: "textarea", target: "content" },
      { key: "image", label: "Background image", kind: "image", target: "content" },
      { key: "backgroundVideo", label: "Background video URL", kind: "url", target: "content" },
      { key: "posterImage", label: "Video poster / fallback image", kind: "image", target: "content" },
      { key: "overlayColor", label: "Overlay color", kind: "select", target: "content",
        options: [
          { value: "navy", label: "Navy blue" },
          { value: "dark", label: "Dark slate" },
          { value: "teal", label: "Teal" },
          { value: "none", label: "None" },
        ] },
      { key: "overlayOpacity", label: "Overlay opacity", kind: "select", target: "content",
        options: [
          { value: "0.3", label: "30%" },
          { value: "0.6", label: "60% (Default)" },
          { value: "0.85", label: "85%" },
        ] },
      { key: "ctaLabel", label: "Button label", kind: "text", target: "content" },
      { key: "ctaUrl", label: "Button URL", kind: "url", target: "content" },
    ],
  },
  {
    type: "tabs",
    label: "Tabs & Nested Tabs",
    description: "Hierarchical tabs and sub-tabs with rich text, media, cards, lists, downloads and CTAs.",
    fields: [
      { key: "eyebrow", label: "Eyebrow / Badge", kind: "text", target: "content" },
      { key: "subtitle", label: "Section Subtitle", kind: "textarea", target: "content" },
    ],
  },
  {
    type: "cards",
    label: "Card Grid",
    description: "Grid of linked cards with images.",
    fields: [
      { key: "columns", label: "Columns", kind: "select", target: "content",
        options: [
          { value: "2", label: "2 columns" },
          { value: "3", label: "3 columns" },
          { value: "4", label: "4 columns" },
        ] },
      { key: "items", label: "Cards", kind: "text", target: "content",
        itemFields: CARD_ITEM_FIELDS, itemLabelKey: "title" },
    ],
  },
  {
    type: "gallery",
    label: "Image Gallery",
    description: "Responsive image grid.",
    fields: [
      { key: "columns", label: "Columns", kind: "select", target: "content",
        options: [
          { value: "2", label: "2 columns" },
          { value: "3", label: "3 columns" },
          { value: "4", label: "4 columns" },
        ] },
      { key: "images", label: "Images", kind: "text", target: "content",
        itemFields: [
          { key: "url", label: "Image", kind: "image", target: "content" },
          { key: "alt", label: "Alt text", kind: "text", target: "content" },
        ],
        itemLabelKey: "url" },
    ],
  },
  {
    type: "stats",
    label: "Stats",
    description: "Big number metrics (value + suffix + label).",
    fields: [
      { key: "items", label: "Metrics", kind: "text", target: "content",
        itemFields: [
          { key: "value", label: "Value", kind: "text", target: "content" },
          { key: "suffix", label: "Suffix (e.g. +, %)", kind: "text", target: "content" },
          { key: "label", label: "Label", kind: "text", target: "content" },
        ],
        itemLabelKey: "label" },
    ],
  },
  {
    type: "cta",
    label: "Call to Action",
    description: "Full-width CTA banner with a button.",
    fields: [
      { key: "title", label: "Title", kind: "text", target: "content" },
      { key: "description", label: "Description", kind: "textarea", target: "content" },
      { key: "buttonLabel", label: "Button label", kind: "text", target: "content" },
      { key: "buttonUrl", label: "Button URL", kind: "url", target: "content" },
      { key: "variant", label: "Variant", kind: "select", target: "content",
        options: [
          { value: "navy", label: "Navy" },
          { value: "solid", label: "Solid teal" },
        ] },
    ],
  },
  {
    type: "featured",
    label: "Featured Collection",
    description: "Pulls the latest published Research or Publications.",
    fields: [
      { key: "collection", label: "Collection", kind: "select", target: "content",
        options: [
          { value: "research", label: "Research" },
          { value: "publications", label: "Publications" },
        ] },
      { key: "limit", label: "Number of items (1-12)", kind: "number", target: "content" },
    ],
  },
  {
    type: "focus_areas",
    label: "Focus Areas",
    description: "Numbered focus-area cards.",
    fields: [
      { key: "items", label: "Items", kind: "text", target: "content",
        itemFields: [
          { key: "title", label: "Title", kind: "text", target: "content" },
          { key: "description", label: "Description", kind: "textarea", target: "content" },
        ],
        itemLabelKey: "title" },
    ],
  },
  { type: "clubs", label: "Clubs", description: "Lists LENS clubs automatically.", fields: [] },
  {
    type: "team",
    label: "Team",
    description: "Pulls team members from the Team collection.",
    fields: [{ key: "limit", label: "Number of members (1-24)", kind: "number", target: "content" }],
  },
  {
    type: "embed",
    label: "Embed",
    description: "YouTube/Vimeo video or Google Maps iframe.",
    fields: [
      { key: "url", label: "Embed URL", kind: "url", target: "content",
        help: "Allowed hosts: youtube.com, youtube-nocookie.com, youtu.be, player.vimeo.com, google.com/maps" },
    ],
  },
  {
    type: "video",
    label: "Video (uploaded file)",
    description: "Plays an uploaded MP4/WebM file from the media library.",
    fields: [
      { key: "url", label: "Video URL", kind: "url", target: "content",
        help: "Upload in Media Library first, then paste the file URL. Allowed: same-origin paths or https URLs ending in .mp4 or .webm" },
      { key: "posterImage", label: "Poster image", kind: "image", target: "content",
        help: "Optional poster shown before playback." },
      { key: "caption", label: "Caption", kind: "text", target: "content" },
    ],
  },
  {
    type: "faq",
    label: "FAQ",
    description: "Accordion-style frequently asked questions.",
    fields: [
      { key: "items", label: "FAQ Items", kind: "text", target: "content",
        itemFields: [
          { key: "question", label: "Question", kind: "text", target: "content" },
          { key: "answer", label: "Answer", kind: "textarea", target: "content" },
        ],
        itemLabelKey: "question" },
    ],
  },
  {
    type: "timeline",
    label: "Timeline",
    description: "Chronological timeline with dates and events.",
    fields: [
      { key: "items", label: "Timeline Items", kind: "text", target: "content",
        itemFields: [
          { key: "date", label: "Date", kind: "text", target: "content" },
          { key: "title", label: "Title", kind: "text", target: "content" },
          { key: "description", label: "Description", kind: "textarea", target: "content" },
        ],
        itemLabelKey: "title" },
    ],
  },
  {
    type: "table",
    label: "Table",
    description: "Structured data table with headers and rows.",
    fields: [
      { key: "headers", label: "Column Headers (comma-separated)", kind: "text", target: "content" },
      { key: "rows", label: "Rows", kind: "text", target: "content",
        itemFields: [
          { key: "cells", label: "Row Cells (comma-separated)", kind: "text", target: "content" },
        ],
        itemLabelKey: "cells" },
    ],
  },
  {
    type: "contact_form",
    label: "Contact Form",
    description: "Contact form with configurable fields.",
    fields: [
      { key: "title", label: "Form Title", kind: "text", target: "content" },
      { key: "description", label: "Form Description", kind: "textarea", target: "content" },
      { key: "submitLabel", label: "Submit Button Label", kind: "text", target: "content" },
      { key: "successMessage", label: "Success Message", kind: "text", target: "content" },
      { key: "errorMessage", label: "Error Message", kind: "text", target: "content" },
      { key: "fields", label: "Form Fields", kind: "text", target: "content",
        itemFields: [
          { key: "name", label: "Field Name", kind: "text", target: "content" },
          { key: "label", label: "Field Label", kind: "text", target: "content" },
          { key: "type", label: "Field Type", kind: "select", target: "content",
            options: [
              { value: "text", label: "Text" },
              { value: "email", label: "Email" },
              { value: "textarea", label: "Textarea" },
              { value: "select", label: "Select" },
            ]},
          { key: "required", label: "Required", kind: "text", target: "content" },
          { key: "placeholder", label: "Placeholder", kind: "text", target: "content" },
        ],
        itemLabelKey: "label" },
    ],
  },
  {
    type: "newsletter",
    label: "Newsletter Signup",
    description: "Email newsletter subscription form.",
    fields: [
      { key: "title", label: "Title", kind: "text", target: "content" },
      { key: "description", label: "Description", kind: "textarea", target: "content" },
      { key: "placeholder", label: "Email Placeholder", kind: "text", target: "content" },
      { key: "buttonLabel", label: "Subscribe Button Label", kind: "text", target: "content" },
      { key: "successMessage", label: "Success Message", kind: "text", target: "content" },
      { key: "errorMessage", label: "Error Message", kind: "text", target: "content" },
      { key: "disclaimer", label: "Disclaimer Text", kind: "textarea", target: "content" },
    ],
  },
  {
    type: "search_filter",
    label: "Search & Filter",
    description: "Search and filter interface for content collections.",
    fields: [
      { key: "placeholder", label: "Search Placeholder", kind: "text", target: "content" },
      { key: "collection", label: "Collection", kind: "select", target: "content",
        options: [
          { value: "research", label: "Research" },
          { value: "publications", label: "Publications" },
          { value: "events", label: "Events" },
          { value: "blog", label: "Blog" },
          { value: "media", label: "Media" },
          { value: "resources", label: "Resources" },
        ]},
      { key: "filters", label: "Filter Facets", kind: "text", target: "content",
        itemFields: [
          { key: "key", label: "Filter Key", kind: "text", target: "content" },
          { key: "label", label: "Filter Label", kind: "text", target: "content" },
          { key: "type", label: "Filter Type", kind: "select", target: "content",
            options: [
              { value: "category", label: "Category" },
              { value: "tag", label: "Tag" },
              { value: "date", label: "Date Range" },
            ]},
        ],
        itemLabelKey: "label" },
    ],
  },
  {
    type: "testimonial",
    label: "Testimonial",
    description: "Quote with author attribution.",
    fields: [
      { key: "items", label: "Testimonials", kind: "text", target: "content",
        itemFields: [
          { key: "quote", label: "Quote", kind: "textarea", target: "content" },
          { key: "author", label: "Author Name", kind: "text", target: "content" },
          { key: "role", label: "Author Role/Title", kind: "text", target: "content" },
          { key: "image", label: "Author Image", kind: "image", target: "content" },
        ],
        itemLabelKey: "author" },
    ],
  },
  {
    type: "logo_cloud",
    label: "Logo Cloud",
    description: "Grid of partner/client logos.",
    fields: [
      { key: "items", label: "Logos", kind: "text", target: "content",
        itemFields: [
          { key: "image", label: "Logo Image", kind: "image", target: "content" },
          { key: "alt", label: "Alt Text", kind: "text", target: "content" },
          { key: "url", label: "Link URL", kind: "url", target: "content" },
        ],
        itemLabelKey: "alt" },
    ],
  },
  {
    type: "accordion",
    label: "Accordion",
    description: "Collapsible content sections.",
    fields: [
      { key: "items", label: "Accordion Items", kind: "text", target: "content",
        itemFields: [
          { key: "title", label: "Title", kind: "text", target: "content" },
          { key: "content", label: "Content", kind: "textarea", target: "content" },
        ],
        itemLabelKey: "title" },
    ],
  },
  {
    type: "program_list",
    label: "Program List",
    description: "Automatically displays published programs in a grid.",
    fields: [
      { key: "limit", label: "Number of programs (1-24)", kind: "number", target: "content" },
      { key: "category", label: "Filter by Category (optional)", kind: "text", target: "content" },
    ],
  },
  {
    type: "event_list",
    label: "Event List",
    description: "Automatically displays published events in a timeline.",
    fields: [
      { key: "limit", label: "Number of events (1-24)", kind: "number", target: "content" },
      { key: "upcomingOnly", label: "Upcoming only", kind: "text", target: "content" },
    ],
  },
  {
    type: "publication_list",
    label: "Publication List",
    description: "Automatically displays published publications in a grid.",
    fields: [
      { key: "limit", label: "Number of publications (1-24)", kind: "number", target: "content" },
      { key: "type", label: "Filter by Type (optional)", kind: "text", target: "content" },
    ],
  },
  {
    type: "media_list",
    label: "Media List",
    description: "Automatically displays published media items in a grid.",
    fields: [
      { key: "limit", label: "Number of media items (1-24)", kind: "number", target: "content" },
      { key: "type", label: "Filter by Type (optional)", kind: "text", target: "content" },
    ],
  },
  {
    type: "blog_list",
    label: "Blog List",
    description: "Automatically displays published blog posts in a grid.",
    fields: [
      { key: "limit", label: "Number of blog posts (1-24)", kind: "number", target: "content" },
      { key: "category", label: "Filter by Category (optional)", kind: "text", target: "content" },
    ],
  },
  {
    type: "resource_list",
    label: "Resource List",
    description: "Automatically displays published resources in a grid.",
    fields: [
      { key: "limit", label: "Number of resources (1-24)", kind: "number", target: "content" },
      { key: "category", label: "Filter by Category (optional)", kind: "text", target: "content" },
    ],
  },
  {
    type: "career_list",
    label: "Career List",
    description: "Automatically displays open career positions.",
    fields: [
      { key: "limit", label: "Number of positions (1-24)", kind: "number", target: "content" },
      { key: "department", label: "Filter by Department (optional)", kind: "text", target: "content" },
    ],
  },
  {
    type: "researcher_grid",
    label: "Researcher Grid",
    description: "Automatically displays featured researchers in a grid.",
    fields: [
      { key: "limit", label: "Number of researchers (1-24)", kind: "number", target: "content" },
      { key: "featuredOnly", label: "Featured only", kind: "text", target: "content" },
    ],
  },
];

const MACHINE_TYPES = new Set([
  "focus", "featured_research", "impact", "events_newsletter", "indexing_scanner",
]);

// ============================================================
// Main editor
// ============================================================

export default function PageSectionEditor({ pageId }: { pageId: string }) {
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const load = async () => {
    setError(null);
    try {
      const res = await fetch(`/api/admin/pages?id=${pageId}`);
      const d = await res.json();
      if (!res.ok || d.error) throw new Error(d.error || "Failed to load page");
      setSections(d.page?.sections ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sections");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [pageId]);

  const patch = (id: string, row: Partial<SectionRow>) =>
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...row } : s)));

  const add = async (type: string) => {
    setError(null);
    try {
      const def = SECTION_TYPE_DEFS.find((s) => s.type === type);
      const content =
        type === "featured" ? JSON.stringify({ collection: "research", limit: 3 }) : "{}";
      const created = await createSection(pageId, {
        type,
        title: def?.label || type,
        visible: true,
        content,
      });
      await load();
      // Schedule the expanded state update after the current React
      // update batch has flushed (i.e. after the load() state change
      // has been processed by the DOM). This prevents Playwright’s
      // waitForSelector from firing before the SectionForm with title
      // fields is visible in the DOM.
      void Promise.resolve().then(() => setExpandedId(created.id));
      setShowAdd(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Add failed");
    }
  };

  const save = async (id: string, values: {
    title: string; titleBn: string; description: string; descriptionBn: string;
    visible: boolean; settings: string; content: string; contentBn: string;
  }) => {
    const updated = await updateSection(id, values);
    patch(id, {
      title: updated.title, titleBn: updated.titleBn,
      description: updated.description, descriptionBn: updated.descriptionBn,
      visible: updated.visible, settings: updated.settings,
      content: updated.content, contentBn: updated.contentBn,
    });
    setExpandedId(null);
  };

  const removeSection = async (row: SectionRow) => {
    try {
      await deleteSection(row.id);
      setSections((prev) => prev.filter((s) => s.id !== row.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const duplicateSectionRow = async (row: SectionRow) => {
    try {
      await duplicateSection(row.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Duplicate failed");
    }
  };

  const move = async (row: SectionRow, dir: -1 | 1) => {
    const ordered = [...sections].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = ordered.findIndex((s) => s.id === row.id);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= ordered.length) return;
    const next = [...ordered];
    [next[idx], next[swap]] = [next[swap], next[idx]];
    next.forEach((s, i) => patch(s.id, { sortOrder: i })); // optimistic
    try {
      await reorderSections(pageId, next.map((s) => s.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reorder failed");
      await load();
    }
  };

  const ordered = useMemo(
    () => [...sections].sort((a, b) => a.sortOrder - b.sortOrder),
    [sections]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Page Sections</h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Sections render top-to-bottom on the public page. Hidden sections stay editable but don&apos;t render.
          </p>
        </div>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="px-3 py-2 bg-teal-50 border border-teal-200 text-teal-700 rounded-lg text-xs font-semibold hover:bg-teal-100 shadow-2xs transition-colors"
        >
          + Add Section
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}

      {showAdd && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {SECTION_TYPE_DEFS.map((def) => (
              <button
                key={def.type}
                onClick={() => add(def.type)}
                className="text-left p-3 rounded-lg bg-white border border-slate-200 hover:border-teal-500 hover:shadow-xs transition-all"
              >
                <p className="text-sm font-semibold text-slate-900">{def.label}</p>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{def.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-4 rounded-xl bg-white border border-slate-200 animate-pulse text-slate-500 text-sm">
          Loading sections…
        </div>
      ) : ordered.length === 0 ? (
        <div className="p-8 text-center rounded-xl bg-white border border-dashed border-slate-300">
          <p className="text-slate-400 text-sm">No sections yet. Add a Hero or Heading to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {ordered.map((row, idx) => (
            <SectionRowCard
              key={row.id}
              row={row}
              index={idx}
              last={idx === ordered.length - 1}
              expanded={expandedId === row.id}
              onToggleExpand={() => setExpandedId(expandedId === row.id ? null : row.id)}
              onSave={save}
              onDelete={removeSection}
              onDuplicate={duplicateSectionRow}
              onMove={move}
              machine={MACHINE_TYPES.has(row.type)}
            />
          ))}
        </div>
      )}
    </div>
  );
}


function getPlaceholder(field: FieldDef): string | undefined {
  if (field.kind === "url") return "https://... or /path";
  if (field.kind === "text" || field.kind === "textarea") return field.label;
  return undefined;
}


// ============================================================
// One section row (collapsed listing + expanded editor)
// ============================================================

interface RowProps {
  row: SectionRow;
  index: number;
  last: boolean;
  expanded: boolean;
  machine: boolean;
  onToggleExpand: () => void;
  onSave: (id: string, values: SectionRow) => Promise<void>;
  onDelete: (row: SectionRow) => Promise<void>;
  onDuplicate: (row: SectionRow) => Promise<void>;
  onMove: (row: SectionRow, dir: -1 | 1) => Promise<void>;
}

function SectionRowCard(props: RowProps) {
  const { row, index, last, expanded, machine, onToggleExpand } = props;
  const typeDef = SECTION_TYPE_DEFS.find((d) => d.type === row.type);

  return (
    <div className={`rounded-xl border transition-colors ${expanded ? "bg-slate-50 border-teal-500 shadow-xs" : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs"}`}>
      <div className="flex items-center gap-3 p-3">
        <span className="w-7 h-7 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-[11px] text-slate-600 font-semibold">
          {index + 1}
        </span>
        <button onClick={onToggleExpand} className="flex-1 text-left min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate">
            {row.title || typeDef?.label || row.type}
            <span className="ml-2 text-[10px] uppercase tracking-wider text-teal-600 font-semibold">{row.type}</span>
          </p>
          <p className="text-[11px] text-slate-500 truncate">{typeDef?.description || ""}</p>
        </button>
        {!expanded && (
          <span
            className={`text-[10px] px-2 py-1 rounded-full border ${row.visible ? "text-emerald-700 border-emerald-200 bg-emerald-50" : "text-slate-500 border-slate-200 bg-slate-100"}`}
          >
            {row.visible ? "visible" : "hidden"}
          </span>
        )}
        <button
          onClick={() => props.onMove(row, -1)}
          disabled={index === 0}
          className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 transition-colors"
          title="Move up"
        >↑</button>
        <button
          onClick={() => props.onMove(row, 1)}
          disabled={last}
          className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 transition-colors"
          title="Move down"
        >↓</button>
      </div>

      {expanded && (
        <div className="px-3 pb-3">
          {machine ? (
            <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              This homepage section is managed by the Homepage Editor. Its fields are rendered by the homepage template.
            </p>
          ) : (
            <SectionForm {...props} />
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Per-section edit form, generated from the type descriptor.
// ============================================================

function SectionForm(props: RowProps) {
  const { row, onSave, onDuplicate, onDelete } = props;
  const typeDef = SECTION_TYPE_DEFS.find((d) => d.type === row.type);
  const [draft, setDraft] = useState<SectionRow>({ ...row });
  const [activeLang, setActiveLang] = useState<"en" | "bn">("en");
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [pickerKey, setPickerKey] = useState<string | null>(null);

  const content = useMemo(() => tryParse(draft.content), [draft.content]);
  const settings = useMemo(() => tryParse(draft.settings), [draft.settings]);
  const contentBn = useMemo(() => tryParse(draft.contentBn), [draft.contentBn]);

  const setJson = (target: "content" | "settings" | "contentBn", next: Record<string, unknown>) => {
    const serialized = JSON.stringify(next);
    setDraft((d) => ({ ...d, [target]: serialized }));
  };

  const getRoot = (target: "content" | "settings") => (target === "settings" ? settings : content);

  const setValue = (field: FieldDef, value: unknown, lang: "en" | "bn" = activeLang) => {
    if (field.target === "settings") {
      setJson("settings", { ...settings, [field.key]: value });
    } else if (lang === "bn") {
      setJson("contentBn", { ...contentBn, [field.key]: value });
    } else {
      setJson("content", { ...content, [field.key]: value });
    }
  };

  const getItemList = (field: FieldDef, lang: "en" | "bn" = activeLang) => {
    if (lang === "bn") {
      const bnList = records(contentBn[field.key]);
      const enList = records(content[field.key]);
      if (bnList.length < enList.length) {
        const padded = [...bnList];
        for (let i = bnList.length; i < enList.length; i++) {
          const blank: Record<string, unknown> = {};
          for (const f of field.itemFields ?? []) blank[f.key] = f.kind === "number" ? 0 : "";
          padded.push(blank);
        }
        return padded;
      }
      return bnList;
    }
    return records(obj(getRoot(field.target))[field.key]);
  };

  const setItemList = (field: FieldDef, list: Record<string, unknown>[], lang: "en" | "bn" = activeLang) => {
    if (lang === "bn") {
      setJson("contentBn", { ...contentBn, [field.key]: list });
    } else {
      setJson(field.target, { ...obj(getRoot(field.target)), [field.key]: list });
    }
  };

  const setItemValue = (field: FieldDef, idx: number, key: string, value: unknown, lang: "en" | "bn" = activeLang) => {
    const list = getItemList(field, lang);
    setItemList(
      field,
      list.map((it, i) => (i === idx ? { ...it, [key]: value } : it)),
      lang
    );
  };

  const addItem = (field: FieldDef) => {
    const blank: Record<string, unknown> = {};
    for (const f of field.itemFields ?? []) blank[f.key] = f.kind === "number" ? 0 : "";
    setItemList(field, [...getItemList(field, "en"), blank], "en");
    if (records(contentBn[field.key]).length > 0) {
      setItemList(field, [...getItemList(field, "bn"), { ...blank }], "bn");
    }
  };

  const removeItem = (field: FieldDef, idx: number) => {
    setItemList(field, getItemList(field, "en").filter((_, i) => i !== idx), "en");
    if (records(contentBn[field.key]).length > 0) {
      setItemList(field, getItemList(field, "bn").filter((_, i) => i !== idx), "bn");
    }
  };

  const moveItem = (field: FieldDef, idx: number, dir: -1 | 1) => {
    const list = getItemList(field, "en");
    const swap = idx + dir;
    if (swap < 0 || swap >= list.length) return;
    const next = [...list];
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setItemList(field, next, "en");

    const bnList = getItemList(field, "bn");
    if (bnList.length === list.length) {
      const nextBn = [...bnList];
      [nextBn[idx], nextBn[swap]] = [nextBn[swap], nextBn[idx]];
      setItemList(field, nextBn, "bn");
    }
  };

  /** pickerKey format:
   *  "content:key" (root)  or  "content:key:idx:itemKey" (list item) */
  const onPick = (url: string) => {
    if (!pickerKey) return;
    const parts = pickerKey.split(":");
    const [target, key] = parts;
    const field = typeDef?.fields.find((f) => f.key === key);
    if (!field) { setPickerKey(null); return; }
    const isBn = target === "contentBn";
    if (parts.length === 4) {
      setItemValue(field, Number(parts[2]), parts[3], url, isBn ? "bn" : "en");
    } else {
      setValue(field, url, isBn ? "bn" : "en");
    }
    setPickerKey(null);
  };

  const fields = typeDef?.fields ?? [];

  const translationPercent = useMemo(() => {
    let total = 0;
    let translated = 0;
    if (draft.title?.trim()) {
      total++;
      if (draft.titleBn?.trim()) translated++;
    }
    if (draft.description?.trim()) {
      total++;
      if (draft.descriptionBn?.trim()) translated++;
    }
    for (const f of fields) {
      if (f.target !== "content") continue;
      if (f.kind === "text" || f.kind === "textarea" || f.kind === "paragraphs") {
        const enVal = asStr(content[f.key]);
        if (enVal.trim()) {
          total++;
          if (asStr(contentBn[f.key]).trim()) translated++;
        }
      } else if (f.itemFields) {
        const enItems = records(content[f.key]);
        const bnItems = records(contentBn[f.key]);
        if (enItems.length > 0) {
          total += enItems.length;
          for (let i = 0; i < enItems.length; i++) {
            const bnItem = bnItems[i];
            if (bnItem && Object.values(bnItem).some((v) => typeof v === "string" && v.trim())) {
              translated++;
            }
          }
        }
      }
    }
    if (total === 0) return 100;
    return Math.round((translated / total) * 100);
  }, [draft.title, draft.titleBn, draft.description, draft.descriptionBn, content, contentBn, fields]);

  const handleSave = async () => {
    setSaving(true);
    setLocalError(null);
    try {
      await onSave(row.id, draft);
    } catch (err) {
      setLocalError(
        err instanceof Error
          ? `${err.message} — check JSON syntax and URLs`
          : "Save failed"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {localError && (
        <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">{localError}</div>
      )}

      {/* Language Switcher & Translation Progress */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveLang("en")}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              activeLang === "en"
                ? "bg-navy-950 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            English (EN)
          </button>
          <button
            type="button"
            onClick={() => setActiveLang("bn")}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all font-bangla ${
              activeLang === "bn"
                ? "bg-teal-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            বাংলা (BN)
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Translation:</span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
              translationPercent === 100
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : translationPercent > 0
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-slate-100 text-slate-600 border-slate-200"
            }`}
          >
            {translationPercent}% Translated
          </span>
        </div>
      </div>

      {/* Title & Description */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input
          label="Section title (EN)"
          value={draft.title}
          onChange={(v) => setDraft({ ...draft, title: v })}
          highlight={activeLang === "en"}
        />
        <Input
          label="Section title (বাংলা)"
          value={draft.titleBn}
          onChange={(v) => setDraft({ ...draft, titleBn: v })}
          bangla
          highlight={activeLang === "bn"}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Textarea
          label="Section description (EN)"
          value={draft.description}
          onChange={(v) => setDraft({ ...draft, description: v })}
          rows={2}
          highlight={activeLang === "en"}
        />
        <Textarea
          label="Section description (বাংলা)"
          value={draft.descriptionBn}
          onChange={(v) => setDraft({ ...draft, descriptionBn: v })}
          rows={2}
          bangla
          highlight={activeLang === "bn"}
        />
      </div>

      <label className="flex items-center gap-2 text-xs text-slate-700 font-medium">
        <input
          type="checkbox"
          checked={draft.visible}
          onChange={(e) => setDraft({ ...draft, visible: e.target.checked })}
          className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
        />
        Visible on public page
      </label>

      {/* Tabs and Nested Tabs Hierarchy Builder */}
      {(draft.type === "tabs" || draft.type === "nested_tabs") && (
        <div className="pt-2">
          <TabsHierarchyEditor
            value={Array.isArray(content.tabs) ? (content.tabs as any) : []}
            valueBn={Array.isArray(contentBn.tabs) ? (contentBn.tabs as any) : []}
            activeLanguage={activeLang}
            onChange={(newEn, newBn) => {
              setJson("content", { ...content, tabs: newEn });
              setJson("contentBn", { ...contentBn, tabs: newBn });
            }}
          />
        </div>
      )}

      {/* Dynamic Type Fields */}
      {fields.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {fields.map((field) => {
            const isBn = activeLang === "bn";
            const isSettings = field.target === "settings";

            if (field.itemFields) {
              const list = getItemList(field, activeLang);
              const enList = getItemList(field, "en");
              return (
                <ItemsEditor
                  key={field.key}
                  field={field}
                  list={list}
                  enList={enList}
                  activeLang={activeLang}
                  add={() => addItem(field)}
                  remove={(i) => removeItem(field, i)}
                  move={(i, d) => moveItem(field, i, d)}
                  setItemValue={(i, k, v) => setItemValue(field, i, k, v, activeLang)}
                  openPicker={(k) => setPickerKey(`${isBn ? "contentBn" : "content"}:${field.key}:${k}`)}
                />
              );
            }

            if (field.kind === "paragraphs") {
              const currentVal = isBn
                ? (contentBn[field.key] !== undefined ? contentBn[field.key] : "")
                : obj(getRoot(field.target))[field.key];
              const enVal = content[field.key];
              const enRef = Array.isArray(enVal) ? enVal.join("\n\n") : asStr(enVal);
              return (
                <ParagraphsEditor
                  key={field.key}
                  field={field}
                  value={currentVal}
                  enReference={isBn ? enRef : undefined}
                  bangla={isBn}
                  onChange={(list) => setValue(field, list, activeLang)}
                />
              );
            }

            // Normal TypeField
            const val = isSettings
              ? settings[field.key]
              : isBn
              ? (contentBn[field.key] !== undefined ? contentBn[field.key] : "")
              : content[field.key];
            const enRef = isBn && !isSettings ? asStr(content[field.key]) : undefined;

            return (
              <TypeField
                key={field.key}
                field={field}
                value={val}
                enReference={enRef}
                bangla={isBn && !isSettings}
                onChange={(v) => setValue(field, v, activeLang)}
                openPicker={() => setPickerKey(`${isBn && !isSettings ? "contentBn" : "content"}:${field.key}`)}
              />
            );
          })}
        </div>
      )}

      {/* Advanced: raw Bengali content override */}
      <details className="rounded-lg bg-slate-50 border border-slate-200 p-3">
        <summary className="text-xs font-semibold text-slate-700 cursor-pointer">
          Bengali content override (advanced JSON)
        </summary>
        <p className="text-[11px] text-slate-500 mt-1.5">
          Directly synced with the Bengali inputs above. You can paste custom JSON shapes here, e.g. <code>{`{"subtitle":"..."}`}</code>. Invalid URLs or script tags are rejected on save.
        </p>
        <textarea
          rows={4}
          value={draft.contentBn}
          onChange={(e) => setDraft({ ...draft, contentBn: e.target.value })}
          className="mt-2 w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
          placeholder="{}"
        />
      </details>

      {/* Media picker overlay */}
      {pickerKey && (
        <MediaPickerModal open onClose={() => setPickerKey(null)} onSelect={onPick} title="Select Image or Media" />
      )}

      <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onDuplicate(row)}
            className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors shadow-2xs"
          >
            Duplicate
          </button>
          <button
            type="button"
            onClick={() => { if (confirm(`Delete "${draft.title || row.type}"? This cannot be undone.`)) onDelete(row); }}
            className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-xs hover:bg-red-500/20 transition-colors"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-700 transition-colors shadow-xs disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Section"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Field renderers
// ============================================================

const inputCls =
  "w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors";

function TypeField({
  field,
  value,
  onChange,
  openPicker,
  enReference,
  bangla,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
  openPicker: () => void;
  enReference?: string;
  bangla?: boolean;
}) {
  const s = asStr(value);

  if (field.kind === "image") {
    return (
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">{field.label}</label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={s}
            onChange={(e) => onChange(e.target.value)}
            placeholder={enReference ? `EN: ${enReference}` : "Image URL or path"}
            className={inputCls}
          />
          <button
            type="button"
            onClick={openPicker}
            className="px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors whitespace-nowrap"
          >
            Browse…
          </button>
        </div>
        {enReference && !s && (
          <p className="text-[11px] text-slate-400 mt-1 truncate">Using English image: {enReference}</p>
        )}
        {s && /^https?:\/\/|^\//.test(s) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s} alt="" className="mt-2 max-h-20 rounded-lg border border-slate-200" />
        )}
      </div>
    );
  }

  if (field.kind === "text") {
    return (
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
          {field.label} {bangla && <span className="text-teal-600 text-[10px] lowercase">(বাংলা)</span>}
        </label>
        <input
          type="text"
          value={s}
          onChange={(e) => onChange(e.target.value)}
          placeholder={enReference ? `EN: ${enReference}` : field.label}
          className={`${inputCls} ${bangla ? "font-bangla" : ""}`}
        />
        {enReference && (
          <p className="text-[11px] text-slate-400 mt-1 truncate">EN: {enReference}</p>
        )}
      </div>
    );
  }

  if (field.kind === "select") {
    return (
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">{field.label}</label>
        <select value={s} onChange={(e) => onChange(e.target.value)} className={inputCls}>
          {(field.options ?? []).map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    );
  }

  if (field.kind === "number") {
    const num = typeof value === "number" ? value : parseInt(s) || 0;
    return (
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">{field.label}</label>
        <input
          type="number"
          value={num}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          className={inputCls}
        />
      </div>
    );
  }

  if (field.kind === "textarea") {
    return (
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
          {field.label} {bangla && <span className="text-teal-600 text-[10px] lowercase">(বাংলা)</span>}
        </label>
        <textarea
          rows={3}
          value={s}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputCls} resize-y ${bangla ? "font-bangla" : ""}`}
          placeholder={enReference ? `EN: ${enReference}` : field.label}
        />
        {enReference && (
          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">EN: {enReference}</p>
        )}
      </div>
    );
  }

  if (field.kind === "url") {
    return (
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">{field.label}</label>
        <input
          type="text"
          value={s}
          onChange={(e) => onChange(e.target.value)}
          placeholder={enReference ? `EN: ${enReference}` : "https://… or /path"}
          className={inputCls}
        />
        {enReference && !s && (
          <p className="text-[11px] text-slate-400 mt-1 truncate">Using EN link: {enReference}</p>
        )}
        {field.help && <p className="text-[11px] text-slate-500 mt-1">{field.help}</p>}
      </div>
    );
  }

  if (field.kind === "paragraphs") {
    return (
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
          {field.label} {bangla && <span className="text-teal-600 text-[10px] lowercase">(বাংলা)</span>}
        </label>
        <textarea
          rows={3}
          value={s}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputCls} resize-y ${bangla ? "font-bangla" : ""}`}
          placeholder="Blank line = new paragraph"
        />
      </div>
    );
  }

  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">{field.label}</label>
      <input
        type="text"
        value={s}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputCls} ${bangla ? "font-bangla" : ""}`}
      />
      {field.help && <p className="text-[11px] text-slate-500 mt-1">{field.help}</p>}
    </div>
  );
}

function ParagraphsEditor({
  field,
  value,
  onChange,
  enReference,
  bangla,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (list: string[]) => void;
  enReference?: string;
  bangla?: boolean;
}) {
  const initial = Array.isArray(value)
    ? (value as unknown[]).filter((v): v is string => typeof v === "string").join("\n\n")
    : typeof value === "string" ? value : "";
  const [text, setText] = useState(initial);

  useEffect(() => {
    setText(initial);
  }, [initial]);

  const commit = (next: string) => {
    setText(next);
    onChange(next.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean));
  };

  return (
    <div className="md:col-span-2">
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
          {field.label} {bangla && <span className="text-teal-600 text-[10px] lowercase">(বাংলা)</span>}
        </label>
        {bangla && enReference && (
          <span className="text-[11px] text-slate-400">English text available below for reference</span>
        )}
      </div>
      <textarea
        rows={6}
        value={text}
        onChange={(e) => commit(e.target.value)}
        className={`${inputCls} resize-y ${bangla ? "font-bangla" : ""}`}
        placeholder={enReference ? `বাংলা অনুচ্ছেদ লিখুন...\n\n(Reference: ${enReference.slice(0, 80)}...)` : "Blank line = new paragraph"}
      />
      {bangla && enReference && (
        <details className="mt-1 text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-200">
          <summary className="cursor-pointer font-medium text-slate-600">View English reference text</summary>
          <div className="mt-1 whitespace-pre-line text-slate-700">{enReference}</div>
        </details>
      )}
      <p className="text-[11px] text-slate-500 mt-1">
        Blank line = new paragraph. Supports *italic*, **bold**, [label](/link).
      </p>
    </div>
  );
}

function ItemsEditor({
  field,
  list,
  enList,
  activeLang,
  add,
  remove,
  move,
  setItemValue,
  openPicker,
}: {
  field: FieldDef;
  list: Record<string, unknown>[];
  enList: Record<string, unknown>[];
  activeLang: "en" | "bn";
  add: () => void;
  remove: (idx: number) => void;
  move: (idx: number, dir: -1 | 1) => void;
  setItemValue: (idx: number, key: string, v: unknown) => void;
  openPicker: (key: string) => void;
}) {
  return (
    <div className="md:col-span-2">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
          {field.label} {activeLang === "bn" && <span className="text-teal-600 text-[10px] lowercase">(বাংলা)</span>}
        </label>
        <button
          type="button"
          onClick={add}
          className="text-[11px] px-2.5 py-1 rounded-md bg-teal-50 border border-teal-200 text-teal-700 hover:bg-teal-100 transition-colors font-medium"
        >
          + Add item
        </button>
      </div>
      <div className="space-y-2">
        {list.map((item, idx) => (
          <ItemCard
            key={idx}
            field={field}
            fields={field.itemFields ?? []}
            item={item}
            enItem={enList[idx] || {}}
            activeLang={activeLang}
            index={idx}
            listLen={list.length}
            setItemValue={setItemValue}
            removeItem={remove}
            moveItem={move}
            openPicker={openPicker}
          />
        ))}
      </div>
      {list.length === 0 && <p className="text-[11px] text-slate-500">No items yet — click “Add item”.</p>}
    </div>
  );
}

function ItemCard({
  field,
  fields,
  item,
  enItem,
  activeLang,
  index,
  listLen,
  setItemValue,
  removeItem,
  moveItem,
  openPicker,
}: {
  field: FieldDef;
  fields: FieldDef[];
  item: Record<string, unknown>;
  enItem: Record<string, unknown>;
  activeLang: "en" | "bn";
  index: number;
  listLen: number;
  setItemValue: (idx: number, key: string, v: unknown) => void;
  removeItem: (idx: number) => void;
  moveItem: (idx: number, dir: -1 | 1) => void;
  openPicker: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const itemCls =
    "w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors";

  const previewKey = field.itemLabelKey ?? "title";
  const preview = asStr(item[previewKey]).slice(0, 60) || asStr(enItem[previewKey]).slice(0, 60) || `Item ${index + 1}`;

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-2xs">
      <div className="flex items-center gap-2 px-3 py-2">
        <button type="button" onClick={() => setOpen((v) => !v)} className="flex-1 text-left min-w-0">
          <p className="text-xs font-medium text-slate-900 truncate">
            {preview}
            {activeLang === "bn" && !item[previewKey] && Boolean(enItem[previewKey]) && (
              <span className="ml-2 text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">needs translation</span>
            )}
          </p>
        </button>
        <button type="button" onClick={() => moveItem(index, -1)} disabled={index === 0} className="text-slate-500 hover:text-slate-900 disabled:opacity-30 text-xs p-1" title="Move up">↑</button>
        <button type="button" onClick={() => moveItem(index, 1)} disabled={index === listLen - 1} className="text-slate-500 hover:text-slate-900 disabled:opacity-30 text-xs p-1" title="Move down">↓</button>
        <button type="button" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 text-xs p-1" title="Remove">✕</button>
      </div>
      {open && (
        <div className="px-3 pb-3 space-y-2">
          {fields.map((f) => {
            const isBn = activeLang === "bn";
            const enVal = asStr(enItem[f.key]);

            if (f.kind === "image") {
              const url = asStr(item[f.key]) || (isBn ? enVal : "");
              return (
                <div key={f.key}>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">{f.label}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => setItemValue(index, f.key, e.target.value)}
                      placeholder={isBn && enVal ? `EN: ${enVal}` : "Image URL"}
                      className={itemCls}
                    />
                    <button
                      type="button"
                      onClick={() => openPicker(String(index) + ":" + f.key)}
                      className="px-2 py-1.5 bg-slate-100 border border-slate-300 rounded-lg text-[11px] font-medium text-slate-700 hover:bg-slate-200 transition-colors whitespace-nowrap"
                    >
                      Browse…
                    </button>
                  </div>
                  {url && /^https?:\/\/|^\//.test(url) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt="" className="mt-1.5 h-10 rounded border border-slate-200" />
                  )}
                </div>
              );
            }
            if (f.kind === "textarea") {
              return (
                <div key={f.key}>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    {f.label} {isBn && <span className="text-teal-600 text-[10px] lowercase">(বাংলা)</span>}
                  </label>
                  <textarea
                    rows={2}
                    value={asStr(item[f.key])}
                    onChange={(e) => setItemValue(index, f.key, e.target.value)}
                    placeholder={isBn && enVal ? `EN: ${enVal}` : f.label}
                    className={`${itemCls} resize-y ${isBn ? "font-bangla" : ""}`}
                  />
                  {isBn && enVal && (
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">EN: {enVal}</p>
                  )}
                </div>
              );
            }
            return (
              <div key={f.key}>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  {f.label} {isBn && f.kind !== "number" && <span className="text-teal-600 text-[10px] lowercase">(বাংলা)</span>}
                </label>
                <input
                  type={f.kind === "number" ? "number" : "text"}
                  value={f.kind === "number" ? String(Number(item[f.key]) || 0) : asStr(item[f.key])}
                  placeholder={isBn && enVal ? `EN: ${enVal}` : f.label}
                  onChange={(e) =>
                    setItemValue(index, f.key, f.kind === "number" ? (parseInt(e.target.value) || 0) : e.target.value)
                  }
                  className={`${itemCls} ${isBn && f.kind !== "number" ? "font-bangla" : ""}`}
                />
                {isBn && enVal && f.kind !== "number" && (
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">EN: {enVal}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Primitives
// ============================================================

function Input({
  label,
  value,
  onChange,
  bangla,
  highlight,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  bangla?: boolean;
  highlight?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3.5 py-2.5 bg-white border rounded-lg text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors ${
          bangla ? "font-bangla" : ""
        } ${highlight ? "border-teal-500/50 bg-teal-50/10" : "border-slate-300"}`}
      />
    </div>
  );
}

function Textarea({
  label,
  value,
  onChange,
  rows,
  bangla,
  highlight,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows: number;
  bangla?: boolean;
  highlight?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
        {label}
      </label>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3.5 py-2.5 bg-white border rounded-lg text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors resize-none ${
          bangla ? "font-bangla" : ""
        } ${highlight ? "border-teal-500/50 bg-teal-50/10" : "border-slate-300"}`}
      />
    </div>
  );
}

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
    description: "Large banner with optional background image and CTAs.",
    fields: [
      { key: "eyebrow", label: "Eyebrow text", kind: "text", target: "content" },
      { key: "subtitle", label: "Subtitle", kind: "textarea", target: "content" },
      { key: "image", label: "Background image", kind: "image", target: "content" },
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
    description: "Slim hero-style banner (same fields as Hero).",
    fields: [
      { key: "eyebrow", label: "Eyebrow text", kind: "text", target: "content" },
      { key: "subtitle", label: "Subtitle", kind: "textarea", target: "content" },
      { key: "image", label: "Background image", kind: "image", target: "content" },
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
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [pickerKey, setPickerKey] = useState<string | null>(null);

  const content = useMemo(() => tryParse(draft.content), [draft.content]);
  const settings = useMemo(() => tryParse(draft.settings), [draft.settings]);
  const contentBn = useMemo(() => tryParse(draft.contentBn), [draft.contentBn]);

  const setJson = (target: "content" | "settings" | "contentBn", next: Record<string, unknown>) => {
    const serialized = JSON.stringify(next);
    setDraft((d) => ({ ...d, [target === "contentBn" ? "contentBn" : target]: serialized }));
  };

  const getRoot = (target: "content" | "settings") => (target === "settings" ? settings : content);
  const setValue = (field: FieldDef, value: unknown) =>
    setJson(field.target, { ...obj(getRoot(field.target)), [field.key]: value });

  const getItemList = (field: FieldDef) => records(obj(getRoot(field.target))[field.key]);
  const setItemList = (field: FieldDef, list: Record<string, unknown>[]) =>
    setJson(field.target, { ...obj(getRoot(field.target)), [field.key]: list });
  const setItemValue = (field: FieldDef, idx: number, key: string, value: unknown) => {
    const list = getItemList(field);
    setItemList(
      field,
      list.map((it, i) => (i === idx ? { ...it, [key]: value } : it))
    );
  };
  const addItem = (field: FieldDef) => {
    const blank: Record<string, unknown> = {};
    for (const f of field.itemFields ?? []) blank[f.key] = f.kind === "number" ? 0 : "";
    setItemList(field, [...getItemList(field), blank]);
  };
  const removeItem = (field: FieldDef, idx: number) =>
    setItemList(field, getItemList(field).filter((_, i) => i !== idx));
  const moveItem = (field: FieldDef, idx: number, dir: -1 | 1) => {
    const list = getItemList(field);
    const swap = idx + dir;
    if (swap < 0 || swap >= list.length) return;
    const next = [...list];
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setItemList(field, next);
  };

  /** pickerKey format:
   *  "content:key" (root)  or  "content:key:idx:itemKey" (list item) */
  const onPick = (url: string) => {
    if (!pickerKey) return;
    const parts = pickerKey.split(":");
    const [target, key] = parts;
    const field = typeDef?.fields.find((f) => f.key === key);
    if (!field) { setPickerKey(null); return; }
    if (parts.length === 4) {
      setItemValue(field, Number(parts[2]), parts[3], url);
    } else {
      setValue(field, url);
    }
    void target;
    setPickerKey(null);
  };

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

  const fields = typeDef?.fields ?? [];

  return (
    <div className="space-y-4">
      {localError && (
        <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">{localError}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input label="Section title (EN)" value={draft.title} onChange={(v) => setDraft({ ...draft, title: v })} />
        <Input label="Section title (বাংলা)" value={draft.titleBn} onChange={(v) => setDraft({ ...draft, titleBn: v })} bangla />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Textarea label="Section description (EN)" value={draft.description} onChange={(v) => setDraft({ ...draft, description: v })} rows={2} />
        <Textarea label="Section description (বাংলা)" value={draft.descriptionBn} onChange={(v) => setDraft({ ...draft, descriptionBn: v })} rows={2} bangla />
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

      {fields.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {fields.map((field) =>
            field.itemFields ? (
              <ItemsEditor
                key={field.key}
                field={field}
                list={getItemList(field)}
                add={() => addItem(field)}
                remove={(i) => removeItem(field, i)}
                move={(i, d) => moveItem(field, i, d)}
                setItemValue={(i, k, v) => setItemValue(field, i, k, v)}
                openPicker={(k) => setPickerKey(`content:${field.key}:${k}`)}
              />
            ) : field.kind === "paragraphs" ? (
              <ParagraphsEditor
                key={field.key}
                field={field}
                value={obj(getRoot(field.target))[field.key]}
                onChange={(list) => setValue(field, list)}
              />
            ) : (
              <TypeField
                key={field.key}
                field={field}
                value={obj(getRoot(field.target))[field.key]}
                onChange={(v) => setValue(field, v)}
                openPicker={() => setPickerKey(`content:${field.key}`)}
              />
            )
          )}
        </div>
      )}

      {/* Advanced: raw Bengali content override */}
      <details className="rounded-lg bg-slate-50 border border-slate-200 p-3">
        <summary className="text-xs font-semibold text-slate-700 cursor-pointer">
          Bengali content override (advanced JSON)
        </summary>
        <p className="text-[11px] text-slate-500 mt-1.5">
          Mirror the same shapes above, e.g. <code>{`{"subtitle":"..."}`}</code> or{" "}
          <code>{`{"items":[{"title":"...", "description":"..."}]}`}</code>. Empty means Bengali falls
          back to the English content. Invalid URLs or script tags are rejected on save.
        </p>
        <textarea
          rows={5}
          value={draft.contentBn}
          onChange={(e) => setDraft({ ...draft, contentBn: e.target.value })}
          className="mt-2 w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
          placeholder="{}"
        />
      </details>

      {/* Media picker overlay */}
      {pickerKey && (
        <MediaPickerModal open onClose={() => setPickerKey(null)} onSelect={onPick} title="Select Image" />
      )}

      <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
        <div className="flex gap-2">
          <button
            onClick={() => onDuplicate(row)}
            className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors shadow-2xs"
          >
            Duplicate
          </button>
          <button
            onClick={() => { if (confirm(`Delete "${draft.title || row.type}"? This cannot be undone.`)) onDelete(row); }}
            className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs hover:bg-red-500/20 transition-colors"
          >
            Delete
          </button>
          <button
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

function TypeField({ field, value, onChange, openPicker }: {
  field: FieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
  openPicker: () => void;
}) {
  const s = asStr(value);

  if (field.kind === "image") {
    return (
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">{field.label}</label>
        <div className="flex items-center gap-2">
          <input type="text" value={s} onChange={(e) => onChange(e.target.value)} placeholder="Image URL" className={inputCls} />
          <button
            onClick={openPicker}
            className="px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors whitespace-nowrap"
          >
            Browse…
          </button>
        </div>
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
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">{field.label}</label>
        <input
          type="text"
          value={s}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.label}
          className={inputCls}
        />
      </div>
    );
  }

  if (field.kind === "select") {
    return (
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">{field.label}</label>
        <select value={s} onChange={(e) => onChange(e.target.value)} className={inputCls}>
          {(field.options ?? []).map((o) => (
            <option key={o.value} value={o.value} >{o.label}</option>
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
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">{field.label}</label>
        <textarea rows={3} value={s} onChange={(e) => onChange(e.target.value)} className={`${inputCls} resize-y`} placeholder={field.label} />
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
          placeholder="https://… or /path"
          className={inputCls}
        />
      </div>
    );
  }

  if (field.kind === "paragraphs") {
    return (
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">{field.label}</label>
        <textarea rows={3} value={s} onChange={(e) => onChange(e.target.value)} className={`${inputCls} resize-y`} placeholder="Blank line = new paragraph" />
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
        placeholder={undefined}
        className={inputCls}
      />
      {field.help && <p className="text-[11px] text-slate-500 mt-1">{field.help}</p>}
    </div>
  );
}

function ParagraphsEditor({ field, value, onChange }: {
  field: FieldDef;
  value: unknown;
  onChange: (list: string[]) => void;
}) {
  const initial = Array.isArray(value)
    ? (value as unknown[]).filter((v): v is string => typeof v === "string").join("\n\n")
    : typeof value === "string" ? value : "";
  const [text, setText] = useState(initial);

  const commit = (next: string) => {
    setText(next);
    onChange(next.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean));
  };

  return (
    <div className="md:col-span-2">
      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">{field.label}</label>
      <textarea
        rows={6}
        value={text}
        onChange={(e) => commit(e.target.value)}
        className={`${inputCls} resize-y`}
        placeholder="Blank line = new paragraph"
      />
      <p className="text-[11px] text-slate-500 mt-1">
        Blank line = new paragraph. Supports *italic*, **bold**, [label](/link).
      </p>
    </div>
  );
}

function ItemsEditor({ field, list, add, remove, move, setItemValue, openPicker }: {
  field: FieldDef;
  list: Record<string, unknown>[];
  add: () => void;
  remove: (idx: number) => void;
  move: (idx: number, dir: -1 | 1) => void;
  setItemValue: (idx: number, key: string, v: unknown) => void;
  openPicker: (key: string) => void;
}) {
  void setItemValue; // handled inside ItemCard via props below
  return (
    <div className="md:col-span-2">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">{field.label}</label>
        <button
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

function ItemCard({ field, fields, item, index, listLen, setItemValue, removeItem, moveItem, openPicker }: {
  field: FieldDef;
  fields: FieldDef[];
  item: Record<string, unknown>;
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
  const preview = asStr(item[previewKey]).slice(0, 60) || `Item ${index + 1}`;

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-2xs">
      <div className="flex items-center gap-2 px-3 py-2">
        <button onClick={() => setOpen((v) => !v)} className="flex-1 text-left min-w-0">
          <p className="text-xs font-medium text-slate-900 truncate">{preview}</p>
        </button>
        <button onClick={() => moveItem(index, -1)} disabled={index === 0} className="text-slate-500 hover:text-slate-900 disabled:opacity-30 text-xs" title="Move up">↑</button>
        <button onClick={() => moveItem(index, 1)} disabled={index === listLen - 1} className="text-slate-500 hover:text-slate-900 disabled:opacity-30 text-xs" title="Move down">↓</button>
        <button onClick={() => removeItem(index)} className="text-red-600 hover:text-red-800 text-xs" title="Remove">✕</button>
      </div>
      {open && (
        <div className="px-3 pb-3 space-y-2">
          {fields.map((f) => {
            if (f.kind === "image") {
              const url = asStr(item[f.key]);
              return (
                <div key={f.key}>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">{f.label}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => setItemValue(index, f.key, e.target.value)}
                      className={itemCls}
                    />
                    <button
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
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">{f.label}</label>
                  <textarea
                    rows={2}
                    value={asStr(item[f.key])}
                    onChange={(e) => setItemValue(index, f.key, e.target.value)}
                    className={`${itemCls} resize-y`}
                  />
                </div>
              );
            }
            return (
              <div key={f.key}>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">{f.label}</label>
                <input
                  type={f.kind === "number" ? "number" : "text"}
                  value={f.kind === "number" ? String(Number(item[f.key]) || 0) : asStr(item[f.key])}
                  onChange={(e) =>
                    setItemValue(index, f.key, f.kind === "number" ? (parseInt(e.target.value) || 0) : e.target.value)
                  }
                  className={itemCls}
                />
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

function Input({ label, value, onChange, bangla }: { label: string; value: string; onChange: (v: string) => void; bangla?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors ${bangla ? "font-bangla" : ""}`}
      />
    </div>
  );
}

function Textarea({ label, value, onChange, rows, bangla }: { label: string; value: string; onChange: (v: string) => void; rows: number; bangla?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">{label}</label>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors resize-none ${bangla ? "font-bangla" : ""}`}
      />
    </div>
  );
}

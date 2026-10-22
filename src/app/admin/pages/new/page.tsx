"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Layout, Sparkles, AlertCircle, FileText, Layers, BookOpen, Download, Mail } from "lucide-react";
import { createPage, createSection } from "@/lib/actions/cms";
import { slugify } from "@/lib/db";
import { RESERVED_SLUGS } from "@/lib/cms-validation";

export interface TemplateDef {
  id: string;
  name: string;
  description: string;
  icon: typeof Layout;
  defaultSections: Array<{
    type: string;
    title: string;
    titleBn: string;
    description: string;
    content: Record<string, unknown>;
    contentBn: Record<string, unknown>;
  }>;
}

export const TEMPLATES: TemplateDef[] = [
  {
    id: "default",
    name: "Standard Content Page",
    description: "Classic layout with page header, narrative rich text, and optional call to action.",
    icon: FileText,
    defaultSections: [
      {
        type: "hero",
        title: "Page Header",
        titleBn: "পৃষ্ঠা শিরোনাম",
        description: "Introductory header with title and background styling.",
        content: { eyebrow: "LENS Initiative", subtitle: "Overview and background narrative." },
        contentBn: { eyebrow: "লেন্স উদ্যোগ", subtitle: "সারসংক্ষেপ ও পটভূমির বিবরণ।" },
      },
      {
        type: "rich_text",
        title: "Main Content",
        titleBn: "মূল বিষয়বস্তু",
        description: "Primary reading text.",
        content: { title: "Overview", richText: "Enter the detailed page content here..." },
        contentBn: { title: "সারসংক্ষেপ", richText: "এখানে আপনার বিস্তারিত বিষয়বস্তু লিখুন..." },
      },
      {
        type: "cta",
        title: "Call to Action",
        titleBn: "অ্যাকশন কল",
        description: "Footer button prompting next steps.",
        content: { title: "Stay Engaged", description: "Learn how you can participate in this program.", ctaLabel: "Contact Us", ctaUrl: "/contact" },
        contentBn: { title: "যুক্ত থাকুন", description: "কীভাবে এই কর্মসূচিতে যুক্ত হতে পারেন তা জানুন।", ctaLabel: "যোগাযোগ করুন", ctaUrl: "/contact" },
      },
    ],
  },
  {
    id: "tabs_showcase",
    name: "Tabs & Nested Tabs Hierarchy",
    description: "Multi-tabbed interactive explorer with primary tabs, nested sub-tabs, and rich content blocks.",
    icon: Layers,
    defaultSections: [
      {
        type: "hero",
        title: "Section Overview",
        titleBn: "বিভাগীয় সারসংক্ষেপ",
        description: "Banner introducing the tabbed themes.",
        content: { eyebrow: "Thematic Explorer", subtitle: "Browse themes and sub-topics across interactive tabs." },
        contentBn: { eyebrow: "বিষয়ভিত্তিক অনুসন্ধান", subtitle: "ইন্টারেক্টিভ ট্যাবের মাধ্যমে বিষয় ও উপ-বিষয়গুলো অন্বেষণ করুন।" },
      },
      {
        type: "tabs",
        title: "Thematic Navigation",
        titleBn: "বিষয়ভিত্তিক নেভিগেশন",
        description: "Structured tabs and inner sub-tabs.",
        content: {
          tabs: [
            {
              id: "tab-1",
              label: "Topic One",
              labelBn: "প্রথম বিষয়",
              description: "Introduction to first thematic area.",
              descriptionBn: "প্রথম বিষয়ভিত্তিক এলাকার পরিচিতি।",
              sortOrder: 0,
              visible: true,
              innerTabs: [
                {
                  id: "subtab-1-1",
                  label: "Overview",
                  labelBn: "সারসংক্ষেপ",
                  sortOrder: 0,
                  visible: true,
                  contentBlocks: [
                    {
                      id: "b1",
                      type: "rich_text",
                      title: "Sub-Topic Details",
                      titleBn: "উপ-বিষয়ের বিবরণ",
                      richText: "Provide thorough analysis and structured evidence here...",
                      richTextBn: "এখানে পুঙ্খানুপুঙ্খ বিশ্লেষণ ও প্রমাণাদি উপস্থাপন করুন...",
                    },
                  ],
                },
              ],
            },
          ],
        },
        contentBn: { tabs: [] },
      },
    ],
  },
  {
    id: "research",
    name: "Research & Publications Archive",
    description: "Grid layout featuring research reports, publication downloads, and citations.",
    icon: BookOpen,
    defaultSections: [
      {
        type: "hero",
        title: "Research Archive",
        titleBn: "গবেষণা আর্কাইভ",
        description: "Research topic title and introductory scope.",
        content: { eyebrow: "Empirical Studies", subtitle: "Peer-reviewed research and working papers from LENS scholars." },
        contentBn: { eyebrow: "তথ্যপ্রমাণভিত্তিক গবেষণা", subtitle: "লেন্স গবেষকদের পর্যালোচনাভিত্তিক গবেষণা ও ওয়ার্কিং পেপার।" },
      },
      {
        type: "publication_list",
        title: "Publications",
        titleBn: "প্রকাশনাসমূহ",
        description: "Dynamic publication grid.",
        content: { limit: 12 },
        contentBn: { limit: 12 },
      },
    ],
  },
  {
    id: "resources",
    name: "Resource & Document Downloads",
    description: "Resource repository with downloadable guides, datasets, and external references.",
    icon: Download,
    defaultSections: [
      {
        type: "hero",
        title: "Resources Hub",
        titleBn: "রিসোর্স হাব",
        description: "Introductory header for materials.",
        content: { eyebrow: "Toolkits & Downloads", subtitle: "Verified resources, datasets, and guides." },
        contentBn: { eyebrow: "টুলকিট ও ডাউনলোড", subtitle: "যাচাইকৃত রিসোর্স, উপাত্ত এবং নির্দেশিকা।" },
      },
      {
        type: "resource_list",
        title: "Available Resources",
        titleBn: "সহজলভ্য রিসোর্স",
        description: "Resource list.",
        content: { limit: 12 },
        contentBn: { limit: 12 },
      },
    ],
  },
  {
    id: "contact",
    name: "Contact & Institutional Inquiries",
    description: "Direct contact form with organizational addresses, emails, and office locations.",
    icon: Mail,
    defaultSections: [
      {
        type: "hero",
        title: "Contact LENS",
        titleBn: "লেন্স-এর সাথে যোগাযোগ",
        description: "Header.",
        content: { eyebrow: "Get in Touch", subtitle: "Send general inquiries, press queries, or collaborative proposals." },
        contentBn: { eyebrow: "যোগাযোগ করুন", subtitle: "সাধারণ অনুসন্ধান, মিডিয়া জিজ্ঞাসা বা সহযোগিতার প্রস্তাব পাঠান।" },
      },
      {
        type: "contact_form",
        title: "Direct Inquiries",
        titleBn: "সরাসরি বার্তা",
        description: "Interactive form.",
        content: { subjectOptions: "General Inquiry, Research Partnership, Media Interview, Training Workshop" },
        contentBn: { subjectOptions: "সাধারণ অনুসন্ধান, গবেষণা অংশীদারিত্ব, গণমাধ্যম সাক্ষাৎকার, প্রশিক্ষণ কর্মশালা" },
      },
    ],
  },
  {
    id: "custom",
    name: "Blank Canvas (Custom Sections)",
    description: "Starts with an empty page so you can assemble custom sections manually.",
    icon: Sparkles,
    defaultSections: [],
  },
];

export default function NewPageCreator() {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState("default");
  const [title, setTitle] = useState("");
  const [titleBn, setTitleBn] = useState("");
  const [slug, setSlug] = useState("");
  const [autoSlug, setAutoSlug] = useState(true);
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft");
  const [description, setDescription] = useState("");
  const [descriptionBn, setDescriptionBn] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (autoSlug) {
      setSlug(slugify(val));
    }
  };

  const handleSlugChange = (val: string) => {
    setAutoSlug(false);
    setSlug(slugify(val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanSlug = slug.trim().toLowerCase();
    if (!cleanSlug) {
      setError("Please provide a valid route slug.");
      return;
    }

    if (RESERVED_SLUGS.has(cleanSlug)) {
      setError(`The slug "${cleanSlug}" is reserved by the application framework. Please choose another.`);
      return;
    }

    if (!title.trim()) {
      setError("Please enter a page title.");
      return;
    }

    setCreating(true);
    try {
      // 1. Create page record
      const page = await createPage({
        slug: cleanSlug,
        title: title.trim(),
        titleBn: titleBn.trim() || title.trim(),
        description: description.trim(),
        descriptionBn: descriptionBn.trim(),
        template: selectedTemplate,
        status,
      });

      // 2. Initialize default template sections
      const tmpl = TEMPLATES.find((t) => t.id === selectedTemplate);
      if (tmpl && tmpl.defaultSections.length > 0) {
        for (let i = 0; i < tmpl.defaultSections.length; i++) {
          const sec = tmpl.defaultSections[i];
          await createSection(page.id, {
            type: sec.type,
            title: sec.title,
            titleBn: sec.titleBn,
            description: sec.description,
            visible: true,
            content: JSON.stringify(sec.content),
            contentBn: JSON.stringify(sec.contentBn),
          });
        }
      }

      // 3. Navigate to page editor
      router.push(`/admin/pages/${page.id}?created=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Page creation failed.");
      setCreating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Bar */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/pages"
          className="p-2 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Create New Page</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Select a starter template, configure the URL slug, and build custom sections.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Choose Template */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2">
            <Layout className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900">1. Select Page Template</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {TEMPLATES.map((tmpl) => {
              const Icon = tmpl.icon;
              const isSelected = selectedTemplate === tmpl.id;
              return (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => setSelectedTemplate(tmpl.id)}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "border-teal-600 bg-teal-50/40 ring-2 ring-teal-500/20 shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Icon className={`w-5 h-5 ${isSelected ? "text-teal-600" : "text-slate-500"}`} />
                      {isSelected && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full">
                          Selected
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">{tmpl.name}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{tmpl.description}</p>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400 mt-3 pt-2 border-t border-slate-100">
                    {tmpl.defaultSections.length} starter section{tmpl.defaultSections.length === 1 ? "" : "s"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Page Details */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <h2 className="text-base font-bold text-slate-900">2. Page Information</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Page Title (English) *
              </label>
              <input
                type="text"
                required
                name="title"
                placeholder="e.g. About Us"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-teal-800 mb-1">
                Page Title (বাংলা)
              </label>
              <input
                type="text"
                name="titleBn"
                placeholder="যেমন: আমাদের সম্পর্কে"
                value={titleBn}
                onChange={(e) => setTitleBn(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-bangla"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                URL Slug *
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 bg-slate-100 px-3 py-2.5 rounded-xl border border-slate-200 select-none">
                  lensbd.org/
                </span>
                <input
                  type="text"
                  required
                  name="slug"
                  placeholder="about"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-mono"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Permanent public URL path. Use letters, numbers, and hyphens.
              </p>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Publication Status *
              </label>
              <select
                name="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as "draft" | "published" | "archived")}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                <option value="draft">Draft (Private)</option>
                <option value="published">Published (Live immediately)</option>
                <option value="archived">Archived</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Choose whether the page should be immediately public or kept as draft.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Description (English)
              </label>
              <textarea
                rows={2}
                name="description"
                placeholder="Short description shown in page lists and used as meta fallback"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-teal-800 mb-1">
                Description (বাংলা)
              </label>
              <textarea
                rows={2}
                name="descriptionBn"
                placeholder="সংক্ষিপ্ত বিবরণ"
                value={descriptionBn}
                onChange={(e) => setDescriptionBn(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 resize-none font-bangla"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/admin/pages"
            className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={creating}
            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {creating ? "Creating Page..." : "Create Page & Start Building →"}
          </button>
        </div>
      </form>
    </div>
  );
}

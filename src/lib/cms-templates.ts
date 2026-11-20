import { Layout, FileText, Layers, BookOpen, Download, Mail, Sparkles } from "lucide-react";

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

"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";import { getCurrentUser, requireAuth, requireAdmin } from "@/lib/auth";
import { DEFAULT_SITE_SETTINGS, DEFAULT_HOME_SECTIONS, getDefaultSectionsForSlug } from "@/lib/cms-defaults";
import { validateSlug, sanitizeUrl } from "@/lib/cms-validation";
import { serializeSectionJson, toJson, clampText } from "@/lib/cms-validation";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";
import {
  DEFAULT_HEADER_NAVIGATION,
  DEFAULT_FOOTER_NAVIGATION,
  type DefaultNavItem,
} from "@/lib/cms-navigation-defaults";
import { assertValidMenuParent, assertValidMenuParentInput } from "@/lib/menu-validation";

async function checkAuth() {
  const user = await getCurrentUser();
  return user ? requireAuth(user, "editor") : null;
}

// ============================================================
// Public Safe CMS Accessors (No Auth Required, Safe Fallbacks)
// ============================================================

export interface PublicSiteSettingsMap {
  [key: string]: { value: string; valueBn: string };
}

export async function getPublicSiteSettings(): Promise<PublicSiteSettingsMap> {
  try {
    const rows = await db.siteSetting.findMany();
    const map: PublicSiteSettingsMap = {};
    for (const r of rows) {
      map[r.key] = { value: r.value, valueBn: r.valueBn };
    }
    // Fill in any defaults not present in DB
    for (const d of DEFAULT_SITE_SETTINGS) {
      if (!map[d.key]) {
        map[d.key] = { value: d.value, valueBn: d.valueBn };
      }
    }
    return map;
  } catch {
    const fallback: PublicSiteSettingsMap = {};
    for (const d of DEFAULT_SITE_SETTINGS) {
      fallback[d.key] = { value: d.value, valueBn: d.valueBn };
    }
    return fallback;
  }
}

export interface PublicSectionData {
  id: string;
  type: string;
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  sortOrder: number;
  visible: boolean;
  settings: Record<string, unknown>;
  content: Record<string, unknown>;
  contentBn: Record<string, unknown>;
}

export interface PublicPageData {
  id: string;
  slug: string;
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  template: string;
  metaTitle: string | null;
  metaTitleBn: string | null;
  metaDescription: string | null;
  metaDescriptionBn: string | null;
  ogImage: string | null;
  sections: PublicSectionData[];
}

function fallbackHome(id: string): PublicPageData {
  return {
    id,
    slug: "home",
    title: "Home",
    titleBn: "হোম",
    description: "LENS Homepage",
    descriptionBn: "লেন্স হোমপেজ",
    template: "home",
    metaTitle: "LENS — Lighthouse for Evolving Narrative Systems",
    metaTitleBn: "লেন্স — লাইটহাউস ফর ইভলভিং ন্যারেটিভ সিস্টেমস",
    metaDescription: "Evidence-based research on media literacy, press freedom, narrative analysis and cybersecurity in Bangladesh.",
    metaDescriptionBn: null,
    ogImage: null,
    sections: DEFAULT_HOME_SECTIONS.map((s, idx) => ({
      id: `${id}-${s.type}-${idx}`,
      type: s.type,
      title: s.title,
      titleBn: s.titleBn,
      description: s.description,
      descriptionBn: s.descriptionBn,
      sortOrder: s.sortOrder,
      visible: s.visible,
      settings: s.settings,
      content: s.content,
      contentBn: s.contentBn,
    })),
  };
}

function fallbackPage(slug: string, id: string): PublicPageData | null {
  const defaultSections = getDefaultSectionsForSlug(slug);
  if (!defaultSections) return null;

  // Default metadata for known slugs
  const metadata: Record<string, { title: string; titleBn: string; description: string; descriptionBn: string; metaTitle: string; metaTitleBn: string; metaDescription: string; metaDescriptionBn: string }> = {
    research: {
      title: "Research & Insights",
      titleBn: "গবেষণা ও অন্তর্দৃষ্টি",
      description: "Evidence-based research on media literacy, press freedom, narrative analysis and cybersecurity in Bangladesh.",
      descriptionBn: "বাংলাদেশে মিডিয়া সাক্ষরতা, প্রেস স্বাধীনতা, ন্যারেটিভ বিশ্লেষণ এবং সাইবার নিরাপত্তার ওপর তথ্যপ্রমাণভিত্তিক গবেষণা।",
      metaTitle: "Research & Insights — LENS",
      metaTitleBn: "গবেষণা ও অন্তর্দৃষ্টি — লেন্স",
      metaDescription: "Evidence-based research on media literacy, press freedom, narrative analysis, policy advocacy and cybersecurity in Bangladesh.",
      metaDescriptionBn: "বাংলাদেশে মিডিয়া সাক্ষরতা, প্রেস স্বাধীনতা, ন্যারেটিভ বিশ্লেষণ, নীতি অ্যাডভোকেসি ও সাইবার নিরাপত্তার ওপর তথ্যপ্রমাণভিত্তিক গবেষণা।",
    },
    publications: {
      title: "Publications",
      titleBn: "প্রকাশনা",
      description: "Policy briefs, working papers and research reports from LENS.",
      descriptionBn: "LENS-এর নীতি বিবরণী, ওয়ার্কিং পেপার এবং গবেষণা প্রতিবেদন।",
      metaTitle: "Publications — LENS",
      metaTitleBn: "প্রকাশনা — লেন্স",
      metaDescription: "Policy briefs, working papers, research reports and analysis from the LENS research team.",
      metaDescriptionBn: "LENS গবেষণা দল থেকে নীতি বিবরণী, ওয়ার্কিং পেপার, গবেষণা প্রতিবেদন এবং বিশ্লেষণ।",
    },
    events: {
      title: "Events & Workshops",
      titleBn: "ইভেন্ট ও কর্মশালা",
      description: "Workshops, summits, conferences and community events by LENS.",
      descriptionBn: "LENS-এর কর্মশালা, সাবমিট, সম্মেলন এবং কমিউনিটি ইভেন্ট।",
      metaTitle: "Events — LENS",
      metaTitleBn: "ইভেন্ট — লেন্স",
      metaDescription: "Workshops, summits, conferences and community events by LENS to strengthen Bangladesh's narrative ecosystem.",
      metaDescriptionBn: "বাংলাদেশের ন্যারেটিভ ইকোসিস্টেমকে শক্তিশালী করার জন্য LENS-এর কর্মশালা, সাবমিট, সম্মেলন ও কমিউনিটি ইভেন্ট।",
    },
    blog: {
      title: "Blog & Analysis",
      titleBn: "ব্লগ ও বিশ্লেষণ",
      description: "Research insights, expert commentary, and analysis on Bangladesh's media landscape.",
      descriptionBn: "বাংলাদেশের মিডিয়া ল্যান্ডস্কেপে গবেষণা অন্তর্দৃষ্টি, বিশেষজ্ঞ মন্তব্য ও বিশ্লেষণ।",
      metaTitle: "Blog — LENS",
      metaTitleBn: "ব্লগ — লেন্স",
      metaDescription: "LENS blog - insights, analysis, and commentary on Bangladesh's media landscape, digital rights, narrative ecosystems, and press freedom.",
      metaDescriptionBn: "LENS ব্লগ - বাংলাদেশের মিডিয়া ল্যান্ডস্কেপ, ডিজিটাল অধিকার, ন্যারেটিভ ইকোসিস্টেম এবং প্রেস স্বাধীনতার ওপর অন্তর্দৃষ্টি, বিশ্লেষণ এবং মন্তব্য।",
    },
    media: {
      title: "Media & Press",
      titleBn: "মিডিয়া ও প্রেস",
      description: "Press releases, interviews, and media coverage from LENS.",
      descriptionBn: "LENS-এর প্রেস রিলিজ, সাক্ষাত্কার এবং মিডিয়া কভারেজ।",
      metaTitle: "Media — LENS",
      metaTitleBn: "মিডিয়া — লেন্স",
      metaDescription: "LENS media coverage, press mentions, interviews, and media resources for journalists covering Bangladesh's narrative ecosystem.",
      metaDescriptionBn: "বাংলাদেশের ন্যারেটিভ ইকোসিস্টেম কভার করন पत्रকারদের জন্য LENS মিডিয়া কভারেজ, প্রেস উল্লেখ, সাক্ষাত্কার এবং মিডিয়া সম্পদ।",
    },
    resources: {
      title: "Resources & Tools",
      titleBn: "রিসোর্স ও টুলস",
      description: "Research tools, datasets, and educational materials from LENS.",
      descriptionBn: "LENS-এর গবেষণা টুলস, ডেটাসেট এবং শিক্ষামূলক উপাদান।",
      metaTitle: "Resources — LENS",
      metaTitleBn: "রিসোর্স — লেন্স",
      metaDescription: "LENS resources - research tools, datasets, media literacy guides, and educational materials for journalists, researchers, and civil society.",
      metaDescriptionBn: "LENS রিসোর্স - সাংবাদিক, গবেষক এবং সুশীল সমাজের জন্য গবেষণা টুলস, ডেটাসেট, মিডিয়া সাক্ষরতা গাইড এবং শিক্ষামূলক উপাদান।",
    },
    programs: {
      title: "Programs & Training",
      titleBn: "প্রোগ্রাম ও প্রশিক্ষণ",
      description: "Training programs and capacity building initiatives by LENS.",
      descriptionBn: "LENS-এর প্রশিক্ষণ প্রোগ্রাম এবং সক্ষমতা বৃদ্ধির উদ্যোগ।",
      metaTitle: "Programs — LENS",
      metaTitleBn: "প্রোগ্রাম — লেন্স",
      metaDescription: "Training programs, workshops, and capacity building initiatives by LENS for media literacy, digital rights, and narrative research in Bangladesh.",
      metaDescriptionBn: "বাংলাদেশে মিডিয়া সাক্ষরতা, ডিজিটাল অধিকার এবং ন্যারেটিভ গবেষণার জন্য LENS-এর প্রশিক্ষণ প্রোগ্রাম, কর্মশালা এবং সক্ষমতা বৃদ্ধির উদ্যোগ।",
    },
    about: {
      title: "About LENS",
      titleBn: "লেন্স সম্পর্কে",
      description: "Learn about LENS, our mission, values and team.",
      descriptionBn: "লেন্স, আমাদের মিশন, মূল্যবোধ এবং দল সম্পর্কে জানুন।",
      metaTitle: "About LENS — Our Mission, Values & Team",
      metaTitleBn: "লেন্স সম্পর্কে — আমাদের মিশন, মূল্যবোধ ও দল",
      metaDescription: "Learn about LENS, a research-driven think tank working to strengthen Bangladesh's narrative ecosystem through evidence, media literacy and policy engagement.",
      metaDescriptionBn: "লেন্স সম্পর্কে জানুন, একটি গবেষণাভিত্তিক থিংক ট্যাংক যা তথ্যপ্রমাণ, গণমাধ্যম সাক্ষরতা ও নীতিগত সম্পৃক্ততার মাধ্যমে বাংলাদেশের ন্যারেটিভ ইকোসিস্টেমকে শক্তিশালী করতে কাজ করছে।",
    },
    donate: {
      title: "Support LENS",
      titleBn: "লেন্সকে সহযোগিতা করুন",
      description: "Support evidence-based research and media literacy in Bangladesh.",
      descriptionBn: "বাংলাদেশে তথ্যপ্রমাণভিত্তিক গবেষণা এবং মিডিয়া সাক্ষরতা সমর্থন করুন।",
      metaTitle: "Donate — Support LENS",
      metaTitleBn: "দান — লেন্সকে সহযোগিতা করুন",
      metaDescription: "Support LENS — a research-driven think tank strengthening Bangladesh's narrative ecosystem. Online donation processing is not yet available.",
      metaDescriptionBn: "LENSকে সহযোগিতা করুন — বাংলাদেশের ন্যারেটিভ ইকোসিস্টেমকে শক্তিশালীকারী একটি গবেষণাভিত্তিক থিংক ট্যাংক। অনলাইন দান প্রক্রিয়া এখনও উপলব্ধ নয়।",
    },
    contact: {
      title: "Contact Us",
      titleBn: "যোগাযোগ",
      description: "Get in touch with LENS for research inquiries, partnership opportunities and media queries.",
      descriptionBn: "বাংলাদেশে ricerca inquiries, partnership opportunities and media queries.",
      metaTitle: "Contact Us — LENS",
      metaTitleBn: "যোগাযোগ — লেন্স",
      metaDescription: "Get in touch with LENS for research inquiries, partnership opportunities and media queries.",
      metaDescriptionBn: "bangladeshrese inquiries, partnership opportunities and media queries.",
    },
    partnerships: {
      title: "Partnerships & Collaboration",
      titleBn: "অংশীদারিতা ও সহযোগিতা",
      description: "Collaborate with LENS for research, training and advocacy.",
      descriptionBn: "গবেষণা, প্রশিক্ষণ ও অ্যাডভোকেসির জন্য LENS-এর সাথে সহযোগিতা করুন।",
      metaTitle: "Partnerships — LENS",
      metaTitleBn: "অংশীদারিতা — লেন্স",
      metaDescription: "Partner with LENS for research, training and advocacy. We collaborate with universities, NGOs, media organizations and international partners.",
      metaDescriptionBn: "গবেষণা, প্রশিক্ষণ ও অ্যাডভোকেসির জন্য LENS-এর সাথে অংশীদারিত্ব করুন। আমরা বিশ্ববিদ্যালয়, এনজিও, মিডিয়া সংস্থা এবং আন্তর্জাতিক অংশীদারদের সাথে সহযোগিতা করি।",
    },
  };

  const meta = metadata[slug] || {
    title: slug.charAt(0).toUpperCase() + slug.slice(1),
    titleBn: "",
    description: "",
    descriptionBn: "",
    metaTitle: slug.charAt(0).toUpperCase() + slug.slice(1) + " — LENS",
    metaTitleBn: "",
    metaDescription: "",
    metaDescriptionBn: "",
  };

  return {
    id,
    slug,
    title: meta.title,
    titleBn: meta.titleBn,
    description: meta.description,
    descriptionBn: meta.descriptionBn,
    template: "default",
    metaTitle: meta.metaTitle,
    metaTitleBn: meta.metaTitleBn,
    metaDescription: meta.metaDescription,
    metaDescriptionBn: meta.metaDescriptionBn,
    ogImage: null,
    sections: defaultSections.map((s, idx) => ({
      id: `${id}-${s.type}-${idx}`,
      type: s.type,
      title: s.title,
      titleBn: s.titleBn,
      description: s.description,
      descriptionBn: s.descriptionBn,
      sortOrder: s.sortOrder,
      visible: s.visible,
      settings: s.settings,
      content: s.content,
      contentBn: s.contentBn,
    })),
  };
}

export async function getPublicPage(slug: string): Promise<PublicPageData | null> {
  try {
    const page = await db.page.findFirst({
      where: { slug, status: "published" },
      include: {
        sections: {
          where: { visible: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!page) {
      // Try fallback for known slugs with default sections
      const fallback = fallbackPage(slug, `fallback-${slug}`);
      if (fallback) return fallback;
      // Home fallback
      return slug === "home" ? fallbackHome("default-home") : null;
    }

    return sectionsToPublicPage(page as unknown as PublicPageRow);
  } catch {
    // Try fallback for known slugs on error too
    const fallback = fallbackPage(slug, `fallback-${slug}-error`);
    if (fallback) return fallback;
    return slug === "home" ? fallbackHome("fallback-home") : null;
  }
}

interface PublicPageRow {
  id: string;
  slug: string;
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  template: string;
  metaTitle: string | null;
  metaTitleBn: string | null;
  metaDescription: string | null;
  metaDescriptionBn: string | null;
  ogImage: string | null;
  sections: Array<{
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
  }>;
}

function sectionsToPublicPage(page: PublicPageRow): PublicPageData {
  const parsedSections: PublicSectionData[] = page.sections.map((sec) => ({
    id: sec.id,
    type: sec.type,
    title: sec.title,
    titleBn: sec.titleBn,
    description: sec.description,
    descriptionBn: sec.descriptionBn,
    sortOrder: sec.sortOrder,
    visible: sec.visible,
    settings: safeParse(sec.settings),
    content: safeParse(sec.content),
    contentBn: safeParse(sec.contentBn),
  }));

  return {
    id: page.id,
    slug: page.slug,
    title: page.title,
    titleBn: page.titleBn,
    description: page.description,
    descriptionBn: page.descriptionBn,
    template: page.template,
    metaTitle: page.metaTitle,
    metaTitleBn: page.metaTitleBn,
    metaDescription: page.metaDescription,
    metaDescriptionBn: page.metaDescriptionBn,
    ogImage: page.ogImage,
    sections: parsedSections,
  };
}

function safeParse(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

// ============================================================
// Pages CRUD (server-action: editor+ writes, admin deletes)
// ============================================================

export async function getPages(filters?: { status?: string }) {
  requireAuth(await getCurrentUser(), "viewer");

  // groupBy returns grouped tree info used by the list UI
  const where = filters?.status ? { status: filters.status } : {};
  const pages = await db.page.findMany({
    where,
    orderBy: { sortOrder: "asc" },
    include: {
      sections: { orderBy: { sortOrder: "asc" } },
      parent: { select: { id: true, slug: true, title: true } },
    },
  });
  return pages;
}

export async function getPage(id: string) {
  requireAuth(await getCurrentUser(), "viewer");
  return db.page.findUnique({
    where: { id },
    include: { sections: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function getPageBySlug(slug: string) {
  requireAuth(await getCurrentUser(), "viewer");
  return db.page.findUnique({
    where: { slug },
    include: { sections: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function createPage(data: {
  slug: string;
  title: string;
  titleBn?: string;
  description?: string;
  descriptionBn?: string;
  status?: string;
  template?: string;
  metaTitle?: string;
  metaTitleBn?: string;
  metaDescription?: string;
  metaDescriptionBn?: string;
  ogImage?: string;
  keywords?: string;
  canonicalUrl?: string;
}) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");

  const slugCheck = validateSlug(data.slug, { allowMigratableReserved: true });
  if (!slugCheck.valid) throw new Error(slugCheck.error || "Invalid slug");
  const ogCheck = data.ogImage ? sanitizeUrl(data.ogImage) : { ok: true as const };
  if (!ogCheck.ok) throw new Error(ogCheck.error || "Invalid OG image URL");

  const page = await db.page.create({
    data: {
      ...data,
      slug: data.slug.trim().toLowerCase(),
      status: data.status === "published" ? "published" : "draft",
      createdBy: auth.id,
      publishedAt: data.status === "published" ? new Date() : null,
    },
  });

  await logAudit({
    action: AUDIT_ACTIONS.PAGE_CREATED,
    actor: auth,
    targetType: "page",
    targetId: page.id,
    meta: { slug: page.slug, title: page.title, status: page.status },
  });

  revalidatePath("/");
  revalidatePath(`/${page.slug}`);
  return page;
}

const PAGE_MUTABLE_FIELDS = [
  "title",
  "titleBn",
  "description",
  "descriptionBn",
  "status",
  "scheduledAt",
  "sortOrder",
  "template",
  "parentId",
  "metaTitle",
  "metaTitleBn",
  "metaDescription",
  "metaDescriptionBn",
  "ogImage",
  "keywords",
  "canonicalUrl",
] as const;

/** Shared mutation core used by updatePage and publish actions. */
async function mutatePage(id: string, raw: Record<string, unknown>) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");

  const existing = await db.page.findUnique({ where: { id } });
  if (!existing) throw new Error("Page not found");

  const data: Record<string, unknown> = {};
  for (const field of PAGE_MUTABLE_FIELDS) {
    if (raw[field] !== undefined) data[field] = raw[field];
  }

  // Slug rules
  if (raw.slug !== undefined && typeof raw.slug === "string") {
    const nextSlug = raw.slug.trim().toLowerCase();
    if (nextSlug !== existing.slug) {
      if (existing.slug === "home") throw new Error("The homepage slug cannot be changed");
      const slugCheck = validateSlug(nextSlug, { allowMigratableReserved: true });
      if (!slugCheck.valid) throw new Error(slugCheck.error || "Invalid slug");
      const taken = await db.page.findFirst({ where: { slug: nextSlug, NOT: { id } } });
      if (taken) throw new Error("Slug is already in use by another page");
      data.slug = nextSlug;
    }
  }

  // URL fields
  if (typeof data.ogImage === "string") {
    const check = data.ogImage ? sanitizeUrl(data.ogImage) : { ok: true as const };
    if (!check.ok) throw new Error(check.error || "Invalid OG image URL");
  }
  if (typeof data.canonicalUrl === "string") {
    const check = data.canonicalUrl ? sanitizeUrl(data.canonicalUrl) : { ok: true as const };
    if (!check.ok) throw new Error(check.error || "Invalid canonical URL");
  }

  // Self parent guard
  if (data.parentId === id) {
    return { error: "A page cannot be its own parent" as string };
  }

  // Status transitions (single clean switch)
  let auditAction: string = AUDIT_ACTIONS.PAGE_UPDATED;
  if (typeof data.status === "string" && data.status !== existing.status) {
    const next = data.status;
    if (!["draft", "published", "archived"].includes(next)) {
      throw new Error("Invalid status");
    }
    if (existing.publishedAt) data.publishedAt = existing.publishedAt; // preserve first publish date
    if (next === "published" && !("publishedAt" in data && data.publishedAt)) {
      data.publishedAt = new Date();
    }
    if (existing.status === "published" && next !== "published") {
      auditAction = AUDIT_ACTIONS.PAGE_UNPUBLISHED;
    } else if (next === "published") {
      auditAction = AUDIT_ACTIONS.PAGE_PUBLISHED;
    } else if (next === "archived") {
      auditAction = AUDIT_ACTIONS.PAGE_ARCHIVED;
    } else if (next === "draft" && existing.status === "archived") {
      auditAction = AUDIT_ACTIONS.PAGE_RESTORED;
    }
  }

  const page = await db.page.update({ where: { id }, data });
  await logAudit({
    action: auditAction,
    actor: auth,
    targetType: "page",
    targetId: page.id,
    meta: { slug: page.slug, status: page.status },
  });

  revalidatePath("/");
  revalidatePath(`/${existing.slug}`);
  if (typeof data.slug === "string" && data.slug !== existing.slug) {
    revalidatePath(`/${data.slug}`);
  }
  return { page, action: auditAction as string };
}

export async function updatePage(id: string, data: Record<string, unknown>) {
  const result = await mutatePage(id, data);
  if ("error" in result && result.error) throw new Error(result.error);
  return result.page;
}

export async function deletePage(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  requireAdmin(user);

  const page = await db.page.findUnique({ where: { id } });
  if (!page) throw new Error("Page not found");
  if (page.slug === "home") throw new Error("The homepage cannot be deleted");

  await db.page.delete({ where: { id } });
  await logAudit({
    action: AUDIT_ACTIONS.PAGE_DELETED,
    actor: user,
    targetType: "page",
    targetId: id,
    meta: { slug: page.slug, title: page.title },
  });
  revalidatePath("/");
  revalidatePath(`/${page.slug}`);
  return page;
}

/** Duplicate a page: copies meta + sections as draft. */
export async function duplicatePage(id: string, opts?: { newSlug?: string; newTitle?: string }) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");

  const source = await db.page.findUnique({
    where: { id },
    include: { sections: true },
  });
  if (!source) throw new Error("Page not found");

  const desiredSlug = opts?.newSlug ?? `${source.slug}-copy`;
  const slugCheck = validateSlug(desiredSlug, { allowMigratableReserved: true });
  if (!slugCheck.valid) throw new Error(slugCheck.error || "Invalid slug");
  const taken = await db.page.findFirst({ where: { slug: desiredSlug } });
  if (taken) throw new Error("Slug is already in use by another page");

  const copy = await db.page.create({
    data: {
      slug: desiredSlug,
      title: opts?.newTitle ?? `${source.title} (Copy)`,
      titleBn: source.titleBn,
      description: source.description,
      descriptionBn: source.descriptionBn,
      status: "draft",
      template: source.template,
      parentId: source.parentId,
      metaTitle: source.metaTitle,
      metaTitleBn: source.metaTitleBn,
      metaDescription: source.metaDescription,
      metaDescriptionBn: source.metaDescriptionBn,
      ogImage: source.ogImage,
      keywords: source.keywords,
      canonicalUrl: source.canonicalUrl,
      createdBy: auth.id,
      sections: {
        create: source.sections.map((s) => ({
          type: s.type,
          title: s.title,
          titleBn: s.titleBn,
          description: s.description,
          descriptionBn: s.descriptionBn,
          sortOrder: s.sortOrder,
          visible: s.visible,
          settings: s.settings,
          content: s.content,
          contentBn: s.contentBn,
        })),
      },
    },
    include: { sections: true },
  });

  await logAudit({
    action: AUDIT_ACTIONS.PAGE_DUPLICATED,
    actor: auth,
    targetType: "page",
    targetId: copy.id,
    meta: { fromId: id, fromSlug: source.slug, toSlug: copy.slug },
  });
  revalidatePath("/");
  revalidatePath(`/${copy.slug}`);
  return copy;
}

// ============================================================
// Page Sections CRUD
// ============================================================

export async function createSection(
  pageId: string,
  data: {
    type: string;
    title?: string;
    titleBn?: string;
    description?: string;
    descriptionBn?: string;
    settings?: string;
    content?: string;
    contentBn?: string;
    visible?: boolean;
  }
) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");

  const page = await db.page.findUnique({ where: { id: pageId }, select: { id: true, slug: true } });
  if (!page) throw new Error("Page not found");

  const { settings, content, contentBn } = {
    settings: data.settings === undefined ? "{}" : sanitizeSectionString(data.settings),
    content: data.content === undefined ? "{}" : sanitizeSectionString(data.content),
    contentBn: data.contentBn === undefined ? "{}" : sanitizeSectionString(data.contentBn),
  };

  const maxOrder = await db.pageSection.findFirst({
    where: { pageId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const section = await db.pageSection.create({
    data: {
      pageId,
      type: data.type,
      title: clampText(data.title, 200),
      titleBn: clampText(data.titleBn, 200),
      description: clampText(data.description, 500),
      descriptionBn: clampText(data.descriptionBn, 500),
      sortOrder: (maxOrder?.sortOrder ?? 0) + 1,
      visible: data.visible ?? true,
      settings,
      content,
      contentBn,
    },
    include: { page: true },
  });

  await logAudit({
    action: AUDIT_ACTIONS.SECTION_CREATED,
    actor: auth,
    targetType: "page",
    targetId: page.id,
    meta: { slug: page.slug, sectionId: section.id, type: section.type },
  });

  revalidatePath("/");
  if (section.page) revalidatePath(`/${section.page.slug}`);
  return section;
}

function sanitizeSectionString(raw: string): string {
  const res = serializeSectionJson(raw);
  if (!res.ok) throw new Error(res.error || "Invalid section data");
  return res.value as string;
}

export async function updateSection(id: string, data: Record<string, unknown>) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");

  const existing = await db.pageSection.findUnique({ where: { id }, include: { page: true } });
  if (!existing) throw new Error("Section not found");

  const writable: Record<string, unknown> = {};
  if (data.title !== undefined) writable.title = clampText(String(data.title), 200);
  if (data.titleBn !== undefined) writable.titleBn = clampText(String(data.titleBn), 200);
  if (data.description !== undefined) writable.description = clampText(String(data.description), 500);
  if (data.descriptionBn !== undefined) writable.descriptionBn = clampText(String(data.descriptionBn), 500);
  if (data.visible !== undefined) writable.visible = Boolean(data.visible);
  if (typeof data.content === "string") writable.content = sanitizeSectionString(data.content);
  if (typeof data.contentBn === "string") writable.contentBn = sanitizeSectionString(data.contentBn);
  if (typeof data.settings === "string") writable.settings = sanitizeSectionString(data.settings);

  const section = await db.pageSection.update({
    where: { id },
    data: writable,
    include: { page: true },
  });

  await logAudit({
    action: AUDIT_ACTIONS.SECTION_UPDATED,
    actor: auth,
    targetType: "page",
    targetId: section.page?.id ?? null,
    meta: { slug: section.page?.slug ?? null, sectionId: section.id, type: section.type },
  });

  revalidatePath("/");
  if (section.page) revalidatePath(`/${section.page.slug}`);
  return section;
}

export async function deleteSection(id: string) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");

  const section = await db.pageSection.delete({
    where: { id },
    include: { page: true },
  });

  await logAudit({
    action: AUDIT_ACTIONS.SECTION_DELETED,
    actor: auth,
    targetType: "page",
    targetId: section.page?.id ?? null,
    meta: { slug: section.page?.slug ?? null, sectionId: section.id, type: section.type },
  });

  revalidatePath("/");
  if (section.page) revalidatePath(`/${section.page.slug}`);
  return section;
}

export async function duplicateSection(id: string) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");

  const source = await db.pageSection.findUnique({ where: { id }, include: { page: true } });
  if (!source) throw new Error("Section not found");

  const maxOrder = await db.pageSection.findFirst({
    where: { pageId: source.pageId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const section = await db.pageSection.create({
    data: {
      pageId: source.pageId,
      type: source.type,
      title: source.title,
      titleBn: source.titleBn,
      description: source.description,
      descriptionBn: source.descriptionBn,
      sortOrder: (maxOrder?.sortOrder ?? 0) + 1,
      visible: source.visible,
      settings: source.settings,
      content: source.content,
      contentBn: source.contentBn,
    },
    include: { page: true },
  });

  await logAudit({
    action: AUDIT_ACTIONS.SECTION_CREATED,
    actor: auth,
    targetType: "page",
    targetId: source.pageId,
    meta: {
      slug: source.page?.slug ?? null,
      sectionId: section.id,
      type: section.type,
      duplicatedFrom: source.id,
    },
  });

  revalidatePath("/");
  if (section.page) revalidatePath(`/${section.page.slug}`);
  return section;
}

export async function reorderSections(pageId: string, sectionIds: string[]) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");

  // Only sections that actually belong to the given page may be reordered.
  const owned = await db.pageSection.findMany({
    where: { pageId, id: { in: sectionIds.slice(0, 200) } },
    select: { id: true, sortOrder: true },
  });
  const ownedIds = new Set(owned.map((s) => s.id));
  const validIds = Array.from(ownedIds);
  if (validIds.length === 0) throw new Error("No valid sections to reorder");

  await db.$transaction(
    validIds.map((id, i) =>
      db.pageSection.update({ where: { id }, data: { sortOrder: i } })
    )
  );

  const page = await db.page.findUnique({ where: { id: pageId }, select: { slug: true } });
  await logAudit({
    action: AUDIT_ACTIONS.SECTION_REORDERED,
    actor: auth,
    targetType: "page",
    targetId: pageId,
    meta: { slug: page?.slug ?? null, count: sectionIds.length },
  });
  revalidatePath("/");
  if (page) revalidatePath(`/${page.slug}`);
}

// ============================================================
// Page Revisions (snapshot / list / restore)
// ============================================================

export async function savePageRevision(pageId: string, label?: string) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");

  const page = await db.page.findUnique({ where: { id: pageId } });
  if (!page) throw new Error("Page not found");
  const sections = await db.pageSection.findMany({
    where: { pageId },
    orderBy: { sortOrder: "asc" },
  });

  const pageSnapshot: Record<string, unknown> = {
    slug: page.slug,
  };
  for (const field of PAGE_MUTABLE_FIELDS) {
    pageSnapshot[field] = (page as unknown as Record<string, unknown>)[field] ?? null;
  }

  const revision = await db.pageRevision.create({
    data: {
      pageId,
      label: clampText(label ?? "", 120),
      pageSnapshot: toJson(pageSnapshot),
      sectionsSnapshot: toJson(
        sections.map((s) => ({
          type: s.type,
          title: s.title,
          titleBn: s.titleBn,
          description: s.description,
          descriptionBn: s.descriptionBn,
          sortOrder: s.sortOrder,
          visible: s.visible,
          settings: s.settings,
          content: s.content,
          contentBn: s.contentBn,
        }))
      ),
      createdBy: auth.id,
    },
  });

  await logAudit({
    action: AUDIT_ACTIONS.PAGE_REVISION_SAVED,
    actor: auth,
    targetType: "page",
    targetId: pageId,
    meta: { slug: page.slug, revisionId: revision.id, label: revision.label, sections: sections.length },
  });
  return revision;
}

export async function getPageRevisions(pageId: string) {
  requireAuth(await getCurrentUser(), "viewer");

  const rows = await db.pageRevision.findMany({
    where: { pageId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const creatorIds = [...new Set(rows.map((r) => r.createdBy).filter((v): v is string => Boolean(v)))];
  const creators = creatorIds.length
    ? await db.user.findMany({ where: { id: { in: creatorIds } }, select: { id: true, name: true } })
    : [];
  const creatorNames = new Map(creators.map((c) => [c.id, c.name]));

  return rows.map((r) => {
    let sectionsCount = 0;
    try {
      const parsed = JSON.parse(r.sectionsSnapshot);
      if (Array.isArray(parsed)) sectionsCount = parsed.length;
    } catch { /* ignore */ }
    return {
      id: r.id,
      label: r.label,
      createdAt: r.createdAt,
      sectionsCount,
      createdBy: r.createdBy,
      createdByName: r.createdBy ? creatorNames.get(r.createdBy) ?? null : null,
      status: (safeParse(r.pageSnapshot) as Record<string, unknown>).status ?? null,
    };
  });
}

export async function restorePageRevision(revisionId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  requireAdmin(user);

  const revision = await db.pageRevision.findUnique({ where: { id: revisionId } });
  if (!revision) throw new Error("Revision not found");

  const pageSnapshot = safeParse(revision.pageSnapshot);
  const sectionsSnapshot = JSON.parse(revision.sectionsSnapshot || "[]") as Array<Record<string, unknown>>;

  // Snapshot the CURRENT state before overwriting (undo-able).
  await savePageRevision(revision.pageId, "auto: before restore");

  await db.$transaction(async (tx) => {
    const pageData: Record<string, unknown> = {};
    for (const field of PAGE_MUTABLE_FIELDS) {
      const value = pageSnapshot[field];
      if (value !== undefined && value !== null) {
        pageData[field] = value;
      }
    }
    if (typeof pageSnapshot.slug === "string") {
      // Restoring the historical slug is allowed only if free or unchanged.
      const current = await tx.page.findUnique({ where: { id: revision.pageId }, select: { slug: true } });
      if (current && pageSnapshot.slug !== current.slug) {
        const slugCheck = validateSlug(pageSnapshot.slug);
        if (slugCheck.valid) {
          const taken = await tx.page.findFirst({ where: { slug: pageSnapshot.slug, NOT: { id: revision.pageId } } });
          if (!taken) pageData.slug = pageSnapshot.slug;
        }
      }
    }
    if (Object.keys(pageData).length > 0) {
      await tx.page.update({ where: { id: revision.pageId }, data: pageData });
    }

    await tx.pageSection.deleteMany({ where: { pageId: revision.pageId } });
    if (Array.isArray(sectionsSnapshot) && sectionsSnapshot.length > 0) {
      await tx.pageSection.createMany({
        data: sectionsSnapshot.map((s, i) => ({
          pageId: revision.pageId,
          type: String(s.type ?? "text"),
          title: typeof s.title === "string" ? s.title : "",
          titleBn: typeof s.titleBn === "string" ? s.titleBn : "",
          description: typeof s.description === "string" ? s.description : "",
          descriptionBn: typeof s.descriptionBn === "string" ? s.descriptionBn : "",
          sortOrder: typeof s.sortOrder === "number" ? s.sortOrder : i,
          visible: s.visible !== false,
          settings: typeof s.settings === "string" ? s.settings : "{}",
          content: typeof s.content === "string" ? s.content : "{}",
          contentBn: typeof s.contentBn === "string" ? s.contentBn : "{}",
        })),
      });
    }
  });

  await logAudit({
    action: AUDIT_ACTIONS.PAGE_REVISION_RESTORED,
    actor: user,
    targetType: "page",
    targetId: revision.pageId,
    meta: { revisionId, label: revision.label },
  });

  const page = await db.page.findUnique({ where: { id: revision.pageId }, select: { slug: true } });
  revalidatePath("/");
  if (page) revalidatePath(`/${page.slug}`);
  return { success: true };
}

// ============================================================
// Site Settings
// ============================================================

export async function getSiteSettings(group?: string) {
  requireAuth(await getCurrentUser(), "viewer");
  const where = group ? { group } : {};
  return db.siteSetting.findMany({ where, orderBy: { sortOrder: "asc" } });
}

export async function getSiteSetting(key: string) {
  requireAuth(await getCurrentUser(), "viewer");
  return db.siteSetting.findUnique({ where: { key } });
}

export async function upsertSiteSetting(
  key: string,
  data: {
    value: string;
    valueBn?: string;
    type?: string;
    group?: string;
    label?: string;
    labelBn?: string;
    sortOrder?: number;
  }
) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");

  if (typeof key !== "string" || !/^[a-z0-9_]{1,60}$/.test(key)) {
    throw new Error("Invalid setting key");
  }

  const setting = await db.siteSetting.upsert({
    where: { key },
    update: data,
    create: { key, ...data },
  });

  await logAudit({
    action: AUDIT_ACTIONS.SETTING_SAVED,
    actor: auth,
    targetType: "setting",
    targetId: setting.id,
    meta: { key: setting.key, group: setting.group },
  });

  revalidatePath("/", "layout");
  return setting;
}

export async function updateSiteSettingsBulk(
  settings: {
    key: string;
    value: string;
    valueBn?: string;
    type?: string;
    group?: string;
    label?: string;
    labelBn?: string;
  }[]
) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");

  const keys = settings.map((s) => s.key);
  if (keys.some((k) => typeof k !== "string" || !/^[a-z0-9_]{1,60}$/.test(k))) {
    throw new Error("Invalid setting key");
  }

  await Promise.all(
    settings.map((s) =>
      db.siteSetting.upsert({
        where: { key: s.key },
        update: {
          value: s.value,
          valueBn: s.valueBn,
          type: s.type,
          group: s.group,
          label: s.label,
          labelBn: s.labelBn,
        },
        create: {
          key: s.key,
          value: s.value,
          valueBn: s.valueBn,
          type: s.type,
          group: s.group,
          label: s.label,
          labelBn: s.labelBn,
        },
      })
    )
  );

  if (settings.length > 0) {
    await logAudit({
      action: AUDIT_ACTIONS.SETTING_SAVED,
      actor: auth,
      targetType: "setting",
      meta: { keys: keys.slice(0, 25), count: keys.length },
    });
  }

  revalidatePath("/", "layout");
  return { success: true };
}

// ============================================================
// Menu Items
// ============================================================

export async function getMenuItems(location: string) {
  requireAuth(await getCurrentUser(), "viewer");
  return db.menuItem.findMany({
    where: { location, visible: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getAllMenuItems(location: string) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");
  return db.menuItem.findMany({
    where: { location },
    orderBy: { sortOrder: "asc" },
  });
}

const MENU_LOCATIONS = new Set(["header", "footer"]);

async function validatedMenuData(data: {
  label?: string;
  labelBn?: string;
  description?: string;
  descriptionBn?: string;
  url?: string;
  externalUrl?: string | null;
  parentId?: string | null;
  status?: string;
  isClickable?: boolean;
  openSubmenu?: boolean;
  badgeText?: string | null;
  badgeTextBn?: string | null;
  badgeStyle?: string | null;
  icon?: string | null;
  desktopVisible?: boolean;
  mobileVisible?: boolean;
  roles?: string | null;
}) {
  const clean: Record<string, unknown> = {};
  if (data.label !== undefined) clean.label = clampText(data.label, 100);
  if (data.labelBn !== undefined) clean.labelBn = clampText(data.labelBn, 100);
  if (data.description !== undefined) clean.description = clampText(data.description, 300);
  if (data.descriptionBn !== undefined) clean.descriptionBn = clampText(data.descriptionBn, 300);
  if (data.url !== undefined) {
    const check = sanitizeUrl(data.url);
    if (!check.ok) throw new Error(`Menu URL rejected: ${check.error}`);
    clean.url = check.url ?? "";
  }
  if (data.externalUrl !== undefined) {
    if (data.externalUrl && data.externalUrl.trim()) {
      const check = sanitizeUrl(data.externalUrl);
      if (!check.ok) throw new Error(`External URL rejected: ${check.error}`);
      clean.externalUrl = check.url ?? null;
    } else {
      clean.externalUrl = null;
    }
  }
  if (data.parentId !== undefined) clean.parentId = data.parentId || null;
  if (data.status !== undefined) {
    const s = String(data.status);
    if (!["active", "soon", "draft", "disabled"].includes(s)) {
      throw new Error("Invalid menu status");
    }
    clean.status = s;
  }
  if (data.isClickable !== undefined) clean.isClickable = Boolean(data.isClickable);
  if (data.openSubmenu !== undefined) clean.openSubmenu = Boolean(data.openSubmenu);
  if (data.badgeText !== undefined) clean.badgeText = data.badgeText ? clampText(data.badgeText, 40) : null;
  if (data.badgeTextBn !== undefined) clean.badgeTextBn = data.badgeTextBn ? clampText(data.badgeTextBn, 40) : null;
  if (data.badgeStyle !== undefined) clean.badgeStyle = data.badgeStyle ? clampText(data.badgeStyle, 30) : "gold";
  if (data.icon !== undefined) clean.icon = data.icon ? clampText(data.icon, 50) : null;
  if (data.desktopVisible !== undefined) clean.desktopVisible = Boolean(data.desktopVisible);
  if (data.mobileVisible !== undefined) clean.mobileVisible = Boolean(data.mobileVisible);
  if (data.roles !== undefined) clean.roles = data.roles ? clampText(data.roles, 50) : "all";
  return clean;
}

export async function createMenuItem(data: {
  location: string;
  label: string;
  labelBn?: string;
  description?: string;
  descriptionBn?: string;
  url: string;
  externalUrl?: string | null;
  sortOrder?: number;
  visible?: boolean;
  status?: string;
  isClickable?: boolean;
  openSubmenu?: boolean;
  badgeText?: string | null;
  badgeTextBn?: string | null;
  badgeStyle?: string | null;
  icon?: string | null;
  desktopVisible?: boolean;
  mobileVisible?: boolean;
  roles?: string | null;
  target?: string;
  parentId?: string | null;
}) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");

  if (!MENU_LOCATIONS.has(data.location)) throw new Error("Invalid menu location");
  const clean = await validatedMenuData(data);
  const parentId = assertValidMenuParentInput(clean.parentId, undefined);
  if (parentId) await assertValidMenuParent(parentId, data.location);

  const maxOrder = await db.menuItem.findFirst({
    where: { location: data.location },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const item = await db.menuItem.create({
    data: {
      ...data,
      ...clean,
      sortOrder: data.sortOrder ?? (maxOrder?.sortOrder ?? 0) + 1,
    },
  });

  await logAudit({
    action: AUDIT_ACTIONS.MENU_CREATED,
    actor: auth,
    targetType: "menu",
    targetId: item.id,
    meta: { location: item.location, label: item.label, url: item.url },
  });

  revalidatePath("/", "layout");
  return item;
}

export async function updateMenuItem(id: string, data: Record<string, unknown>) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");

  const clean = await validatedMenuData(data as any);

  const extra: Record<string, unknown> = {};
  let targetLocation = "";
  if (data.location !== undefined) {
    if (!MENU_LOCATIONS.has(String(data.location))) throw new Error("Invalid menu location");
    extra.location = data.location;
    targetLocation = String(data.location);
  }
  if (data.visible !== undefined) extra.visible = Boolean(data.visible);
  if (data.target !== undefined) {
    const t = String(data.target);
    if (t !== "_self" && t !== "_blank") throw new Error("Invalid target");
    extra.target = t;
  }
  if (data.sortOrder !== undefined && typeof data.sortOrder === "number") {
    extra.sortOrder = data.sortOrder;
  }

  const parentId = assertValidMenuParentInput(clean.parentId, id);
  if (parentId) {
    const effectiveLocation = targetLocation || (await db.menuItem.findUnique({ where: { id } }))?.location;
    if (!effectiveLocation) throw new Error("Menu item not found");
    await assertValidMenuParent(parentId, effectiveLocation, id);
  }

  const item = await db.menuItem.update({ where: { id }, data: { ...extra, ...clean } });
  await logAudit({
    action: AUDIT_ACTIONS.MENU_UPDATED,
    actor: auth,
    targetType: "menu",
    targetId: item.id,
    meta: { location: item.location, label: item.label, url: item.url, visible: item.visible },
  });
  revalidatePath("/", "layout");
  return item;
}

export async function deleteMenuItem(id: string) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");

  // Detach children first so the menu tree does not orphan.
  await db.menuItem.updateMany({ where: { parentId: id }, data: { parentId: null } });
  const item = await db.menuItem.delete({ where: { id } });

  await logAudit({
    action: AUDIT_ACTIONS.MENU_DELETED,
    actor: auth,
    targetType: "menu",
    targetId: id,
    meta: { location: item.location, label: item.label },
  });
  revalidatePath("/", "layout");
  return item;
}

export async function reorderMenuItems(location: string, itemIds: string[]) {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");

  // Ownership validation: only items that actually live in the given
  // location may be reordered. Without this, an editor passing ids from
  // another location (or arbitrary ids) would rewrite unrelated sort
  // orders across menus.
  if (!MENU_LOCATIONS.has(location)) throw new Error("Invalid menu location");
  const ids = Array.isArray(itemIds) ? itemIds.slice(0, 200).filter((id) => typeof id === "string" && id) : [];
  if (ids.length === 0) throw new Error("No menu items to reorder");
  const owned = await db.menuItem.findMany({
    where: { location, id: { in: ids } },
    select: { id: true },
  });
  const ownedIds = new Set(owned.map((item) => item.id));
  if (ids.some((id) => !ownedIds.has(id))) {
    throw new Error("Menu items must belong to the location being reordered");
  }

  await db.$transaction(
    ids.map((id, i) => db.menuItem.update({ where: { id }, data: { sortOrder: i } }))
  );

  await logAudit({
    action: AUDIT_ACTIONS.MENU_REORDERED,
    actor: auth,
    targetType: "menu",
    meta: { location, count: ids.length },
  });
  revalidatePath("/", "layout");
  return { success: true };
}

export async function seedDefaultNavigation(location: "header" | "footer" | "all" = "all") {
  const auth = await checkAuth();
  if (!auth) throw new Error("Unauthorized");
  if (auth.role !== "super_admin" && auth.role !== "admin") {
    throw new Error("Only administrators can seed default navigation");
  }

  const seedBranch = async (
    items: DefaultNavItem[],
    loc: "header" | "footer",
    parentId: string | null = null,
    orderOffset: number = 0
  ) => {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const created = await db.menuItem.create({
        data: {
          location: loc,
          label: item.label,
          labelBn: item.labelBn || "",
          url: item.url,
          status: item.status || "active",
          visible: item.visible !== false,
          isClickable: item.isClickable !== false,
          openSubmenu: item.openSubmenu !== false,
          badgeText: item.badgeText || null,
          badgeTextBn: item.badgeTextBn || null,
          badgeStyle: item.badgeStyle || "gold",
          icon: item.icon || null,
          target: item.target || "_self",
          parentId,
          sortOrder: orderOffset + i,
          desktopVisible: item.desktopVisible !== false,
          mobileVisible: item.mobileVisible !== false,
        },
      });
      if (item.children && item.children.length > 0) {
        await seedBranch(item.children, loc, created.id, 0);
      }
    }
  };

  if (location === "header" || location === "all") {
    await db.menuItem.deleteMany({ where: { location: "header" } });
    await seedBranch(DEFAULT_HEADER_NAVIGATION, "header");
  }

  if (location === "footer" || location === "all") {
    await db.menuItem.deleteMany({ where: { location: "footer" } });
    await seedBranch(DEFAULT_FOOTER_NAVIGATION, "footer");
  }

  revalidatePath("/", "layout");
  return { success: true };
}

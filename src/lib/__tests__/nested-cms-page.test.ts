import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateSlug, normalizeSlug } from "@/lib/cms-validation";
import { getPublicPage } from "@/lib/actions/cms";
import { db } from "@/lib/db";

// Mock db for hierarchical page resolution tests
vi.mock("@/lib/db", () => ({
  db: {
    page: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    siteSetting: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: <T extends (...args: never[]) => unknown>(fn: T): T => fn, // direct execution in tests without cache wrapper
}));

describe("Nested CMS Slug Validation", () => {
  it("accepts valid hierarchical paths", () => {
    const validSlugs = [
      "about/vision",
      "about/team",
      "theme/research",
      "theme/media-bias",
      "courses/photography",
      "courses/photography/documentary-lab",
    ];
    for (const slug of validSlugs) {
      const res = validateSlug(slug);
      expect(res.valid, `Expected "${slug}" to be valid`).toBe(true);
    }
  });

  it("rejects invalid hierarchical paths", () => {
    const invalidSlugs = [
      "/About",
      "about/",
      "about//team",
      "about team",
      "https://example.com",
      "/about",
      "about?test=1",
      "about/-team",
      "about/team-",
      "about/double--hyphen",
      "12345",
    ];
    for (const slug of invalidSlugs) {
      const res = validateSlug(slug);
      expect(res.valid, `Expected "${slug}" to be invalid`).toBe(false);
    }
  });

  it("rejects protected root prefixes in nested slugs", () => {
    const protectedSlugs = [
      "admin/settings",
      "api/auth",
      "og/image",
      "_next/static",
      "private/data",
      "uploads/document.pdf",
      "images/banner.png",
      "home/extra",
      "partnerships/apply",
      "rss.xml/feed",
      "sitemap.xml/page",
      "manifest.json/app",
      "favicon.ico/icon",
      "robots.txt/disallow",
    ];
    for (const slug of protectedSlugs) {
      const res = validateSlug(slug);
      expect(res.valid, `Expected "${slug}" to be rejected due to protected prefix`).toBe(false);
    }
  });

  it("normalizes nested slugs safely", () => {
    expect(normalizeSlug("  About / Vision  ")).toBe("about/vision");
    expect(normalizeSlug("/about/team/")).toBe("about/team");
    expect(normalizeSlug("courses//photography//lab")).toBe("courses/photography/lab");
  });
});

describe("Nested CMS Page Hierarchy & Breadcrumb Resolution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resolves multi-level parent hierarchy via parentId and populates breadcrumbs", async () => {
    const parentPage = {
      id: "parent-id-about",
      slug: "about",
      title: "About LENS",
      titleBn: "লেন্স সম্পর্কে",
      parentId: null,
      status: "published",
    };

    const childPage = {
      id: "child-id-vision",
      slug: "about/vision",
      title: "Vision & Mission",
      titleBn: "ভিশন ও মিশন",
      parentId: "parent-id-about",
      status: "published",
      template: "default",
      metaTitle: "Vision & Mission — LENS",
      metaTitleBn: null,
      metaDescription: null,
      metaDescriptionBn: null,
      ogImage: null,
      keywords: "[]",
      canonicalUrl: null,
      sections: [],
    };

    // findFirst for the child page
    vi.mocked(db.page.findFirst).mockResolvedValueOnce(childPage as never);
    // findUnique for the parent page
    vi.mocked(db.page.findUnique).mockResolvedValueOnce(parentPage as never);

    const result = await getPublicPage("about/vision");
    expect(result).not.toBeNull();
    expect(result?.slug).toBe("about/vision");
    expect(result?.title).toBe("Vision & Mission");

    // Verify hierarchy
    expect(result?.hierarchy).toBeDefined();
    expect(result?.hierarchy?.current.id).toBe("child-id-vision");
    expect(result?.hierarchy?.ancestors).toHaveLength(1);
    expect(result?.hierarchy?.ancestors[0]).toEqual({
      id: "parent-id-about",
      slug: "about",
      title: "About LENS",
      titleBn: "লেন্স সম্পর্কে",
    });

    // Verify breadcrumbs
    expect(result?.breadcrumbs).toHaveLength(3);
    expect(result?.breadcrumbs?.[0]).toEqual({ label: "Home", labelBn: "হোম", href: "/" });
    expect(result?.breadcrumbs?.[1]).toEqual({
      label: "About LENS",
      labelBn: "লেন্স সম্পর্কে",
      href: "/about",
    });
    expect(result?.breadcrumbs?.[2]).toEqual({
      label: "Vision & Mission",
      labelBn: "ভিশন ও মিশন",
    });
  });

  it("resolves 3-level parent hierarchy (grandparent -> parent -> child)", async () => {
    const grandparent = {
      id: "gp-courses",
      slug: "courses",
      title: "Courses",
      titleBn: "কোর্সসমূহ",
      parentId: null,
      status: "published",
    };
    const parent = {
      id: "p-photo",
      slug: "courses/photography",
      title: "Photography",
      titleBn: "ফটোগ্রাফি",
      parentId: "gp-courses",
      status: "published",
    };
    const child = {
      id: "c-lab",
      slug: "courses/photography/documentary-lab",
      title: "Documentary Lab",
      titleBn: "ডকুমেন্টারি ল্যাব",
      parentId: "p-photo",
      status: "published",
      template: "default",
      metaTitle: "Documentary Lab",
      metaTitleBn: null,
      metaDescription: null,
      metaDescriptionBn: null,
      ogImage: null,
      keywords: "[]",
      canonicalUrl: null,
      sections: [],
    };

    vi.mocked(db.page.findFirst).mockResolvedValueOnce(child as never);
    vi.mocked(db.page.findUnique)
      .mockResolvedValueOnce(parent as never)
      .mockResolvedValueOnce(grandparent as never);

    const result = await getPublicPage("courses/photography/documentary-lab");
    expect(result).not.toBeNull();
    expect(result?.hierarchy?.ancestors).toHaveLength(2);
    expect(result?.hierarchy?.ancestors[0].title).toBe("Courses");
    expect(result?.hierarchy?.ancestors[1].title).toBe("Photography");

    expect(result?.breadcrumbs).toHaveLength(4);
    expect(result?.breadcrumbs?.[0].label).toBe("Home");
    expect(result?.breadcrumbs?.[1].label).toBe("Courses");
    expect(result?.breadcrumbs?.[2].label).toBe("Photography");
    expect(result?.breadcrumbs?.[3].label).toBe("Documentary Lab");
  });

  it("synthesizes ancestor breadcrumbs by slug prefix when parentId is omitted", async () => {
    const child = {
      id: "c-media-bias",
      slug: "theme/media-bias",
      title: "Media Bias",
      titleBn: "মিডিয়া পক্ষপাতিত্ব",
      parentId: null, // no direct DB parent relation
      status: "published",
      template: "default",
      metaTitle: "Media Bias",
      metaTitleBn: null,
      metaDescription: null,
      metaDescriptionBn: null,
      ogImage: null,
      keywords: "[]",
      canonicalUrl: null,
      sections: [],
    };

    vi.mocked(db.page.findFirst)
      .mockResolvedValueOnce(child as never) // lookup child
      .mockResolvedValueOnce(null); // lookup theme prefix (not in db, synthetic)

    const result = await getPublicPage("theme/media-bias");
    expect(result).not.toBeNull();
    expect(result?.hierarchy?.ancestors).toHaveLength(1);
    expect(result?.hierarchy?.ancestors[0].slug).toBe("theme");
    expect(result?.hierarchy?.ancestors[0].title).toBe("Theme");

    expect(result?.breadcrumbs).toHaveLength(3);
    expect(result?.breadcrumbs?.[0]).toEqual({ label: "Home", labelBn: "হোম", href: "/" });
    expect(result?.breadcrumbs?.[1]).toEqual({ label: "Theme", labelBn: undefined, href: "/theme" });
    expect(result?.breadcrumbs?.[2]).toEqual({ label: "Media Bias", labelBn: "মিডিয়া পক্ষপাতিত্ব" });
  });

  it("returns null for unpublished or nonexistent pages", async () => {
    vi.mocked(db.page.findFirst).mockResolvedValueOnce(null);
    const result = await getPublicPage("unknown/nested/page");
    expect(result).toBeNull();
  });

  it("excludes draft/unpublished ancestor pages from public breadcrumbs", async () => {
    const draftParent = {
      id: "parent-draft-id",
      slug: "about",
      title: "Secret Draft About",
      titleBn: "ড্রাফট লেন্স",
      parentId: null,
      status: "draft", // UNPUBLISHED PARENT
    };

    const publishedChild = {
      id: "child-vision-id",
      slug: "about/vision",
      title: "Public Vision",
      titleBn: "পাবলিক ভিশন",
      parentId: "parent-draft-id",
      status: "published",
      template: "default",
      metaTitle: "Public Vision",
      metaTitleBn: null,
      metaDescription: null,
      metaDescriptionBn: null,
      ogImage: null,
      keywords: "[]",
      canonicalUrl: null,
      sections: [],
    };

    vi.mocked(db.page.findFirst).mockResolvedValueOnce(publishedChild as never);
    vi.mocked(db.page.findUnique).mockResolvedValueOnce(draftParent as never);

    const result = await getPublicPage("about/vision");
    expect(result).not.toBeNull();
    // Ancestors array must NOT contain the draft parent
    expect(result?.hierarchy?.ancestors).toEqual([]);
    // Breadcrumbs must NOT contain the draft parent title or link
    expect(result?.breadcrumbs).toHaveLength(2);
    expect(result?.breadcrumbs?.[0]).toEqual({ label: "Home", labelBn: "হোম", href: "/" });
    expect(result?.breadcrumbs?.[1]).toEqual({ label: "Public Vision", labelBn: "পাবলিক ভিশন" });
  });

  it("does not synthesize ancestor breadcrumb when an ancestor prefix matches a draft page", async () => {
    const publishedChild = {
      id: "child-team-id",
      slug: "about/team",
      title: "Team Page",
      titleBn: "টিম",
      parentId: null,
      status: "published",
      template: "default",
      metaTitle: "Team Page",
      metaTitleBn: null,
      metaDescription: null,
      metaDescriptionBn: null,
      ogImage: null,
      keywords: "[]",
      canonicalUrl: null,
      sections: [],
    };

    const draftAncestor = {
      id: "about-draft-record",
      slug: "about",
      status: "draft",
    };

    vi.mocked(db.page.findFirst)
      .mockResolvedValueOnce(publishedChild as never) // lookup child
      .mockResolvedValueOnce(null) // lookup published ancestor "about" -> not published
      .mockResolvedValueOnce(draftAncestor as never); // lookup draft record for "about" -> found draft

    const result = await getPublicPage("about/team");
    expect(result).not.toBeNull();
    // Since ancestor "about" exists as draft in CMS, it must NOT be exposed
    expect(result?.hierarchy?.ancestors).toEqual([]);
    expect(result?.breadcrumbs).toHaveLength(2);
    expect(result?.breadcrumbs?.[0]).toEqual({ label: "Home", labelBn: "হোম", href: "/" });
    expect(result?.breadcrumbs?.[1]).toEqual({ label: "Team Page", labelBn: "টিম" });
  });
});

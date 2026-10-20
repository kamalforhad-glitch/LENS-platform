import { describe, it, expect, vi, beforeEach } from "vitest";
import { DEFAULT_SITE_SETTINGS, DEFAULT_HOME_SECTIONS } from "@/lib/cms-defaults";
import { getPublicSiteSettings, getPublicPage } from "@/lib/actions/cms";

// Mock the database client
vi.mock("@/lib/db", () => {
  return {
    db: {
      siteSetting: {
        findMany: vi.fn(),
        upsert: vi.fn(),
      },
      page: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
      },
      pageSection: {
        upsert: vi.fn(),
      },
    },
  };
});

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock auth
vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
  requireAuth: vi.fn(),
  requireEditor: vi.fn(),
  requireAdmin: vi.fn(),
}));

import { db } from "@/lib/db";

describe("CMS System Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("CMS Defaults", () => {
    it("provides complete default site settings for branding, social, contact, and SEO", () => {
      expect(DEFAULT_SITE_SETTINGS.length).toBeGreaterThan(15);
      const keys = DEFAULT_SITE_SETTINGS.map((s) => s.key);
      expect(keys).toContain("site_name");
      expect(keys).toContain("site_tagline");
      expect(keys).toContain("contact_email");
      expect(keys).toContain("social_facebook");
      expect(keys).toContain("social_twitter");
      expect(keys).toContain("seo_meta_title");
      expect(keys).toContain("seo_meta_description");
    });

    it("provides full default home sections with bilingual contents", () => {
      expect(DEFAULT_HOME_SECTIONS.length).toBe(5);

      const sectionTypes = DEFAULT_HOME_SECTIONS.map((s) => s.type);
      expect(sectionTypes).toContain("hero");
      expect(sectionTypes).toContain("focus");
      expect(sectionTypes).toContain("featured_research");
      expect(sectionTypes).toContain("impact");
      expect(sectionTypes).toContain("events_newsletter");

      const hero = DEFAULT_HOME_SECTIONS.find((s) => s.type === "hero");
      expect(hero).toBeDefined();
      expect(hero!.content).toBeDefined();
      expect(hero!.contentBn).toBeDefined();
    });
  });

  describe("Public Cached Getters & Fallbacks", () => {
    it("returns database settings when present", async () => {
      (db.siteSetting.findMany as any).mockResolvedValueOnce([
        { key: "site_name", value: "Custom LENS Name", valueBn: "কাস্টম লেন্স" },
        { key: "contact_email", value: "custom@lensbd.org", valueBn: "" },
      ]);

      const settings = await getPublicSiteSettings();
      expect(settings.site_name.value).toBe("Custom LENS Name");
      expect(settings.site_name.valueBn).toBe("কাস্টম লেন্স");
      expect(settings.contact_email.value).toBe("custom@lensbd.org");
      // Other defaults should still be merged from defaults
      expect(settings.social_facebook.value).toBe("https://www.facebook.com/lensorgbd");
    });

    it("falls back gracefully to defaults if database query errors", async () => {
      (db.siteSetting.findMany as any).mockRejectedValueOnce(new Error("DB connection refused"));

      const settings = await getPublicSiteSettings();
      expect(settings.site_name.value).toBe("LENS Bangladesh");
      expect(settings.contact_email.value).toBe("info@lensbd.org");
      expect(settings.social_facebook.value).toBe("https://www.facebook.com/lensorgbd");
    });

    it("returns database page and sections when found", async () => {
      (db.page.findFirst as any).mockResolvedValueOnce({
        id: "page-123",
        slug: "home",
        title: "Home",
        titleBn: "হোম",
        status: "published",
        sections: [
          {
            id: "sec-hero",
            type: "hero",
            title: "Hero Section",
            titleBn: "হিরো সেকশন",
            description: "",
            descriptionBn: "",
            sortOrder: 0,
            visible: true,
            settings: "{}",
            content: JSON.stringify({ badge: "Updated Badge" }),
            contentBn: JSON.stringify({ badge: "হালনাগাদ ব্যাজ" }),
          },
        ],
      });

      const page = await getPublicPage("home");
      expect(page).toBeDefined();
      expect(page!.id).toBe("page-123");
      expect(page!.sections.length).toBe(1);
      expect(page!.sections[0].type).toBe("hero");
      expect(page!.sections[0].content).toEqual({ badge: "Updated Badge" });
    });

    it("falls back gracefully to default-home if home page query returns null", async () => {
      (db.page.findFirst as any).mockResolvedValueOnce(null);

      const page = await getPublicPage("home");
      expect(page).toBeDefined();
      expect(page!.slug).toBe("home");
      expect(page!.sections.length).toBe(5);
      expect(page!.id).toBe("default-home");
    });

    it("falls back gracefully to fallback-home if home query errors", async () => {
      (db.page.findFirst as any).mockRejectedValueOnce(new Error("Connection timeout"));

      const page = await getPublicPage("home");
      expect(page).toBeDefined();
      expect(page!.slug).toBe("home");
      expect(page!.sections.length).toBe(5);
      expect(page!.id).toBe("fallback-home");
    });
  });
});

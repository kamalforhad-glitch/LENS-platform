import { describe, it, expect, vi } from "vitest";

// Mock db
vi.mock("@/lib/db", () => ({
  db: {
    researchArticle: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    blogPost: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    page: {
      findMany: vi.fn().mockResolvedValue([
        // Duplicate of hardcoded /about/vision
        { slug: "about/vision", dateModified: new Date("2026-01-01") },
        // Duplicate of hardcoded /about/team
        { slug: "about/team", dateModified: new Date("2026-01-02") },
        // Valid novel nested CMS page
        { slug: "courses/photography/documentary-lab", dateModified: new Date("2026-02-01") },
        // Protected root paths that should never be in sitemap
        { slug: "admin/dashboard", dateModified: new Date("2026-01-01") },
        { slug: "api/v1/posts", dateModified: new Date("2026-01-01") },
        { slug: "uploads/file.png", dateModified: new Date("2026-01-01") },
        { slug: "home", dateModified: new Date("2026-01-01") },
        { slug: "partnerships", dateModified: new Date("2026-01-01") },
      ]),
    },
  },
}));

vi.mock("@/lib/site-url", () => ({
  resolveBaseUrl: () => "https://www.lensbd.org",
}));

describe("Sitemap Deduplication & Infrastructure URL Protection", () => {
  it("emits zero duplicate URLs and excludes protected infrastructure paths", async () => {
    const sitemapModule = await import("@/app/sitemap");
    const entries = await sitemapModule.default();

    // Verify all emitted URLs are strictly unique
    const urls = entries.map((e) => e.url.toLowerCase());
    const uniqueUrls = new Set(urls);
    expect(urls.length).toBe(uniqueUrls.size);

    // Verify hardcoded items like /about/vision only appear once
    const visionEntries = urls.filter((u) => u.endsWith("/about/vision"));
    expect(visionEntries).toHaveLength(1);

    const teamEntries = urls.filter((u) => u.endsWith("/about/team"));
    expect(teamEntries).toHaveLength(1);

    // Verify legitimate nested CMS page is included
    const nestedCourse = urls.filter((u) => u.endsWith("/courses/photography/documentary-lab"));
    expect(nestedCourse).toHaveLength(1);

    // Verify protected infrastructure paths are excluded
    expect(urls.some((u) => u.includes("/admin"))).toBe(false);
    expect(urls.some((u) => u.includes("/api/"))).toBe(false);
    expect(urls.some((u) => u.includes("/uploads/"))).toBe(false);
    expect(urls.some((u) => u.endsWith("/home"))).toBe(false);
  });
});

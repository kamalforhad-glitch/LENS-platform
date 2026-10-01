const CANONICAL_HOST = "www.lensbd.org";

function resolveBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  if (raw) {
    try {
      const host = new URL(raw).hostname;
      if (host === "lensbd.org" || host === CANONICAL_HOST) {
        return `https://${CANONICAL_HOST}`;
      }
    } catch {
      // Unusable value — fall through to canonical.
    }
  }
  return `https://${CANONICAL_HOST}`;
}

const BASE_URL = resolveBaseUrl();

interface SitemapEntry {
  url: string;
  lastModified: Date;
  changeFrequency: "weekly" | "monthly" | "yearly" | "daily" | "hourly" | "never" | "always";
  priority: number;
}

export default async function sitemap(): Promise<SitemapEntry[]> {
  const lastModified = new Date();

  const pages: SitemapEntry[] = [
    { url: BASE_URL, lastModified, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/about`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/research`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/publications`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/programs`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/media`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/partnerships`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/events`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/blog`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/resources`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/careers`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/contact`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/privacy`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];

  // Research slugs are DB-driven when DATABASE_URL is available (build-safe
  // fallback to the last known static slugs so `next build` never fails
  // without a database).
  let researchSlugs = [
    "narratives-in-the-digital-age",
    "media-index-bangladesh-2025",
    "youth-narratives-civic-engagement",
    "media-literacy-resilient-democracy",
  ];
  try {
    const { db } = await import("@/lib/db");
    const rows = await db.researchArticle.findMany({
      where: { status: "published" },
      select: { slug: true },
      take: 500,
    });
    if (rows.length > 0) researchSlugs = rows.map((r) => r.slug);
  } catch {
    // Build/static fallback — keep hardcoded slugs.
  }

  researchSlugs.forEach((slug) => {
    pages.push({
      url: `${BASE_URL}/research/${slug}`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    });
  });

  return pages;
}

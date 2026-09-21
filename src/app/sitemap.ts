const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lens.org.bd";

interface SitemapEntry {
  url: string;
  lastModified: Date;
  changeFrequency: "weekly" | "monthly" | "yearly" | "daily" | "hourly" | "never" | "always";
  priority: number;
}

export default function sitemap(): SitemapEntry[] {
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

  // Add research articles dynamically
  const researchSlugs = [
    "narratives-in-the-digital-age",
    "media-index-bangladesh-2025",
    "youth-narratives-civic-engagement",
    "media-literacy-resilient-democracy",
  ];

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

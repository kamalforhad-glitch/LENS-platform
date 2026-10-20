// ============================================================
// RSS 2.0 feed — DB-driven so the footer's /rss.xml link and the
// siteSetting `social_rss` resolve to a real feed instead of 404.
// The slug is reserved in RESERVED_SLUGS, so this route owns it.
// Returns `Cache-Control: no-store` to stay aligned with the CMS.
// ============================================================

import { NextRequest } from "next/server";
import { resolveBaseUrl } from "@/lib/site-url";

const BASE_URL = resolveBaseUrl();
const SITE_TITLE = "LENS — Lighthouse for Evolving Narrative Systems";
const SITE_DESCRIPTION =
  "Evidence-based research on media literacy, press freedom, narrative analysis and cybersecurity in Bangladesh.";

const XML_PROLOG = '<?xml version="1.0" encoding="UTF-8"?>';

/** Minimal XML escaping for CDATA-free text nodes and attributes. */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(_request: NextRequest) {
  let itemsXml = "";
  try {
    const { db } = await import("@/lib/db");
    const [posts, research] = await Promise.all([
      db.blogPost.findMany({
        where: { status: "published" },
        orderBy: { datePublished: "desc" },
        select: { slug: true, title: true, description: true, author: true, category: true, datePublished: true },
        take: 20,
      }),
      db.researchArticle.findMany({
        where: { status: "published" },
        orderBy: { datePublished: "desc" },
        select: { slug: true, title: true, description: true, author: true, category: true, datePublished: true },
        take: 20,
      }),
    ]);

    const renderItem = (item: {
      slug: string;
      title: string;
      description: string;
      author: string;
      category: string;
      datePublished: Date | null;
    }, section: "blog" | "library") => {
      const pub = item.datePublished ? item.datePublished.toUTCString() : "";
      return [
        "    <item>",
        `      <title>${esc(item.title)}</title>`,
        `      <link>${esc(`${BASE_URL}/${section}/${item.slug}`)}</link>`,
        `      <guid>${esc(`${BASE_URL}/${section}/${item.slug}`)}</guid>`,
        `      <description>${esc(item.description)}</description>`,
        `      <author>${esc(item.author || "LENS Research Team")}</author>`,
        `      <category>${esc(item.category)}</category>`,
        pub ? `      <pubDate>${pub}</pubDate>` : "",
        "    </item>",
      ]
        .filter(Boolean)
        .join("\n");
    };

    const blog = posts.map((r) => renderItem(r, "blog"));
    const lib = research.map((r) => renderItem(r, "library"));
    itemsXml = [...blog, ...lib].join("\n");
  } catch {
    // Database unavailable (e.g. during a cold build) — serve an empty feed
    // rather than breaking the crawler's fetch.
    itemsXml = "";
  }

  const buildStamp = new Date().toUTCString();
  const body = [
    XML_PROLOG,
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${esc(SITE_TITLE)}</title>`,
    `    <link>${esc(BASE_URL)}</link>`,
    `    <description>${esc(SITE_DESCRIPTION)}</description>`,
    "    <language>en-bd</language>",
    `    <lastBuildDate>${buildStamp}</lastBuildDate>`,
    `    <atom:link href="${esc(`${BASE_URL}/rss.xml`)}" rel="self" type="application/rss+xml" />`,
    itemsXml,
    "  </channel>",
    "</rss>",
  ]
    .filter((line) => line !== "")
    .join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

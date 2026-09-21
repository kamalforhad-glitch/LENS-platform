"use server";

import { db } from "@/lib/db";
import type { SearchResult, AutocompleteResult, RelatedContent, AdminResearchArticle } from "@/lib/admin-types";

export interface LibraryFilters {
  search?: string;
  category?: string;
  year?: string;
  topic?: string;
  author?: string;
  sort?: "newest" | "oldest" | "popular" | "title" | "relevance";
  from?: string;
  to?: string;
}

export async function searchLibrary(filters: LibraryFilters = {}) {
  const useFullText = !!filters.search && filters.search.trim().length > 2;

  // Build where clause for Prisma filtering
  const where: Record<string, unknown> = { status: "published" };

  if (filters.category && filters.category !== "all") {
    where.category = filters.category;
  }
  if (filters.year && filters.year !== "all") {
    where.datePublished = {
      gte: new Date(`${filters.year}-01-01`),
      lt: new Date(`${parseInt(filters.year) + 1}-01-01`),
    };
  }
  if (filters.topic && filters.topic !== "all") {
    where.tags = { contains: filters.topic, mode: "insensitive" };
  }
  if (filters.author && filters.author !== "all") {
    where.author = { contains: filters.author, mode: "insensitive" };
  }
  if (filters.from) {
    where.datePublished = { ...(where.datePublished as object), gte: new Date(filters.from) };
  }
  if (filters.to) {
    where.datePublished = { ...(where.datePublished as object), lte: new Date(filters.to) };
  }

  // Use raw SQL for full text search with ranking when search term is provided
  let articles: { id: string; slug: string; title: string; description: string; content: string; category: string; author: string; tags: string; downloads: number; datePublished: Date | null; image: string | null; pdfUrl: string | null }[] = [];

  if (useFullText) {
    const searchTerm = filters.search!.trim();
    // PostgreSQL full text search with ranking
    const tsQuery = searchTerm
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => `${w}:*`)
      .join(" & ");

    const categoryFilter = filters.category && filters.category !== "all"
      ? `AND r.category = '${filters.category}'`
      : "";
    const yearFilter = filters.year && filters.year !== "all"
      ? `AND EXTRACT(YEAR FROM r.date_published) = ${parseInt(filters.year)}`
      : "";
    const topicFilter = filters.topic && filters.topic !== "all"
      ? `AND r.tags ILIKE '%${filters.topic}%'`
      : "";
    const authorFilter = filters.author && filters.author !== "all"
      ? `AND r.author ILIKE '%${filters.author}%'`
      : "";
    const dateFromFilter = filters.from
      ? `AND r.date_published >= '${filters.from}'`
      : "";
    const dateToFilter = filters.to
      ? `AND r.date_published <= '${filters.to}'`
      : "";

    let orderBy = "ts_rank(to_tsvector('english', r.title || ' ' || r.description || ' ' || r.content || ' ' || r.tags), to_tsquery('english', $1)) DESC";
    if (filters.sort === "popular") orderBy = "r.downloads DESC";
    else if (filters.sort === "newest") orderBy = "r.date_published DESC NULLS LAST";
    else if (filters.sort === "oldest") orderBy = "r.date_published ASC NULLS LAST";
    else if (filters.sort === "title") orderBy = "r.title ASC";

    const result = await db.$queryRawUnsafe<AdminResearchArticle[]>(
      `SELECT r.*,
        ts_rank(to_tsvector('english', r.title || ' ' || r.description || ' ' || r.content || ' ' || r.tags), to_tsquery('english', $1)) as rank,
        ts_headline('english', r.description, to_tsquery('english', $1), 'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=20') as headline
       FROM research_articles r
       WHERE r.status = 'published'
         AND to_tsvector('english', r.title || ' ' || r.description || ' ' || r.content || ' ' || r.tags) @@ to_tsquery('english', $1)
         ${categoryFilter} ${yearFilter} ${topicFilter} ${authorFilter} ${dateFromFilter} ${dateToFilter}
       ORDER BY ${orderBy}
       LIMIT 50`,
      tsQuery
    );

    // Track search query
    await db.searchQuery.create({
      data: { query: filters.search!, results: result.length },
    });

    articles = result;
  } else {
    let orderBy: Record<string, string> = { datePublished: "desc" };
    if (filters.sort === "oldest") orderBy = { datePublished: "asc" };
    else if (filters.sort === "popular") orderBy = { downloads: "desc" };
    else if (filters.sort === "title") orderBy = { title: "asc" };

    const items = await db.researchArticle.findMany({
      where,
      orderBy,
      take: 50,
    });

    articles = items;
  }

  // Get filter options
  const [categories, yearsResult, authorsResult, allTags] = await Promise.all([
    db.researchArticle.findMany({
      where: { status: "published" },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    }),
    db.researchArticle.findMany({
      where: { status: "published", datePublished: { not: null } },
      select: { datePublished: true },
    }),
    db.researchArticle.findMany({
      where: { status: "published" },
      select: { author: true },
      distinct: ["author"],
      orderBy: { author: "asc" },
    }),
    db.researchArticle.findMany({
      where: { status: "published" },
      select: { tags: true },
    }),
  ]);

  const yearSet = new Set<string>();
  yearsResult.forEach((r) => {
    if (r.datePublished) yearSet.add(r.datePublished.getFullYear().toString());
  });

  const tagSet = new Set<string>();
  allTags.forEach((row) => {
    try {
      const parsed = JSON.parse(row.tags);
      if (Array.isArray(parsed)) parsed.forEach((t: string) => tagSet.add(t));
    } catch {}
  });

  return {
    articles,
    filters: {
      categories: categories.map((c) => c.category),
      years: Array.from(yearSet).sort().reverse(),
      topics: Array.from(tagSet).sort(),
      authors: authorsResult.map((a) => a.author).filter(Boolean),
    },
    total: articles.length,
  };
}

export async function getAutocomplete(query: string): Promise<AutocompleteResult[]> {
  if (!query || query.trim().length < 2) return [];

  const term = query.trim();

  const [articles, categories, tags] = await Promise.all([
    db.researchArticle.findMany({
      where: {
        status: "published",
        OR: [
          { title: { contains: term } },
          { author: { contains: term } },
        ],
      },
      select: { title: true, slug: true, author: true },
      take: 5,
    }),
    db.researchArticle.findMany({
      where: { status: "published" },
      select: { category: true },
      distinct: ["category"],
      take: 3,
    }),
    db.researchArticle.findMany({
      where: { status: "published", tags: { contains: term } },
      select: { tags: true },
      take: 3,
    }),
  ]);

  const results: AutocompleteResult[] = [];

  articles.forEach((a) => {
    results.push({ type: "article", text: a.title, slug: a.slug });
  });

  categories
    .filter((c) => c.category.toLowerCase().includes(term.toLowerCase()))
    .forEach((c) => {
      results.push({ type: "category", text: c.category });
    });

  const topicSet = new Set<string>();
  tags.forEach((row) => {
    try {
      const parsed = JSON.parse(row.tags);
      if (Array.isArray(parsed)) {
        parsed
          .filter((t: string) => t.toLowerCase().includes(term.toLowerCase()))
          .forEach((t: string) => topicSet.add(t));
      }
    } catch {}
  });
  Array.from(topicSet)
    .slice(0, 3)
    .forEach((t) => {
      results.push({ type: "topic", text: t });
    });

  return results.slice(0, 10);
}

export async function getRelatedContent(articleId: string): Promise<RelatedContent[]> {
  const article = await db.researchArticle.findUnique({ where: { id: articleId } });
  if (!article) return [];

  const tags = JSON.parse(article.tags || "[]");
  const firstTag = tags[0] || "";

  const candidates = await db.researchArticle.findMany({
    where: {
      status: "published",
      id: { not: articleId },
      OR: [
        { category: article.category },
        { tags: { contains: firstTag } },
        { author: article.author },
      ],
    },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      category: true,
      author: true,
      datePublished: true,
      tags: true,
      downloads: true,
    },
    take: 20,
  });

  // Score by relevance
  const scored = candidates.map((c) => {
    let score = 0;
    if (c.category === article.category) score += 3;
    if (c.author === article.author) score += 2;
    try {
      const cTags = JSON.parse(c.tags || "[]");
      const overlap = cTags.filter((t: string) => tags.includes(t)).length;
      score += overlap;
    } catch {}
    score += Math.min(c.downloads / 100, 2);
    return { ...c, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, 5).map(({ id, slug, title, description, category, datePublished, score }) => ({
    id, slug, title, description, category, datePublished, score,
  }));
}

export async function getLibraryArticle(idOrSlug: string) {
  const article = await db.researchArticle.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      status: "published",
    },
    include: {
      citationRecords: true,
      authorProfileLinks: {
        include: { authorProfile: true },
        orderBy: { authorOrder: "asc" },
      },
    },
  });

  if (!article) return null;

  // Get related articles
  const related = await getRelatedContent(article.id);

  // Parse tags and citations
  let tags: string[] = [];
  try { tags = JSON.parse(article.tags); } catch {}

  return {
    article,
    related: related as RelatedContent[],
    tags,
    citations: article.citationRecords,
    authors: article.authorProfileLinks,
  };
}

export async function getLibraryStats() {
  const [totalResult, totalDownloadsResult, categories, totalAuthors] = await Promise.all([
    db.researchArticle.count({ where: { status: "published" } }),
    db.researchArticle.aggregate({ _sum: { downloads: true } }),
    db.researchArticle.groupBy({
      by: ["category"],
      where: { status: "published" },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
    db.authorProfile.count(),
  ]);

  return {
    total: totalResult,
    totalDownloads: totalDownloadsResult._sum.downloads || 0,
    categories: categories.map((c) => ({ category: c.category, count: c._count.id })),
    totalAuthors,
  };
}

export async function logSearchClick(queryId: string, articleId: string) {
  await db.searchQuery.update({
    where: { id: queryId },
    data: { clickedId: articleId },
  }).catch(() => {});
}

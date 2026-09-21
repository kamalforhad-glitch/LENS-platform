import { db } from "@/lib/db";

export interface AnalyticsOverview {
  totalArticles: number;
  publishedArticles: number;
  totalDownloads: number;
  totalCitations: number;
  totalAuthors: number;
  totalSearches: number;
  avgDownloadsPerArticle: number;
  avgCitationsPerArticle: number;
}

export interface MonthlyActivity {
  month: string;
  articles: number;
  downloads: number;
  views: number;
}

export interface CategoryTrend {
  category: string;
  count: number;
  downloads: number;
  trend: "up" | "down" | "stable";
}

export interface AuthorImpact {
  name: string;
  articleCount: number;
  totalDownloads: number;
  avgDownloads: number;
  affiliation: string | null;
}

export interface TopArticle {
  id: string;
  slug: string;
  title: string;
  downloads: number;
  citationCount: number;
  category: string;
  datePublished: string | null;
}

export interface SearchTrend {
  query: string;
  count: number;
  avgResults: number;
}

export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  const [
    totalArticles,
    publishedArticles,
    downloadsAgg,
    totalAuthors,
    totalSearches,
    citationsAgg,
  ] = await Promise.all([
    db.researchArticle.count(),
    db.researchArticle.count({ where: { status: "published" } }),
    db.researchArticle.aggregate({ _sum: { downloads: true } }),
    db.authorProfile.count(),
    db.searchQuery.count(),
    db.citationRecord.aggregate({ _count: { id: true } }),
  ]);

  const totalDownloads = downloadsAgg._sum.downloads || 0;
  const totalCitations = citationsAgg._count.id || 0;

  return {
    totalArticles,
    publishedArticles,
    totalDownloads,
    totalCitations,
    totalAuthors,
    totalSearches,
    avgDownloadsPerArticle: publishedArticles > 0 ? Math.round(totalDownloads / publishedArticles) : 0,
    avgCitationsPerArticle: publishedArticles > 0 ? Math.round((totalCitations / publishedArticles) * 10) / 10 : 0,
  };
}

export async function getMonthlyActivity(months: number = 12): Promise<MonthlyActivity[]> {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1);

  const [articles, downloads, searches] = await Promise.all([
    db.researchArticle.findMany({
      where: { dateCreated: { gte: startDate } },
      select: { dateCreated: true },
    }),
    db.downloadLog.findMany({
      where: { dateCreated: { gte: startDate } },
      select: { dateCreated: true },
    }),
    db.searchQuery.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true },
    }),
  ]);

  const monthlyData: Record<string, MonthlyActivity> = {};

  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - months + i + 1, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyData[key] = { month: key, articles: 0, downloads: 0, views: 0 };
  }

  articles.forEach((a) => {
    const key = `${a.dateCreated.getFullYear()}-${String(a.dateCreated.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyData[key]) monthlyData[key].articles++;
  });

  downloads.forEach((d) => {
    const key = `${d.dateCreated.getFullYear()}-${String(d.dateCreated.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyData[key]) monthlyData[key].downloads++;
  });

  searches.forEach((s) => {
    const key = `${s.createdAt.getFullYear()}-${String(s.createdAt.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyData[key]) monthlyData[key].views++;
  });

  return Object.values(monthlyData);
}

export async function getCategoryTrends(): Promise<CategoryTrend[]> {
  const categories = await db.researchArticle.groupBy({
    by: ["category"],
    where: { status: "published" },
    _count: { id: true },
    _sum: { downloads: true },
    orderBy: { _count: { id: "desc" } },
  });

  // Calculate trends by comparing recent vs older articles per category
  const now = new Date();
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

  const results: CategoryTrend[] = [];

  for (const cat of categories) {
    const [recentCount, olderCount] = await Promise.all([
      db.researchArticle.count({
        where: { category: cat.category, status: "published", dateCreated: { gte: threeMonthsAgo } },
      }),
      db.researchArticle.count({
        where: { category: cat.category, status: "published", dateCreated: { lt: threeMonthsAgo } },
      }),
    ]);

    let trend: "up" | "down" | "stable" = "stable";
    if (recentCount > olderCount * 0.5) trend = "up";
    else if (recentCount < olderCount * 0.2) trend = "down";

    results.push({
      category: cat.category,
      count: cat._count.id,
      downloads: cat._sum.downloads || 0,
      trend,
    });
  }

  return results;
}

export async function getAuthorImpact(limit: number = 10): Promise<AuthorImpact[]> {
  const authors = await db.authorProfile.findMany({
    orderBy: { articleCount: "desc" },
    take: limit,
  });

  const results: AuthorImpact[] = [];

  for (const author of authors) {
    const articles = await db.researchArticle.findMany({
      where: {
        authorProfileLinks: { some: { authorProfileId: author.id } },
        status: "published",
      },
      select: { downloads: true },
    });

    const totalDownloads = articles.reduce((sum, a) => sum + a.downloads, 0);

    results.push({
      name: author.name,
      articleCount: author.articleCount,
      totalDownloads,
      avgDownloads: articles.length > 0 ? Math.round(totalDownloads / articles.length) : 0,
      affiliation: author.affiliation,
    });
  }

  return results.sort((a, b) => b.totalDownloads - a.totalDownloads);
}

export async function getTopArticles(limit: number = 10): Promise<TopArticle[]> {
  const articles = await db.researchArticle.findMany({
    where: { status: "published" },
    orderBy: { downloads: "desc" },
    take: limit,
    select: {
      id: true,
      slug: true,
      title: true,
      downloads: true,
      category: true,
      datePublished: true,
    },
  });

  const results: TopArticle[] = [];

  for (const article of articles) {
    const citationCount = await db.citationRecord.count({
      where: { articleId: article.id },
    });

    results.push({
      id: article.id,
      slug: article.slug,
      title: article.title,
      downloads: article.downloads,
      citationCount,
      category: article.category,
      datePublished: article.datePublished?.toISOString() || null,
    });
  }

  return results;
}

export async function getSearchTrends(limit: number = 10): Promise<SearchTrend[]> {
  const trends = await db.searchQuery.groupBy({
    by: ["query"],
    _count: { id: true },
    _avg: { results: true },
    orderBy: { _count: { id: "desc" } },
    take: limit,
  });

  return trends.map((t) => ({
    query: t.query,
    count: t._count.id,
    avgResults: Math.round(t._avg.results || 0),
  }));
}

export async function getDownloadTimeline(articleId: string, months: number = 12) {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1);

  const downloads = await db.downloadLog.findMany({
    where: { contentId: articleId, contentType: "research", dateCreated: { gte: startDate } },
    select: { dateCreated: true },
  });

  const monthlyData: Record<string, { month: string; count: number }> = {};

  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - months + i + 1, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyData[key] = { month: key, count: 0 };
  }

  downloads.forEach((dl) => {
    const key = `${dl.dateCreated.getFullYear()}-${String(dl.dateCreated.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyData[key]) monthlyData[key].count++;
  });

  return Object.values(monthlyData);
}

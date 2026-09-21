const CROSSREF_API_BASE = "https://api.crossref.org";

export interface CrossRefWork {
  title: string;
  type: string;
  authors: { given: string; family: string; name?: string }[];
  journal: string | null;
  year: number | null;
  volume: string | null;
  issue: string | null;
  pages: string | null;
  doi: string;
  url: string | null;
  publisher: string | null;
  isbn: string | null;
  issn: string | null;
  abstract: string | null;
  subject: string[];
  publishedDate: string | null;
  referencedByCount: number;
  license: { type: string; url: string | null }[];
  language: string | null;
}

export interface CrossRefSearchResult {
  numFound: number;
  results: CrossRefWork[];
}

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/json",
    "User-Agent": "LENS-Website/1.0 (mailto:research@lens.org.bd)",
  };
  const email = process.env.CROSSREF_POLITE_EMAIL;
  if (email) {
    headers["User-Agent"] = `LENS-Website/1.0 (mailto:${email})`;
  }
  return headers;
}

function parseCrossRefWork(item: Record<string, unknown>): CrossRefWork {
  const title = (item.title as string[])?.[0] || "";
  const type = (item.type as string) || "";
  const authors = ((item.author as Record<string, string>[]) || []).map((a) => ({
    given: a.given || "",
    family: a.family || "",
    name: a.name,
  }));
  const journal = ((item["container-title"] as string[]) || [])[0] || null;
  const pubDate = item["published-print"] || item["published-online"] || item.created;
  const dateParts = (pubDate as { "date-parts"?: number[][] })?.["date-parts"]?.[0] || [];
  const year = dateParts[0] || null;
  const volume = (item.volume as string) || null;
  const issue = (item.issue as string) || null;
  const pages = (item.page as string) || null;
  const doi = (item.DOI as string) || "";
  const url = (item.URL as string) || null;
  const publisher = (item.publisher as string) || null;
  const isbn = ((item.ISBN as string[]) || [])[0] || null;
  const issn = ((item.ISSN as string[]) || [])[0] || null;
  const abstract = (item.abstract as string)?.replace(/<[^>]*>/g, "") || null;
  const subject = (item.subject as string[]) || [];
  const referencedByCount = (item["is-referenced-by-count"] as number) || 0;
  const license = ((item.license as Record<string, string>[]) || []).map((l) => ({
    type: (l["URL"] as string)?.includes("creativecommons") ? "open-access" : "restricted",
    url: l.URL || null,
  }));
  const language = (item.language as string) || null;

  const publishedDate = dateParts.length >= 2
    ? `${dateParts[0]}-${String(dateParts[1]).padStart(2, "0")}-${dateParts[2] ? String(dateParts[2]).padStart(2, "0") : "01"}`
    : null;

  return {
    title, type, authors, journal, year, volume, issue, pages, doi, url,
    publisher, isbn, issn, abstract, subject, publishedDate,
    referencedByCount, license, language,
  };
}

export async function fetchDoiMetadata(doi: string): Promise<CrossRefWork | null> {
  const cleanDoi = doi.replace(/^https?:\/\/doi\.org\//, "").trim();
  if (!cleanDoi) return null;

  try {
    const res = await fetch(`${CROSSREF_API_BASE}/works/${encodeURIComponent(cleanDoi)}`, {
      headers: getHeaders(),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return parseCrossRefWork(data.message || {});
  } catch (error) {
    console.error("[CrossRef DOI Error]", error);
    return null;
  }
}

export async function searchCrossRef(query: string, rows: number = 10): Promise<CrossRefSearchResult> {
  if (!query || query.trim().length < 2) {
    return { numFound: 0, results: [] };
  }

  try {
    const res = await fetch(
      `${CROSSREF_API_BASE}/works?query=${encodeURIComponent(query)}&rows=${rows}&select=DOI,title,author,container-title,volume,issue,page,published-print,published-online,type,URL,publisher,ISBN,ISSN,abstract,subject,is-referenced-by-count,license,language,created`,
      { headers: getHeaders() }
    );

    if (!res.ok) return { numFound: 0, results: [] };
    const data = await res.json();

    const results = (data.message?.items || []).map(parseCrossRefWork);

    return {
      numFound: data.message?.["total-results"] || 0,
      results,
    };
  } catch (error) {
    console.error("[CrossRef Search Error]", error);
    return { numFound: 0, results: [] };
  }
}

export async function getDoiCitationCount(doi: string): Promise<number> {
  const meta = await fetchDoiMetadata(doi);
  return meta?.referencedByCount || 0;
}

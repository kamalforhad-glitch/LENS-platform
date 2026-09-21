import { db } from "@/lib/db";

export interface CitationData {
  authors: string[];
  title: string;
  journal: string | null;
  year: number | null;
  volume: string | null;
  issue: string | null;
  pages: string | null;
  doi: string | null;
  url: string | null;
  publisher: string | null;
  isbn: string | null;
  type: string;
}

function escapeBibtex(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/[{}]/g, "")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%");
}

function generateCitationKey(citation: CitationData): string {
  const firstAuthor = citation.authors[0]?.split(" ").pop()?.toLowerCase() || "unknown";
  const year = citation.year || "nd";
  const titleWord = citation.title.split(" ")[0]?.toLowerCase().replace(/[^a-z]/g, "") || "untitled";
  return `${firstAuthor}${year}${titleWord}`;
}

// ============================================================
// BibTeX Export
// ============================================================

export function toBibtex(citation: CitationData): string {
  const typeMap: Record<string, string> = {
    journal: "article",
    book: "book",
    conference: "inproceedings",
    report: "techreport",
    web: "misc",
    other: "misc",
  };

  const bibType = typeMap[citation.type] || "misc";
  const key = generateCitationKey(citation);
  const authors = citation.authors.join(" and ");

  const fields: string[] = [];
  fields.push(`  title = {${escapeBibtex(citation.title)}}`);
  fields.push(`  author = {${escapeBibtex(authors)}}`);
  if (citation.journal) fields.push(`  journal = {${escapeBibtex(citation.journal)}}`);
  if (citation.year) fields.push(`  year = {${citation.year}}`);
  if (citation.volume) fields.push(`  volume = {${citation.volume}}`);
  if (citation.issue) fields.push(`  number = {${citation.issue}}`);
  if (citation.pages) fields.push(`  pages = {${citation.pages}}`);
  if (citation.doi) fields.push(`  doi = {${citation.doi}}`);
  if (citation.url) fields.push(`  url = {${citation.url}}`);
  if (citation.publisher) fields.push(`  publisher = {${escapeBibtex(citation.publisher)}}`);
  if (citation.isbn) fields.push(`  isbn = {${citation.isbn}}`);

  return `@${bibType}{${key},\n${fields.join(",\n")}\n}`;
}

// ============================================================
// RIS Export
// ============================================================

export function toRis(citation: CitationData): string {
  const typeMap: Record<string, string> = {
    journal: "JOUR",
    book: "BOOK",
    conference: "CONF",
    report: "RPRT",
    web: "ELEC",
    other: "GEN",
  };

  const risType = typeMap[citation.type] || "GEN";
  const lines: string[] = [];

  lines.push(`TY  - ${risType}`);
  citation.authors.forEach((a) => lines.push(`AU  - ${a}`));
  lines.push(`TI  - ${citation.title}`);
  if (citation.journal) lines.push(`JO  - ${citation.journal}`);
  if (citation.year) lines.push(`PY  - ${citation.year}`);
  if (citation.volume) lines.push(`VL  - ${citation.volume}`);
  if (citation.issue) lines.push(`IS  - ${citation.issue}`);
  if (citation.pages) {
    const [start, end] = citation.pages.split("-").map((p) => p.trim());
    if (start) lines.push(`SP  - ${start}`);
    if (end) lines.push(`EP  - ${end}`);
  }
  if (citation.doi) lines.push(`DO  - ${citation.doi}`);
  if (citation.url) lines.push(`UR  - ${citation.url}`);
  if (citation.publisher) lines.push(`PB  - ${citation.publisher}`);
  if (citation.isbn) lines.push(`SN  - ${citation.isbn}`);
  lines.push(`ER  - `);

  return lines.join("\n");
}

// ============================================================
// APA Citation (7th Edition)
// ============================================================

export function toApa(citation: CitationData): string {
  const parts: string[] = [];

  // Authors
  if (citation.authors.length === 0) {
    parts.push("Anonymous");
  } else if (citation.authors.length === 1) {
    parts.push(citation.authors[0]);
  } else if (citation.authors.length === 2) {
    parts.push(`${citation.authors[0]} & ${citation.authors[1]}`);
  } else if (citation.authors.length <= 20) {
    parts.push(citation.authors.slice(0, -1).join(", ") + ", & " + citation.authors[citation.authors.length - 1]);
  } else {
    parts.push(citation.authors.slice(0, 19).join(", ") + ", ... " + citation.authors[citation.authors.length - 1]);
  }

  // Year
  parts.push(`(${citation.year || "n.d."}).`);

  // Title
  parts.push(`${citation.title}.`);

  // Journal
  if (citation.journal) {
    let journalPart = `*${citation.journal}*`;
    if (citation.volume) journalPart += `, *${citation.volume}*`;
    if (citation.issue) journalPart += `(${citation.issue})`;
    if (citation.pages) journalPart += `, ${citation.pages}`;
    parts.push(journalPart + ".");
  }

  // DOI
  if (citation.doi) {
    parts.push(`https://doi.org/${citation.doi}`);
  } else if (citation.url) {
    parts.push(citation.url);
  }

  return parts.join(" ");
}

// ============================================================
// Chicago Citation
// ============================================================

export function toChicago(citation: CitationData): string {
  const parts: string[] = [];

  if (citation.authors.length > 0) {
    parts.push(citation.authors.join(", ") + ".");
  }

  parts.push(`"${citation.title}."`);

  if (citation.journal) {
    let journalPart = `*${citation.journal}*`;
    if (citation.volume) journalPart += ` ${citation.volume}`;
    if (citation.issue) journalPart += `, no. ${citation.issue}`;
    parts.push(journalPart + ".");
  }

  if (citation.year) {
    parts.push(`(${citation.year}).`);
  }

  if (citation.pages) {
    parts.push(`${citation.pages}.`);
  }

  if (citation.doi) {
    parts.push(`https://doi.org/${citation.doi}.`);
  }

  return parts.join(" ");
}

// ============================================================
// Vancouver Citation
// ============================================================

export function toVancouver(citation: CitationData): string {
  const parts: string[] = [];

  const authors = citation.authors.length > 6
    ? [...citation.authors.slice(0, 3), "et al."]
    : citation.authors;
  parts.push(authors.join(", ") + ".");

  parts.push(citation.title + ".");

  if (citation.journal) {
    let journalPart = citation.journal;
    if (citation.year) journalPart += `. ${citation.year}`;
    if (citation.volume) journalPart += `;${citation.volume}`;
    if (citation.issue) journalPart += `(${citation.issue})`;
    if (citation.pages) journalPart += `:${citation.pages}`;
    parts.push(journalPart + ".");
  }

  if (citation.doi) {
    parts.push(`doi:${citation.doi}.`);
  }

  return parts.join(" ");
}

// ============================================================
// Build citation from database records
// ============================================================

export async function getArticleCitations(articleId: string) {
  const article = await db.researchArticle.findUnique({ where: { id: articleId } });
  if (!article) return null;

  const citationRecords = await db.citationRecord.findMany({
    where: { articleId },
    orderBy: { createdAt: "desc" },
  });

  // Build the article's own citation
  const articleAuthors = article.author.split(",").map((a) => a.trim());

  const selfCitation: CitationData = {
    authors: articleAuthors,
    title: article.title,
    journal: null,
    year: article.datePublished?.getFullYear() || new Date().getFullYear(),
    volume: null,
    issue: null,
    pages: null,
    doi: article.doi,
    url: article.pdfUrl || `${process.env.NEXT_PUBLIC_SITE_URL || "https://lens.org.bd"}/library/${article.slug}`,
    publisher: "LENS Bangladesh",
    isbn: null,
    type: article.category.toLowerCase().includes("report") ? "report" : "journal",
  };

  const references: CitationData[] = citationRecords.map((c) => ({
    authors: c.authors ? c.authors.split(",").map((a) => a.trim()).filter(Boolean) : [],
    title: c.title,
    journal: c.journal,
    year: c.year,
    volume: c.volume,
    issue: c.issue,
    pages: c.pages,
    doi: c.doi,
    url: c.url,
    publisher: null,
    isbn: c.isbn,
    type: c.type,
  }));

  return { selfCitation, references };
}

export type ExportFormat = "bibtex" | "ris" | "apa" | "chicago" | "vancouver";

export function exportCitation(citation: CitationData, format: ExportFormat): string {
  switch (format) {
    case "bibtex": return toBibtex(citation);
    case "ris": return toRis(citation);
    case "apa": return toApa(citation);
    case "chicago": return toChicago(citation);
    case "vancouver": return toVancouver(citation);
    default: return toApa(citation);
  }
}

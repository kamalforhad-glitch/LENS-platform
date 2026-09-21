import { NextRequest, NextResponse } from "next/server";
import { getArticleCitations, exportCitation, type ExportFormat } from "@/lib/academic/citations";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) {
  const { id } = await params as { id: string };
  const { searchParams } = new URL(request.url);
  const format = (searchParams.get("format") || "bibtex") as ExportFormat;
  const refId = searchParams.get("ref"); // Optional: specific reference ID

  if (!["bibtex", "ris", "apa", "chicago", "vancouver"].includes(format)) {
    return NextResponse.json({ error: "Invalid format. Use: bibtex, ris, apa, chicago, vancouver" }, { status: 400 });
  }

  const citations = await getArticleCitations(id);
  if (!citations) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  // Export specific reference if ref ID provided
  if (refId) {
    const ref = citations.references.find((r) => r.doi === refId || r.title === refId);
    if (!ref) {
      return NextResponse.json({ error: "Reference not found" }, { status: 404 });
    }
    const exported = exportCitation(ref, format);
    return new NextResponse(exported, {
      headers: {
        "Content-Type": getContentType(format),
        "Content-Disposition": `attachment; filename="citation.${getExtension(format)}"`,
      },
    });
  }

  // Export all references as a collection
  const allCitations = [citations.selfCitation, ...citations.references];
  const exported = allCitations.map((c) => exportCitation(c, format)).join("\n\n");

  return new NextResponse(exported, {
    headers: {
      "Content-Type": getContentType(format),
      "Content-Disposition": `attachment; filename="citations.${getExtension(format)}"`,
    },
  });
}

function getContentType(format: ExportFormat): string {
  switch (format) {
    case "bibtex": return "application/x-bibtex";
    case "ris": return "application/x-research-info-systems";
    default: return "text/plain";
  }
}

function getExtension(format: ExportFormat): string {
  switch (format) {
    case "bibtex": return "bib";
    case "ris": return "ris";
    default: return "txt";
  }
}

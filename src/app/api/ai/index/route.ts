import { NextRequest, NextResponse } from "next/server";
import { indexAllDocuments, indexDocument } from "@/lib/ai";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/ai";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (!checkRateLimit(`ai-index:${ip}`, 5, 60000)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { action, documentType, documentId } = body;

    if (action === "index_all") {
      const result = await indexAllDocuments();
      return NextResponse.json(result);
    }

    if (action === "index_one" && documentType && documentId) {
      let doc;
      if (documentType === "research_article") {
        doc = await db.researchArticle.findUnique({ where: { id: documentId } });
        if (!doc) return NextResponse.json({ error: "Article not found" }, { status: 404 });
        const result = await indexDocument({
          type: "research_article",
          id: doc.id,
          title: doc.title,
          content: doc.abstract ? `${doc.abstract}\n\n${doc.content}` : doc.content,
          author: doc.author,
          category: doc.category,
          date: doc.datePublished?.toISOString() || "",
          slug: doc.slug,
          doi: doc.doi || undefined,
          tags: doc.tags,
        });
        return NextResponse.json(result);
      }
      if (documentType === "publication") {
        doc = await db.publication.findUnique({ where: { id: documentId } });
        if (!doc) return NextResponse.json({ error: "Publication not found" }, { status: 404 });
        const result = await indexDocument({
          type: "publication",
          id: doc.id,
          title: doc.title,
          content: doc.description,
          author: doc.author,
          category: doc.type,
          date: doc.datePublished?.toISOString() || "",
          slug: doc.slug,
          tags: doc.tags,
        });
        return NextResponse.json(result);
      }
      return NextResponse.json({ error: "Invalid document type" }, { status: 400 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[AI Index Error]", error);
    return NextResponse.json({ error: "Indexing failed" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const totalEmbeddings = await db.documentEmbedding.count();
    const indexedCount = await db.documentEmbedding.count({ where: { indexed: true } });
    const documentTypes = await db.documentEmbedding.groupBy({
      by: ["documentType"],
      _count: { id: true },
      where: { indexed: true },
    });

    return NextResponse.json({
      totalEmbeddings,
      indexedCount,
      documentTypes: documentTypes.map((d: { documentType: string; _count: { id: number } }) => ({
        type: d.documentType,
        count: d._count.id,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch index status" }, { status: 500 });
  }
}

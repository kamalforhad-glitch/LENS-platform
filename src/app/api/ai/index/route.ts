import { NextRequest, NextResponse } from "next/server";
import { indexAllDocuments, indexDocument } from "@/lib/ai";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/ai";
import { getCurrentUser, requireAuth, requireEditor } from "@/lib/auth";

function authErrorResponse(error: unknown) {
  const msg = error instanceof Error ? error.message : "Unauthorized";
  if (msg === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (!checkRateLimit(`ai-index:${ip}`, 5, 60000)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  // Re-indexing triggers paid OpenAI embedding calls — editors and above only.
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    requireEditor(user);
  } catch (error) {
    return authErrorResponse(error);
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
  // Embedding counts are internal operational data.
  try {
    requireAuth(await getCurrentUser(), "viewer");
  } catch (error) {
    return authErrorResponse(error);
  }

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
    } catch {
      return NextResponse.json({ error: "Failed to fetch index status" }, { status: 500 });
  }
}

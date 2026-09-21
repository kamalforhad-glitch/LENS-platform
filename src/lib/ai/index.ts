import OpenAI from "openai";
import { db } from "@/lib/db";

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "",
    });
  }
  return openai;
}

const EMBEDDING_MODEL = "text-embedding-3-small";
const CHAT_MODEL = "gpt-4o-mini";
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;
const MAX_TOKENS = 2000;

// ============================================================
// Text Chunking
// ============================================================

export function chunkText(text: string, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
  if (!text || text.length === 0) return [];
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += chunkSize - overlap;
  }
  return chunks.filter((c) => c.trim().length > 50);
}

// ============================================================
// Embedding Generation
// ============================================================

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (!process.env.OPENAI_API_KEY) {
    return texts.map(() => new Array(1536).fill(0));
  }
  try {
    const response = await getOpenAI().embeddings.create({
      model: EMBEDDING_MODEL,
      input: texts,
    });
    return response.data.map((d) => d.embedding);
  } catch (error) {
    console.error("[Embedding Error]", error);
    return texts.map(() => new Array(1536).fill(0));
  }
}

export async function generateSingleEmbedding(text: string): Promise<number[]> {
  const results = await generateEmbeddings([text]);
  return results[0] || [];
}

// ============================================================
// Document Processing Pipeline
// ============================================================

interface DocumentToIndex {
  type: string;
  id: string;
  title: string;
  content: string;
  author: string;
  category: string;
  date: string;
  slug: string;
  doi?: string;
  tags?: string;
}

export async function extractDocumentContent(doc: DocumentToIndex): Promise<string> {
  const parts = [
    `Title: ${doc.title}`,
    `Author: ${doc.author}`,
    `Category: ${doc.category}`,
    `Date: ${doc.date}`,
    doc.doi ? `DOI: ${doc.doi}` : "",
    doc.tags ? `Tags: ${doc.tags}` : "",
    "",
    doc.content,
  ].filter(Boolean);
  return parts.join("\n");
}

export async function indexDocument(doc: DocumentToIndex): Promise<{ indexed: number; errors: string[] }> {
  const errors: string[] = [];
  let indexed = 0;

  try {
    const fullText = await extractDocumentContent(doc);
    const chunks = chunkText(fullText);

    if (chunks.length === 0) {
      errors.push(`No content to index for ${doc.type}:${doc.id}`);
      return { indexed: 0, errors };
    }

    const embeddings = await generateEmbeddings(chunks);

    for (let i = 0; i < chunks.length; i++) {
      const metadata = JSON.stringify({
        title: doc.title,
        author: doc.author,
        category: doc.category,
        date: doc.date,
        slug: doc.slug,
        doi: doc.doi,
        tags: doc.tags,
        type: doc.type,
      });

      try {
        // Use raw SQL for pgvector compatibility
        const embeddingStr = `[${embeddings[i].join(",")}]`;
        await db.$executeRaw`
          INSERT INTO "document_embeddings" ("id", "document_type", "document_id", "chunk_index", "chunk_text", "embedding", "metadata", "token_count", "indexed", "created_at", "updated_at")
          VALUES (${`${doc.type}-${doc.id}-chunk-${i}`}, ${doc.type}, ${doc.id}, ${i}, ${chunks[i]}, ${embeddingStr}::vector, ${metadata}, ${Math.ceil(chunks[i].length / 4)}, true, NOW(), NOW())
          ON CONFLICT ("id") DO UPDATE SET
            "chunk_text" = ${chunks[i]},
            "embedding" = ${embeddingStr}::vector,
            "metadata" = ${metadata},
            "token_count" = ${Math.ceil(chunks[i].length / 4)},
            "indexed" = true,
            "updated_at" = NOW()
        `;
        indexed++;
      } catch (e) {
        errors.push(`Failed to store chunk ${i} for ${doc.type}:${doc.id}: ${e}`);
      }
    }
  } catch (error) {
    errors.push(`Error processing ${doc.type}:${doc.id}: ${error}`);
  }

  return { indexed, errors };
}

// ============================================================
// Similarity Search
// ============================================================

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export interface SearchResult {
  id: string;
  documentType: string;
  documentId: string;
  chunkText: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

export async function searchEmbeddings(query: string, topK: number = 5): Promise<SearchResult[]> {
  const queryEmbedding = await generateSingleEmbedding(query);
  const embeddingStr = `[${queryEmbedding.join(",")}]`;

  try {
    // Use pgvector cosine distance operator for efficient similarity search
    const results = await db.$queryRaw<Array<{
      id: string;
      document_type: string;
      document_id: string;
      chunk_text: string;
      metadata: string;
      similarity: number;
    }>>`
      SELECT
        "id",
        "document_type",
        "document_id",
        "chunk_text",
        "metadata",
        1 - (${embeddingStr}::vector <=> "embedding") AS "similarity"
      FROM "document_embeddings"
      WHERE "indexed" = true
      ORDER BY "embedding" <=> ${embeddingStr}::vector
      LIMIT ${topK}
    `;

    return results.map((r) => {
      let metadata: Record<string, unknown> = {};
      try {
        metadata = JSON.parse(r.metadata);
      } catch {}
      return {
        id: r.id,
        documentType: r.document_type,
        documentId: r.document_id,
        chunkText: r.chunk_text,
        metadata,
        similarity: Number(r.similarity),
      };
    });
  } catch (error) {
    console.error("[pgvector Search Error]", error);
    // Fallback to in-memory search if pgvector fails
    return fallbackSearch(queryEmbedding, topK);
  }
}

async function fallbackSearch(queryEmbedding: number[], topK: number): Promise<SearchResult[]> {
  const allEmbeddings = await db.documentEmbedding.findMany({
    where: { indexed: true },
    select: {
      id: true,
      documentType: true,
      documentId: true,
      chunkText: true,
      embedding: true,
      metadata: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const scored = allEmbeddings
    .map((e) => {
      let embedding: number[];
      try {
        embedding = JSON.parse(e.embedding);
      } catch {
        embedding = [];
      }
      const similarity = cosineSimilarity(queryEmbedding, embedding);
      let metadata: Record<string, unknown> = {};
      try {
        metadata = JSON.parse(e.metadata);
      } catch {}
      return {
        id: e.id,
        documentType: e.documentType,
        documentId: e.documentId,
        chunkText: e.chunkText,
        metadata,
        similarity,
      };
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);

  return scored;
}

// ============================================================
// AI Response Generation
// ============================================================

export interface AIResponse {
  answer: string;
  sources: {
    title: string;
    author: string;
    category: string;
    date: string;
    slug: string;
    type: string;
    relevance: number;
  }[];
  tokenCount: number;
}

const SYSTEM_PROMPT = `You are the LENS Bangladesh AI Research Assistant. You help users understand and explore research on media studies, digital rights, journalism ethics, and democratic discourse in Bangladesh.

Rules:
1. Always base your answers on the provided context documents.
2. If the context doesn't contain enough information, say so clearly.
3. Cite sources when referencing specific findings.
4. Be concise and academic in tone.
5. If asked to summarize, provide key findings and conclusions.
6. Never make up information not present in the context.
7. When comparing documents, highlight similarities and differences.
8. Always mention the publication title and author when citing.

Format your response with clear sections if the answer is complex. Use markdown formatting for readability.`;

export async function generateAIResponse(
  query: string,
  conversationHistory: { role: string; content: string }[] = []
): Promise<AIResponse> {
  const searchResults = await searchEmbeddings(query, 8);

  if (searchResults.length === 0) {
    return {
      answer: "I don't have enough information in the LENS research database to answer this question. Try rephrasing your query or browse our research library for available publications.",
      sources: [],
      tokenCount: 0,
    };
  }

  const context = searchResults
    .map((r, i) => `[Source ${i + 1}: ${r.metadata.title || "Unknown"} by ${r.metadata.author || "Unknown"} (${r.metadata.category || ""}, ${r.metadata.date || ""})]\n${r.chunkText}`)
    .join("\n\n---\n\n");

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...conversationHistory.slice(-6).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    {
      role: "user",
      content: `Based on the following LENS research documents, answer the question.\n\nContext documents:\n${context}\n\nQuestion: ${query}`,
    },
  ];

  try {
    if (!process.env.OPENAI_API_KEY) {
      const fallbackAnswer = searchResults
        .map((r) => `**${r.metadata.title}** (${r.metadata.author}, ${r.metadata.date})\n${r.chunkText.slice(0, 200)}...`)
        .join("\n\n");

      return {
        answer: `Based on the LENS research database, here are the most relevant findings:\n\n${fallbackAnswer}\n\n*Note: Full AI responses require an OpenAI API key. Configure OPENAI_API_KEY for enhanced AI-powered answers.*`,
        sources: searchResults.map((r) => ({
          title: (r.metadata.title as string) || "Unknown",
          author: (r.metadata.author as string) || "Unknown",
          category: (r.metadata.category as string) || "",
          date: (r.metadata.date as string) || "",
          slug: (r.metadata.slug as string) || "",
          type: (r.metadata.type as string) || r.documentType,
          relevance: Math.round(r.similarity * 100),
        })),
        tokenCount: 0,
      };
    }

    const completion = await getOpenAI().chat.completions.create({
      model: CHAT_MODEL,
      messages,
      max_tokens: MAX_TOKENS,
      temperature: 0.3,
    });

    const answer = completion.choices[0]?.message?.content || "I couldn't generate a response. Please try again.";
    const tokenCount = completion.usage?.total_tokens || 0;

    const uniqueSources = new Map<string, typeof searchResults[0]>();
    for (const r of searchResults) {
      const key = r.documentId;
      if (!uniqueSources.has(key) || r.similarity > uniqueSources.get(key)!.similarity) {
        uniqueSources.set(key, r);
      }
    }

    return {
      answer,
      sources: Array.from(uniqueSources.values()).map((r) => ({
        title: (r.metadata.title as string) || "Unknown",
        author: (r.metadata.author as string) || "Unknown",
        category: (r.metadata.category as string) || "",
        date: (r.metadata.date as string) || "",
        slug: (r.metadata.slug as string) || "",
        type: (r.metadata.type as string) || r.documentType,
        relevance: Math.round(r.similarity * 100),
      })),
      tokenCount,
    };
  } catch (error) {
    console.error("[AI Response Error]", error);
    const fallbackAnswer = searchResults
      .slice(0, 3)
      .map((r) => `**${r.metadata.title}** - ${r.chunkText.slice(0, 150)}...`)
      .join("\n\n");
    return {
      answer: `Here are the most relevant results from the LENS database:\n\n${fallbackAnswer}`,
      sources: searchResults.map((r) => ({
        title: (r.metadata.title as string) || "Unknown",
        author: (r.metadata.author as string) || "Unknown",
        category: (r.metadata.category as string) || "",
        date: (r.metadata.date as string) || "",
        slug: (r.metadata.slug as string) || "",
        type: (r.metadata.type as string) || r.documentType,
        relevance: Math.round(r.similarity * 100),
      })),
      tokenCount: 0,
    };
  }
}

// ============================================================
// Indexing Pipeline
// ============================================================

export async function indexAllDocuments(): Promise<{ total: number; indexed: number; errors: string[] }> {
  const allErrors: string[] = [];
  let totalIndexed = 0;
  let totalDocs = 0;

  const articles = await db.researchArticle.findMany({
    where: { status: "published" },
    select: {
      id: true, title: true, content: true, author: true, category: true,
      datePublished: true, slug: true, doi: true, tags: true, abstract: true,
    },
  });

  for (const article of articles) {
    totalDocs++;
    const result = await indexDocument({
      type: "research_article",
      id: article.id,
      title: article.title,
      content: article.abstract ? `${article.abstract}\n\n${article.content}` : article.content,
      author: article.author,
      category: article.category,
      date: article.datePublished?.toISOString() || "",
      slug: article.slug,
      doi: article.doi || undefined,
      tags: article.tags,
    });
    totalIndexed += result.indexed;
    allErrors.push(...result.errors);
  }

  const publications = await db.publication.findMany({
    where: { status: "published" },
    select: {
      id: true, title: true, description: true, author: true, type: true,
      datePublished: true, slug: true, tags: true,
    },
  });

  for (const pub of publications) {
    totalDocs++;
    const result = await indexDocument({
      type: "publication",
      id: pub.id,
      title: pub.title,
      content: pub.description,
      author: pub.author,
      category: pub.type,
      date: pub.datePublished?.toISOString() || "",
      slug: pub.slug,
      tags: pub.tags,
    });
    totalIndexed += result.indexed;
    allErrors.push(...result.errors);
  }

  return { total: totalDocs, indexed: totalIndexed, errors: allErrors };
}

// ============================================================
// Rate Limiting
// ============================================================

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(identifier: string, maxRequests: number = 30, windowMs: number = 60000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}

// ============================================================
// Prompt Injection Protection
// ============================================================

const INJECTION_PATTERNS = [
  /ignore\s+(previous|all|above)\s+(instructions?|prompts?|rules?)/i,
  /you\s+are\s+now\s+(a|an|the)/i,
  /system\s*:\s*/i,
  /act\s+as\s+if/i,
  /pretend\s+you\s+are/i,
  /disregard\s+(previous|all)/i,
  /override\s+(instructions?|system)/i,
];

export function detectPromptInjection(text: string): boolean {
  return INJECTION_PATTERNS.some((pattern) => pattern.test(text));
}

export function sanitizeInput(text: string): string {
  return text.replace(/[<>]/g, "").slice(0, 5000).trim();
}

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- AlterTable: Change embedding from text to vector(1536)
ALTER TABLE "document_embeddings" DROP COLUMN "embedding";
ALTER TABLE "document_embeddings" ADD COLUMN "embedding" vector(1536);

-- CreateIndex: HNSW index for fast cosine similarity search
CREATE INDEX "document_embeddings_embedding_idx" ON "document_embeddings" USING hnsw (embedding vector_cosine_ops);

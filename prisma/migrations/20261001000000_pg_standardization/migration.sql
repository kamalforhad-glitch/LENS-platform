-- Phase 1: PostgreSQL standardization + pgvector + DownloadLog fix
-- Idempotent: safe to run on fresh or existing Postgres databases.
-- DOES NOT delete data. Only adds columns/indexes/extensions and drops the
-- incorrect download_logs.content_id -> media_files.id foreign key.

-- Required extensions for AI vector search + trigram fallback
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ------------------------------------------------------------
-- DownloadLog: polymorphic contentId must NOT be a FK to media_files.
-- Keep content_type/content_id as plain indexed fields, add optional
-- media_file_id for real media-file downloads.
-- ------------------------------------------------------------
DO $$ BEGIN
  ALTER TABLE "download_logs" DROP CONSTRAINT IF EXISTS "download_logs_content_id_fkey";
EXCEPTION WHEN undefined_table THEN null;
END $$;

ALTER TABLE "download_logs" ADD COLUMN IF NOT EXISTS "media_file_id" TEXT;

DO $$ BEGIN
  ALTER TABLE "download_logs" ADD CONSTRAINT "download_logs_media_file_id_fkey"
    FOREIGN KEY ("media_file_id") REFERENCES "media_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "download_logs_media_file_id_idx" ON "download_logs"("media_file_id");

-- ------------------------------------------------------------
-- Full-text search support for research_articles (used by library.ts)
-- GIN index accelerates to_tsvector queries; HNSW accelerates vector search.
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "research_articles_search_gin_idx"
  ON "research_articles"
  USING gin (to_tsvector('english', "title" || ' ' || "description" || ' ' || "content" || ' ' || "tags"));

CREATE INDEX IF NOT EXISTS "research_articles_tags_trgm_idx"
  ON "research_articles" USING gin ("tags" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "research_articles_author_trgm_idx"
  ON "research_articles" USING gin ("author" gin_trgm_ops);

-- pgvector HNSW index (created here if add_pgvector migration was skipped/ordered differently).
-- IF NOT EXISTS is deterministic: a duplicate index name raises duplicate_object
-- (42710), not duplicate_table, so the previous EXCEPTION WHEN duplicate_table
-- handler could never fire. Skips silently when add_pgvector already created it.
CREATE INDEX IF NOT EXISTS "document_embeddings_embedding_idx"
  ON "document_embeddings" USING hnsw ("embedding" vector_cosine_ops);

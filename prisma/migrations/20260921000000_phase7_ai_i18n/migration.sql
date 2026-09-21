-- Phase 7: AI Research Intelligence + i18n + Researcher Network

-- AI Conversations
CREATE TABLE IF NOT EXISTS "ai_conversations" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "title" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ai_conversations_session_id_idx" ON "ai_conversations"("session_id");
CREATE INDEX IF NOT EXISTS "ai_conversations_created_at_idx" ON "ai_conversations"("created_at");

-- AI Messages
CREATE TABLE IF NOT EXISTS "ai_messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sources" TEXT NOT NULL DEFAULT '[]',
    "token_count" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ai_messages_conversation_id_idx" ON "ai_messages"("conversation_id");
CREATE INDEX IF NOT EXISTS "ai_messages_created_at_idx" ON "ai_messages"("created_at");

-- Document Embeddings
CREATE TABLE IF NOT EXISTS "document_embeddings" (
    "id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "chunk_index" INTEGER NOT NULL DEFAULT 0,
    "chunk_text" TEXT NOT NULL,
    "embedding" TEXT NOT NULL,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "token_count" INTEGER NOT NULL DEFAULT 0,
    "indexed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "document_embeddings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "document_embeddings_document_type_document_id_idx" ON "document_embeddings"("document_type", "document_id");
CREATE INDEX IF NOT EXISTS "document_embeddings_indexed_idx" ON "document_embeddings"("indexed");
CREATE INDEX IF NOT EXISTS "document_embeddings_created_at_idx" ON "document_embeddings"("created_at");

-- Researcher Profiles
CREATE TABLE IF NOT EXISTS "researcher_profiles" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "affiliation" TEXT NOT NULL DEFAULT '',
    "position" TEXT NOT NULL DEFAULT '',
    "bio" TEXT NOT NULL DEFAULT '',
    "image" TEXT,
    "orcid" TEXT,
    "website" TEXT,
    "social" TEXT NOT NULL DEFAULT '{}',
    "research_areas" TEXT NOT NULL DEFAULT '[]',
    "expertise" TEXT NOT NULL DEFAULT '[]',
    "education" TEXT NOT NULL DEFAULT '[]',
    "languages" TEXT NOT NULL DEFAULT '[]',
    "total_downloads" INTEGER NOT NULL DEFAULT 0,
    "total_citations" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "researcher_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "researcher_profiles_slug_key" ON "researcher_profiles"("slug");
CREATE INDEX IF NOT EXISTS "researcher_profiles_slug_idx" ON "researcher_profiles"("slug");
CREATE INDEX IF NOT EXISTS "researcher_profiles_name_idx" ON "researcher_profiles"("name");
CREATE INDEX IF NOT EXISTS "researcher_profiles_featured_idx" ON "researcher_profiles"("featured");
CREATE INDEX IF NOT EXISTS "researcher_profiles_status_idx" ON "researcher_profiles"("status");

-- Impact Metrics
CREATE TABLE IF NOT EXISTS "impact_metrics" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "impact_metrics_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "impact_metrics_category_metric_idx" ON "impact_metrics"("category", "metric");
CREATE INDEX IF NOT EXISTS "impact_metrics_date_idx" ON "impact_metrics"("date");
CREATE INDEX IF NOT EXISTS "impact_metrics_created_at_idx" ON "impact_metrics"("created_at");

-- Translations
CREATE TABLE IF NOT EXISTS "translations" (
    "id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "namespace" TEXT NOT NULL DEFAULT 'common',
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "translations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "translations_locale_namespace_key_key" ON "translations"("locale", "namespace", "key");
CREATE INDEX IF NOT EXISTS "translations_locale_namespace_idx" ON "translations"("locale", "namespace");
CREATE INDEX IF NOT EXISTS "translations_key_idx" ON "translations"("key");

-- Add foreign key for ai_messages
DO $$ BEGIN
    ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_conversation_id_fkey"
        FOREIGN KEY ("conversation_id") REFERENCES "ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

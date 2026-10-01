-- Phase 20B corrective migration: CMS tables + research workflow gap + drift cleanup.
-- Additive and non-destructive: only CREATE TABLE / ADD COLUMN / ADD CONSTRAINT /
-- CREATE INDEX, plus one DROP INDEX IF EXISTS for an index the Prisma schema
-- does not declare (see note below). No data is deleted or altered.
-- Every definition below is derived from prisma/schema.prisma (field order,
-- column names via @map, nullability, defaults, @@unique/@@index, relations).

-- ============================================================
-- CMS Page Builder: pages + page_sections
-- ============================================================

-- CreateTable
CREATE TABLE "pages" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "title_bn" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "description_bn" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "scheduled_at" TIMESTAMP(3),
    "published_at" TIMESTAMP(3),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "template" TEXT NOT NULL DEFAULT 'default',
    "meta_title" TEXT,
    "meta_title_bn" TEXT,
    "meta_description" TEXT,
    "meta_description_bn" TEXT,
    "og_image" TEXT,
    "keywords" TEXT NOT NULL DEFAULT '[]',
    "canonical_url" TEXT,
    "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_modified" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_sections" (
    "id" TEXT NOT NULL,
    "page_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "title_bn" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "description_bn" TEXT NOT NULL DEFAULT '',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "settings" TEXT NOT NULL DEFAULT '{}',
    "content" TEXT NOT NULL DEFAULT '{}',
    "content_bn" TEXT NOT NULL DEFAULT '{}',
    "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_modified" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_sections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pages_slug_key" ON "pages"("slug");
CREATE INDEX "pages_status_idx" ON "pages"("status");
CREATE INDEX "pages_slug_idx" ON "pages"("slug");

CREATE INDEX "page_sections_page_id_idx" ON "page_sections"("page_id");
CREATE INDEX "page_sections_sort_order_idx" ON "page_sections"("sort_order");
CREATE INDEX "page_sections_type_idx" ON "page_sections"("type");

-- AddForeignKey
ALTER TABLE "page_sections" ADD CONSTRAINT "page_sections_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- CMS settings & menus: site_settings + menu_items
-- ============================================================

-- CreateTable
CREATE TABLE "site_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL DEFAULT '',
    "value_bn" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL DEFAULT 'text',
    "group" TEXT NOT NULL DEFAULT 'general',
    "label" TEXT NOT NULL DEFAULT '',
    "label_bn" TEXT NOT NULL DEFAULT '',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "label_bn" TEXT NOT NULL DEFAULT '',
    "url" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "target" TEXT NOT NULL DEFAULT '_self',
    "parent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "site_settings_key_key" ON "site_settings"("key");
CREATE INDEX "site_settings_key_idx" ON "site_settings"("key");
CREATE INDEX "site_settings_group_idx" ON "site_settings"("group");

CREATE INDEX "menu_items_location_idx" ON "menu_items"("location");
CREATE INDEX "menu_items_sort_order_idx" ON "menu_items"("sort_order");

-- ============================================================
-- Content types: programs
-- ============================================================

-- CreateTable
CREATE TABLE "programs" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "title_bn" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL,
    "description_bn" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL DEFAULT '',
    "content_bn" TEXT NOT NULL DEFAULT '',
    "image" TEXT,
    "category" TEXT NOT NULL DEFAULT 'Training',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "meta_title" TEXT,
    "meta_description" TEXT,
    "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_modified" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "programs_slug_key" ON "programs"("slug");
CREATE INDEX "programs_status_idx" ON "programs"("status");
CREATE INDEX "programs_slug_idx" ON "programs"("slug");
CREATE INDEX "programs_category_idx" ON "programs"("category");

-- ============================================================
-- Content types: blog_posts
-- ============================================================

-- CreateTable
CREATE TABLE "blog_posts" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "title_bn" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL,
    "description_bn" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL DEFAULT '',
    "content_bn" TEXT NOT NULL DEFAULT '',
    "image" TEXT,
    "author" TEXT NOT NULL DEFAULT 'LENS Team',
    "category" TEXT NOT NULL DEFAULT 'Analysis',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "meta_title" TEXT,
    "meta_description" TEXT,
    "date_published" TIMESTAMP(3),
    "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_modified" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_slug_key" ON "blog_posts"("slug");
CREATE INDEX "blog_posts_status_idx" ON "blog_posts"("status");
CREATE INDEX "blog_posts_slug_idx" ON "blog_posts"("slug");
CREATE INDEX "blog_posts_category_idx" ON "blog_posts"("category");
CREATE INDEX "blog_posts_date_published_idx" ON "blog_posts"("date_published");

-- ============================================================
-- Content types: media_items
-- ============================================================

-- CreateTable
CREATE TABLE "media_items" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "title_bn" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL,
    "description_bn" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL DEFAULT '',
    "content_bn" TEXT NOT NULL DEFAULT '',
    "image" TEXT,
    "type" TEXT NOT NULL DEFAULT 'press_release',
    "source" TEXT NOT NULL DEFAULT '',
    "source_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "meta_title" TEXT,
    "meta_description" TEXT,
    "date_published" TIMESTAMP(3),
    "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_modified" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "media_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "media_items_slug_key" ON "media_items"("slug");
CREATE INDEX "media_items_status_idx" ON "media_items"("status");
CREATE INDEX "media_items_slug_idx" ON "media_items"("slug");
CREATE INDEX "media_items_type_idx" ON "media_items"("type");
CREATE INDEX "media_items_date_published_idx" ON "media_items"("date_published");

-- ============================================================
-- Content types: resources
-- ============================================================

-- CreateTable
CREATE TABLE "resources" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "title_bn" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL,
    "description_bn" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL DEFAULT '',
    "content_bn" TEXT NOT NULL DEFAULT '',
    "image" TEXT,
    "file_url" TEXT,
    "external_url" TEXT,
    "category" TEXT NOT NULL DEFAULT 'Document',
    "type" TEXT NOT NULL DEFAULT 'document',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "meta_title" TEXT,
    "meta_description" TEXT,
    "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_modified" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "resources_slug_key" ON "resources"("slug");
CREATE INDEX "resources_status_idx" ON "resources"("status");
CREATE INDEX "resources_slug_idx" ON "resources"("slug");
CREATE INDEX "resources_type_idx" ON "resources"("type");
CREATE INDEX "resources_category_idx" ON "resources"("category");

-- ============================================================
-- Content types: careers
-- ============================================================

-- CreateTable
CREATE TABLE "careers" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "title_bn" TEXT NOT NULL DEFAULT '',
    "department" TEXT NOT NULL DEFAULT 'General',
    "location" TEXT NOT NULL DEFAULT 'Dhaka, Bangladesh',
    "type" TEXT NOT NULL DEFAULT 'full_time',
    "description" TEXT NOT NULL,
    "description_bn" TEXT NOT NULL DEFAULT '',
    "requirements" TEXT NOT NULL DEFAULT '',
    "requirements_bn" TEXT NOT NULL DEFAULT '',
    "salary" TEXT,
    "application_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "meta_title" TEXT,
    "meta_description" TEXT,
    "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_modified" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "careers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "careers_slug_key" ON "careers"("slug");
CREATE INDEX "careers_status_idx" ON "careers"("status");
CREATE INDEX "careers_slug_idx" ON "careers"("slug");
CREATE INDEX "careers_department_idx" ON "careers"("department");

-- ============================================================
-- Research workflow gap: author_articles.researcher_profile_id
-- Matches AuthorArticle.researcherProfileId String? (nullable, no default)
-- and its relation onDelete: SetNull + @@index([researcherProfileId]).
-- ============================================================

-- AlterTable
ALTER TABLE "author_articles" ADD COLUMN "researcher_profile_id" TEXT;

-- CreateIndex
CREATE INDEX "author_articles_researcher_profile_id_idx" ON "author_articles"("researcher_profile_id");

-- AddForeignKey
ALTER TABLE "author_articles" ADD CONSTRAINT "author_articles_researcher_profile_id_fkey" FOREIGN KEY ("researcher_profile_id") REFERENCES "researcher_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- Drift cleanup: backup_records_storage_idx
-- 20261002000000_backup_r2_fields created this index, but the Prisma schema
-- declares no @@index([storage]) and no application query filters or orders
-- by BackupRecord.storage (all reads are by id/createdAt/status). The index
-- serves no query pattern, so it is removed to keep the Prisma schema as the
-- source of truth. IF EXISTS keeps this safe on databases where the index
-- was never created. No data is affected.
-- ============================================================

DROP INDEX IF EXISTS "backup_records_storage_idx";

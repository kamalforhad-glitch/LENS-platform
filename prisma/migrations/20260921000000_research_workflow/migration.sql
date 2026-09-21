-- AlterTable: Add academic workflow fields to research_articles
ALTER TABLE "research_articles" ADD COLUMN "abstract" TEXT NOT NULL DEFAULT '';
ALTER TABLE "research_articles" ADD COLUMN "methodology" TEXT NOT NULL DEFAULT '';
ALTER TABLE "research_articles" ADD COLUMN "doi" TEXT;
ALTER TABLE "research_articles" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "research_articles" ADD COLUMN "submitter_name" TEXT;
ALTER TABLE "research_articles" ADD COLUMN "submitter_email" TEXT;
ALTER TABLE "research_articles" ADD COLUMN "submitter_affiliation" TEXT;
ALTER TABLE "research_articles" ADD COLUMN "review_status" TEXT NOT NULL DEFAULT 'none';
ALTER TABLE "research_articles" ADD COLUMN "submitted_at" TIMESTAMP(3);
ALTER TABLE "research_articles" ADD COLUMN "reviewed_at" TIMESTAMP(3);
ALTER TABLE "research_articles" ADD COLUMN "approved_at" TIMESTAMP(3);
ALTER TABLE "research_articles" ADD COLUMN "published_version" INTEGER;

-- CreateIndex
CREATE INDEX "research_articles_doi_idx" ON "research_articles"("doi");
CREATE INDEX "research_articles_review_status_idx" ON "research_articles"("review_status");

-- CreateTable: AuthorProfile
CREATE TABLE "author_profiles" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "affiliation" TEXT NOT NULL DEFAULT '',
    "orcid" TEXT,
    "bio" TEXT NOT NULL DEFAULT '',
    "expertise" TEXT NOT NULL DEFAULT '[]',
    "image" TEXT,
    "website" TEXT,
    "social" TEXT NOT NULL DEFAULT '{}',
    "article_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "author_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AuthorArticle
CREATE TABLE "author_articles" (
    "id" TEXT NOT NULL,
    "author_profile_id" TEXT NOT NULL,
    "article_id" TEXT NOT NULL,
    "author_order" INTEGER NOT NULL DEFAULT 1,
    "is_corresponding" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "author_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ResearchVersion
CREATE TABLE "research_versions" (
    "id" TEXT NOT NULL,
    "article_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "changelog" TEXT NOT NULL DEFAULT '',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "research_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ReviewAssignment
CREATE TABLE "review_assignments" (
    "id" TEXT NOT NULL,
    "article_id" TEXT NOT NULL,
    "reviewer_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "deadline" TIMESTAMP(3),
    "notes" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ReviewComment
CREATE TABLE "review_comments" (
    "id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "section" TEXT NOT NULL DEFAULT 'general',
    "line_ref" TEXT,
    "comment" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'suggestion',
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CitationRecord
CREATE TABLE "citation_records" (
    "id" TEXT NOT NULL,
    "article_id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'journal',
    "authors" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL,
    "journal" TEXT,
    "year" INTEGER,
    "volume" TEXT,
    "issue" TEXT,
    "pages" TEXT,
    "doi" TEXT,
    "url" TEXT,
    "isbn" TEXT,
    "citation_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "citation_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable: SearchQuery
CREATE TABLE "search_queries" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "user_id" TEXT,
    "results" INTEGER NOT NULL DEFAULT 0,
    "clicked_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_queries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "author_profiles_slug_key" ON "author_profiles"("slug");
CREATE INDEX "author_profiles_slug_idx" ON "author_profiles"("slug");
CREATE INDEX "author_profiles_name_idx" ON "author_profiles"("name");

CREATE UNIQUE INDEX "author_articles_author_profile_id_article_id_key" ON "author_articles"("author_profile_id", "article_id");
CREATE INDEX "author_articles_article_id_idx" ON "author_articles"("article_id");

CREATE INDEX "research_versions_article_id_idx" ON "research_versions"("article_id");
CREATE UNIQUE INDEX "research_versions_article_id_version_key" ON "research_versions"("article_id", "version");

CREATE INDEX "review_assignments_article_id_idx" ON "review_assignments"("article_id");
CREATE INDEX "review_assignments_reviewer_id_idx" ON "review_assignments"("reviewer_id");
CREATE INDEX "review_assignments_status_idx" ON "review_assignments"("status");

CREATE INDEX "review_comments_assignment_id_idx" ON "review_comments"("assignment_id");
CREATE INDEX "review_comments_severity_idx" ON "review_comments"("severity");

CREATE INDEX "citation_records_article_id_idx" ON "citation_records"("article_id");
CREATE INDEX "citation_records_doi_idx" ON "citation_records"("doi");
CREATE INDEX "citation_records_citation_key_idx" ON "citation_records"("citation_key");

CREATE INDEX "search_queries_query_idx" ON "search_queries"("query");
CREATE INDEX "search_queries_created_at_idx" ON "search_queries"("created_at");

-- AddForeignKey
ALTER TABLE "research_versions" ADD CONSTRAINT "research_versions_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "research_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "research_versions" ADD CONSTRAINT "research_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "review_assignments" ADD CONSTRAINT "review_assignments_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "research_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "review_assignments" ADD CONSTRAINT "review_assignments_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "review_comments" ADD CONSTRAINT "review_comments_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "review_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "citation_records" ADD CONSTRAINT "citation_records_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "research_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "author_articles" ADD CONSTRAINT "author_articles_author_profile_id_fkey" FOREIGN KEY ("author_profile_id") REFERENCES "author_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "author_articles" ADD CONSTRAINT "author_articles_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "research_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

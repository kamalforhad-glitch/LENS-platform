-- Add Bangla (BN) fields to core content models
-- This migration is ADDITIVE ONLY - no destructive changes
-- Run this against production database after pgvector extension is available

-- ============================================================
-- ResearchArticle: Add BN fields for title, description, content, abstract, methodology
-- ============================================================
ALTER TABLE "research_articles"
ADD COLUMN IF NOT EXISTS "title_bn" TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS "description_bn" TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS "content_bn" TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS "abstract_bn" TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS "methodology_bn" TEXT DEFAULT '';

-- ============================================================
-- Publication: Add BN fields for title, description
-- ============================================================
ALTER TABLE "publications"
ADD COLUMN IF NOT EXISTS "title_bn" TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS "description_bn" TEXT DEFAULT '';

-- ============================================================
-- Event: Add BN fields for name, description
-- ============================================================
ALTER TABLE "events"
ADD COLUMN IF NOT EXISTS "name_bn" TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS "description_bn" TEXT DEFAULT '';

-- ============================================================
-- TeamMember: Add BN fields for name, role, bio
-- ============================================================
ALTER TABLE "team_members"
ADD COLUMN IF NOT EXISTS "name_bn" TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS "role_bn" TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS "bio_bn" TEXT DEFAULT '';

-- ============================================================
-- ResearcherProfile: Add BN fields for name, affiliation, position, bio, researchAreas, expertise, education, languages
-- ============================================================
ALTER TABLE "researcher_profiles"
ADD COLUMN IF NOT EXISTS "name_bn" TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS "affiliation_bn" TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS "position_bn" TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS "bio_bn" TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS "research_areas_bn" TEXT DEFAULT '[]',
ADD COLUMN IF NOT EXISTS "expertise_bn" TEXT DEFAULT '[]',
ADD COLUMN IF NOT EXISTS "education_bn" TEXT DEFAULT '[]',
ADD COLUMN IF NOT EXISTS "languages_bn" TEXT DEFAULT '[]';

-- ============================================================
-- AuthorProfile: Add BN fields for name, affiliation, bio, expertise
-- ============================================================
ALTER TABLE "author_profiles"
ADD COLUMN IF NOT EXISTS "name_bn" TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS "affiliation_bn" TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS "bio_bn" TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS "expertise_bn" TEXT DEFAULT '[]';

-- ============================================================
-- MediaFile: Add BN fields for title, description, alt
-- ============================================================
ALTER TABLE "media_files"
ADD COLUMN IF NOT EXISTS "title_bn" TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS "description_bn" TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS "alt_bn" TEXT DEFAULT '';

-- ============================================================
-- Indexes for new BN fields (optional, for search performance)
-- ============================================================
CREATE INDEX IF NOT EXISTS "research_articles_title_bn_idx" ON "research_articles"("title_bn");
CREATE INDEX IF NOT EXISTS "publications_title_bn_idx" ON "publications"("title_bn");
CREATE INDEX IF NOT EXISTS "events_name_bn_idx" ON "events"("name_bn");
CREATE INDEX IF NOT EXISTS "team_members_name_bn_idx" ON "team_members"("name_bn");
CREATE INDEX IF NOT EXISTS "researcher_profiles_name_bn_idx" ON "researcher_profiles"("name_bn");
CREATE INDEX IF NOT EXISTS "author_profiles_name_bn_idx" ON "author_profiles"("name_bn");
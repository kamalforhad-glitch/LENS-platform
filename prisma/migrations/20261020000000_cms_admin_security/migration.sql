-- 20261020000000_cms_admin_security
-- Additive migration for Admin Management, audit logging, media metadata,
-- page organization (parent_id), and page revision history.
-- No destructive statements. Safe to run with prisma migrate deploy.

-- ------------------------------------------------------------------
-- users: account lifecycle fields
-- ------------------------------------------------------------------
ALTER TABLE "users" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN "created_by" TEXT;
ALTER TABLE "users" ADD COLUMN "last_login_at" TIMESTAMP(3);

-- ------------------------------------------------------------------
-- media_files: editorial metadata + intrinsic dimensions
-- ------------------------------------------------------------------
ALTER TABLE "media_files" ADD COLUMN "title" TEXT NOT NULL DEFAULT '';
ALTER TABLE "media_files" ADD COLUMN "description" TEXT NOT NULL DEFAULT '';
ALTER TABLE "media_files" ADD COLUMN "width" INTEGER;
ALTER TABLE "media_files" ADD COLUMN "height" INTEGER;

-- ------------------------------------------------------------------
-- pages: parent/child organization
-- ------------------------------------------------------------------
ALTER TABLE "pages" ADD COLUMN "parent_id" TEXT;
CREATE INDEX "pages_parent_id_idx" ON "pages"("parent_id");

-- ------------------------------------------------------------------
-- page_revisions: snapshot history for the Page Manager
-- ------------------------------------------------------------------
CREATE TABLE "page_revisions" (
    "id" TEXT NOT NULL,
    "page_id" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "page_snapshot" TEXT NOT NULL DEFAULT '{}',
    "sections_snapshot" TEXT NOT NULL DEFAULT '[]',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "page_revisions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "page_revisions_page_id_created_at_idx" ON "page_revisions"("page_id", "created_at");
ALTER TABLE "page_revisions" ADD CONSTRAINT "page_revisions_page_id_fkey"
  FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ------------------------------------------------------------------
-- audit_logs: administrative activity trail
-- ------------------------------------------------------------------
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_email" TEXT,
    "actor_role" TEXT,
    "action" TEXT NOT NULL,
    "target_type" TEXT,
    "target_id" TEXT,
    "meta" TEXT NOT NULL DEFAULT '{}',
    "ip" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX "audit_logs_target_type_target_id_idx" ON "audit_logs"("target_type", "target_id");
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey"
  FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ------------------------------------------------------------------
-- password_reset_tokens: admin invitations + password resets
-- token_hash is the SHA-256 hex of the one-time token (hashed at rest).
-- ------------------------------------------------------------------
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'reset',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");
CREATE INDEX "password_reset_tokens_user_id_type_idx" ON "password_reset_tokens"("user_id", "type");
CREATE INDEX "password_reset_tokens_expires_at_idx" ON "password_reset_tokens"("expires_at");
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

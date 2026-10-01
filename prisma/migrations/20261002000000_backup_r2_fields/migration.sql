-- Phase 10: Cloudflare R2 backup artifact persistence metadata.
-- Non-destructive: only ADD COLUMNs with defaults (existing rows become storage='local').
-- R2 secrets are NEVER stored — only object key + public URL.

ALTER TABLE "backup_records" ADD COLUMN IF NOT EXISTS "storage" TEXT NOT NULL DEFAULT 'local';
ALTER TABLE "backup_records" ADD COLUMN IF NOT EXISTS "remote_key" TEXT;
ALTER TABLE "backup_records" ADD COLUMN IF NOT EXISTS "remote_url" TEXT;

CREATE INDEX IF NOT EXISTS "backup_records_storage_idx" ON "backup_records"("storage");

-- Add complete bilingual navigation fields to menu_items
-- Safe additive migration for production compatibility

ALTER TABLE "menu_items"
ADD COLUMN IF NOT EXISTS "description" TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS "description_bn" TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS "external_url" TEXT,
ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS "is_clickable" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "open_submenu" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "badge_text" TEXT,
ADD COLUMN IF NOT EXISTS "badge_text_bn" TEXT,
ADD COLUMN IF NOT EXISTS "badge_style" TEXT DEFAULT 'gold',
ADD COLUMN IF NOT EXISTS "icon" TEXT,
ADD COLUMN IF NOT EXISTS "desktop_visible" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "mobile_visible" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "roles" TEXT DEFAULT 'all';

-- Indexes for status and parent_id
CREATE INDEX IF NOT EXISTS "menu_items_status_idx" ON "menu_items"("status");
CREATE INDEX IF NOT EXISTS "menu_items_parent_id_idx" ON "menu_items"("parent_id");

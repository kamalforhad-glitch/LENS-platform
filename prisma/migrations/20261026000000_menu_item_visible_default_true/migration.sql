-- Align the PostgreSQL default with prisma/schema.prisma.
-- This changes the default for future inserts only.
-- It does not modify existing menu_items rows.

ALTER TABLE "menu_items"
ALTER COLUMN "visible" SET DEFAULT true;


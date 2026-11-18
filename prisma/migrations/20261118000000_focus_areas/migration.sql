-- Focus Areas (homepage cards + /focus/[slug] pages).
-- Derived from prisma/schema.prisma. Additive and idempotent: this migration
-- only creates the table and its indexes when they do not already exist.
-- It never drops, truncates, deletes or rewrites existing data.

CREATE TABLE IF NOT EXISTS "focus_areas" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT,
    "content" TEXT,
    "image_url" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "focus_areas_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "focus_areas_slug_key" ON "focus_areas"("slug");
CREATE INDEX IF NOT EXISTS "focus_areas_sort_order_idx" ON "focus_areas"("sort_order");

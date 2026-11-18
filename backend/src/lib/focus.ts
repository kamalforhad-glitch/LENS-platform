import type { FocusArea } from "@prisma/client";
import { getDb } from "./prisma";

export interface FocusAreaDto {
  id: number;
  slug: string;
  title: string;
  description: string;
  icon: string | null;
  content: string | null;
  imageUrl: string | null;
  order: number;
}

export type FocusAreaSource = "database" | "database-empty";

export interface FocusListResponse {
  areas: FocusAreaDto[];
  count: number;
  source?: FocusAreaSource;
}

export const FOCUS_LIST_TAG = "focus-areas" as const;

export function focusDetailTag(slug: string): string {
  return `focus-area:${slug}`;
}

export function toFocusAreaDto(row: FocusArea): FocusAreaDto {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    icon: row.icon,
    content: row.content,
    imageUrl: row.imageUrl,
    order: row.order,
  };
}

function parsePositiveId(raw: string): number | null {
  if (!raw.trim()) return null;
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : null;
}

/**
 * Mirrors the current LENS route: a positive numeric parameter is treated as
 * an ID; anything else is treated as a slug.
 */
export async function findFocusArea(raw: string): Promise<FocusAreaDto | null> {
  const id = parsePositiveId(raw);
  const db = getDb();
  const row = id
    ? await db.focusArea.findUnique({ where: { id } })
    : await db.focusArea.findUnique({ where: { slug: raw } });

  return row ? toFocusAreaDto(row) : null;
}

/**
 * Current prisma/schema.prisma FocusArea has no active/public/status field.
 * Filtering would invent a new schema, so all rows are returned and ordered
 * exactly as the frontend loader does: order ascending, then id ascending.
 */
export async function listFocusAreas(): Promise<FocusListResponse> {
  const db = getDb();
  const rows = await db.focusArea.findMany({
    orderBy: [{ order: "asc" }, { id: "asc" }],
  });

  return {
    areas: rows.map(toFocusAreaDto),
    count: rows.length,
    source: rows.length > 0 ? "database" : "database-empty",
  };
}

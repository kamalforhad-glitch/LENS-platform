import { unstable_cache } from "next/cache";
import { db, logSupabaseDbError } from "./prisma";
import { FOCUS_SEED_AREAS, FOCUS_SEED_BY_SLUG } from "./focus-seed-data";
import {
  FOCUS_LIST_TAG,
  focusDetailTag,
  type FocusAreaDto,
  type FocusAreaSource,
} from "./focus-types";

export interface FocusAreaResult {
  areas: FocusAreaDto[];
  source: FocusAreaSource;
}

interface FocusRow {
  id: number;
  slug: string;
  title: string;
  description: string;
  icon: string | null;
  content: string | null;
  imageUrl: string | null;
  order: number;
}

function toDto(row: FocusRow): FocusAreaDto {
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

function sorted(areas: FocusAreaDto[]): FocusAreaDto[] {
  return [...areas].sort((a, b) => a.order - b.order || a.id - b.id);
}

const seedAreas = sorted(FOCUS_SEED_AREAS.map(toDto));

function prismaErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
}

/**
 * Keeps a missing schema object distinct from a database failure and from a
 * legitimate empty result. The public site still renders seed copy, but logs
 * make it explicit that the data was not persisted in the database.
 */
function logFocusAreaLoadError(context: string, error: unknown): void {
  if (prismaErrorCode(error) === "P2021") {
    console.error(
      `[FocusAreas] Missing table "focus_areas" during ${context}; migration required. Using bundled seed fallback.`
    );
  } else {
    console.error(`[FocusAreas] Database query failed during ${context}; using bundled seed fallback.`);
  }
  logSupabaseDbError(context, error);
}

const cachedFocusAreas = unstable_cache(
  async (): Promise<FocusAreaResult> => {
    try {
      const rows = await db.focusArea.findMany({
        orderBy: [{ order: "asc" }, { id: "asc" }],
      });
      if (rows.length) {
        return { areas: rows.map(toDto), source: "database" };
      }

      // An empty, migrated table is a valid dataset (for example, before the
      // first CMS edit). Keep the bundled cards visible, but never report it
      // as a database-backed list.
      console.warn(
        "[FocusAreas] focus_areas query succeeded but returned 0 rows; using bundled seed fallback. This is an empty dataset, not a missing table."
      );
      return { areas: seedAreas, source: "database-empty" };
    } catch (error) {
      // The public site must render even if the table has not been migrated yet.
      logFocusAreaLoadError("getFocusAreas", error);
      return { areas: seedAreas, source: "seed-unavailable" };
    }
  },
  ["focus-areas", "v2"],
  { tags: [FOCUS_LIST_TAG], revalidate: 300 }
);

export async function getFocusAreas(): Promise<FocusAreaDto[]> {
  const result = await cachedFocusAreas();
  return result.areas;
}

export async function getFocusAreasWithSource(): Promise<FocusAreaResult> {
  return cachedFocusAreas();
}

function cachedFocusAreaBySlug(slug: string) {
  return unstable_cache(
    async (): Promise<FocusAreaDto | null> => {
      try {
        const row = await db.focusArea.findUnique({ where: { slug } });
        if (row) return toDto(row);
      } catch (error) {
        // Fall through to the bundled seed copy, but make a missing table
        // distinguishable from a true "not found" result.
        logFocusAreaLoadError(`getFocusAreaBySlug:${slug}`, error);
      }
      return FOCUS_SEED_BY_SLUG[slug] ?? null;
    },
    ["focus-area", "v1", slug],
    {
      tags: [FOCUS_LIST_TAG, focusDetailTag(slug)],
      revalidate: 300,
    }
  );
}

export async function getFocusAreaBySlug(slug: string): Promise<FocusAreaDto | null> {
  return cachedFocusAreaBySlug(slug)();
}

export async function getFocusAreaById(id: number): Promise<FocusAreaDto | null> {
  try {
    const row = await db.focusArea.findUnique({ where: { id } });
    return row ? toDto(row) : null;
  } catch (error) {
    logFocusAreaLoadError(`getFocusAreaById:${id}`, error);
    return null;
  }
}

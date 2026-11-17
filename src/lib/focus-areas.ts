import { unstable_cache } from "next/cache";
import { db } from "./db";
import { FOCUS_SEED_AREAS, FOCUS_SEED_BY_SLUG } from "./focus-seed-data";
import {
  FOCUS_LIST_TAG,
  focusDetailTag,
  type FocusAreaDto,
} from "./focus-types";

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

const cachedFocusAreas = unstable_cache(
  async (): Promise<FocusAreaDto[]> => {
    try {
      const rows = await db.focusArea.findMany({
        orderBy: [{ order: "asc" }, { id: "asc" }],
      });
      return rows.length ? rows.map(toDto) : seedAreas;
    } catch {
      // The public site must render even if the table has not been migrated yet.
      return seedAreas;
    }
  },
  ["focus-areas", "v1"],
  { tags: [FOCUS_LIST_TAG], revalidate: 300 }
);

export async function getFocusAreas(): Promise<FocusAreaDto[]> {
  return cachedFocusAreas();
}

function cachedFocusAreaBySlug(slug: string) {
  return unstable_cache(
    async (): Promise<FocusAreaDto | null> => {
      try {
        const row = await db.focusArea.findUnique({ where: { slug } });
        if (row) return toDto(row);
      } catch {
        // Fall through to the bundled seed copy.
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
  } catch {
    return null;
  }
}

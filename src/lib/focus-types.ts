// Shared, dependency-free types and cache keys for the Focus Area CMS.
// Imported by Server Components, Route Handlers and client widgets alike.

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

/**
 * Where the list was loaded from. `database-empty` means the query succeeded
 * but returned no rows; `seed-*` means resilience fallback copy was used.
 * Consumers must not interpret a seed source as proof of DB persistence.
 */
export type FocusAreaSource =
  | "database"
  | "database-empty"
  | "seed-fallback"
  | "seed-unavailable";

export interface FocusListResponse {
  areas: FocusAreaDto[];
  count: number;
  source?: FocusAreaSource;
}

export const FOCUS_LIST_KEY = "/api/focus" as const;
export const FOCUS_LIST_TAG = "focus-areas" as const;

export function focusDetailTag(slug: string): string {
  return `focus-area:${slug}`;
}

/** Mapping from logical slug to the existing i18n keys for Bangla copy. */
export const FOCUS_I18N_KEY_BY_SLUG: Readonly<Record<string, string>> = {
  "research-insights": "research_insights",
  "media-literacy-training": "media_literacy",
  "strategic-communication": "strategic_comm",
  "policy-advocacy": "policy_advocacy",
  "media-indexing": "media_indexing",
  "freedom-press": "press_freedom",
  "journalists-protection-shield": "journalist_protection",
  "cybersecurity-virtual-safety": "cybersecurity",
};

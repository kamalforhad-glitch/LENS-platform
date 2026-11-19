export interface SeoSettingLike {
  id?: string;
  key: string;
  value: string;
  valueBn: string;
  type: string;
  group: string;
  label: string;
  sortOrder?: number;
}

export const SEO_OG_IMAGE_KEY = "seo_og_image";
export const LEGACY_OG_IMAGE_KEY = "og_image";

/**
 * Normalize SEO settings for the admin SEO UI so legacy-only global OG image
 * data remains editable under the canonical key.
 *
 * - If a canonical `seo_og_image` row exists, it is used as-is.
 * - If only a legacy `og_image` row exists, expose a UI entry based on that row
 *   with its key set to `seo_og_image` (preserving value/valueBn and other
 *   fields). The legacy DB row is not modified by this UI normalization.
 * - When both exist, keep the canonical row and exclude the legacy row from UI
 *   state to avoid duplicate OG image controls.
 */
export function normalizeSeoOgImageSettings<T extends SeoSettingLike>(settings: T[]): T[] {
  const canonical = settings.find((s) => s.key === SEO_OG_IMAGE_KEY);
  const legacy = settings.find((s) => s.key === LEGACY_OG_IMAGE_KEY);

  if (canonical) {
    return settings.filter((s) => s.key !== LEGACY_OG_IMAGE_KEY);
  }

  if (!legacy) {
    return settings;
  }

  const normalizedCanonical = { ...legacy, key: SEO_OG_IMAGE_KEY } as T;
  return settings.map((s) => (s.key === LEGACY_OG_IMAGE_KEY ? normalizedCanonical : s));
}

export function resolveSeoOgImageValue(
  getVal: (key: string, bn?: boolean) => string,
  fallback = "/og?title=LENS&subtitle=Lighthouse+for+Evolving+Narrative+Systems"
): string {
  return getVal(SEO_OG_IMAGE_KEY) || getVal(LEGACY_OG_IMAGE_KEY) || fallback;
}
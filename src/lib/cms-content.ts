// ============================================================
// Locale content selection helpers.
//
// A section stores parallel EN / BN payloads (`content` +
// `contentBn`). Writers default the BN payload to "{}" whenever an
// editor supplies no Bengali translation, so an empty object has to
// be treated as "untranslated" rather than as content — otherwise
// Bangla readers get a blank body while the English text sits one
// fallback away.
//
// Parsing itself is deliberately unchanged: these helpers operate on
// already-parsed values (see `safeParse` in lib/actions/cms).
// ============================================================

/**
 * True when a localized value actually carries content.
 *
 * Unusable: `null`, `undefined`, `""`, `{}` and `[]`.
 * Usable: any non-empty object or array, plus any non-empty scalar
 * (string, number, boolean) so existing string call sites keep the
 * behaviour they had before this helper existed.
 */
export function hasUsableContent(value: unknown): boolean {
  if (value === null || value === undefined || value === "") return false;
  if (typeof value !== "object") return true;
  if (Array.isArray(value)) return value.length > 0;
  return Object.keys(value as Record<string, unknown>).length > 0;
}

/**
 * Select the locale-appropriate value: Bengali when it was requested
 * and the Bengali payload is usable, otherwise English. Unusable
 * Bengali content is never returned.
 */
export function pickLocale(bn: boolean, en: unknown, bnv: unknown): unknown {
  if (bn && hasUsableContent(bnv)) return bnv;
  return en;
}

// ============================================================
// Homepage key-compatibility helpers.
//
// The Landing Page Editor saves *editor* keys (brandLine,
// primaryCtaText/Link, sectionTitle, stats[], newsletterTitle, …)
// while the public renderers historically read *legacy* keys (brand,
// cta_research, label, stat_*_value, newsletter_title, …). The two
// families must be resolved together, in a fixed precedence order:
//
//   1. editor key   — what admins edit today; edits must appear live
//   2. legacy key   — keeps previously saved content rendering
//   3. caller fallback (i18n / hardcoded default / section row)
//
// A key holding an unusable value ("" , {}, missing) is skipped, so
// an empty editor field never masks a populated legacy key.
// ============================================================

/**
 * Return the first candidate key of `source` that holds usable
 * content, following the array order. `source` must be an already
 * parsed content payload.
 */
export function firstUsable(source: unknown, keys: readonly string[]): unknown {
  if (!source || typeof source !== "object" || Array.isArray(source)) return undefined;
  const obj = source as Record<string, unknown>;
  for (const k of keys) {
    if (hasUsableContent(obj[k])) return obj[k];
  }
  return undefined;
}

/**
 * Locale-aware candidate-key resolution over the parallel EN/BN
 * payloads: for Bengali, the first usable candidate key from the
 * Bengali payload, then the first usable candidate key from the
 * English payload (legacy renderers fall back BN → EN the same way). English reads the
 * English payload only, mirroring the previous `cEn.x` contracts.
 */
export function resolveCmsValue(
  bn: boolean,
  contentEn: unknown,
  contentBn: unknown,
  keys: readonly string[],
): unknown {
  if (bn) {
    const bnValue = firstUsable(contentBn, keys);
    if (bnValue !== undefined) return bnValue;
  }
  return firstUsable(contentEn, keys);
}

/**
 * Impact Statistics stores a single shared numeric `value` (and display
 * `suffix`) per stat across locales, while labels/titles remain
 * locale-specific. The admin editor updates the English/content stats
 * array; this helper propagates those shared fields into matching
 * Bengali/contentBn stats so both payloads persist identical numbers.
 *
 * Matching is by stat `key` when available, with index fallback. Only
 * existing matched Bengali entries are updated; unrelated fields/keys
 * and non-impact content are preserved.
 */
export function syncImpactStatsSharedValues<T extends Record<string, unknown>>(
  content: T | null | undefined,
  contentBn: T | null | undefined,
): { content: T; contentBn: T } {
  const enObj = (
    content && typeof content === "object" && !Array.isArray(content) ? { ...content } : {}
  ) as T;
  const bnObj = (
    contentBn && typeof contentBn === "object" && !Array.isArray(contentBn)
      ? { ...contentBn }
      : {}
  ) as T;

  const enStats = Array.isArray((enObj as Record<string, unknown>).stats)
    ? ([...(enObj as Record<string, unknown>).stats as unknown[]] as Array<Record<string, unknown>>)
    : null;
  const bnStatsRaw = Array.isArray((bnObj as Record<string, unknown>).stats)
    ? ([...(bnObj as Record<string, unknown>).stats as unknown[]] as Array<Record<string, unknown>>)
    : null;

  if (!enStats || !bnStatsRaw) {
    return { content: enObj, contentBn: bnObj };
  }

  const bnIndexByKey = new Map<string, number>();
  bnStatsRaw.forEach((st, idx) => {
    if (st && typeof st === "object") {
      const key = (st as Record<string, unknown>).key;
      if (typeof key === "string" && key && !bnIndexByKey.has(key)) {
        bnIndexByKey.set(key, idx);
      }
    }
  });

  const syncedBnStats = bnStatsRaw.map((st) =>
    st && typeof st === "object" ? { ...(st as Record<string, unknown>) } : st
  ) as Array<Record<string, unknown>>;

  enStats.forEach((enStat, idx) => {
    if (!enStat || typeof enStat !== "object") return;
    const en = enStat as Record<string, unknown>;
    const key = typeof en.key === "string" ? en.key : "";
    const bnIdx = key ? bnIndexByKey.get(key) ?? (idx < syncedBnStats.length ? idx : -1) : idx;
    if (bnIdx == null || bnIdx < 0 || bnIdx >= syncedBnStats.length) return;
    const bnStat = syncedBnStats[bnIdx];
    if (!bnStat || typeof bnStat !== "object") return;

    const nextBn = { ...bnStat };
    if (en.value !== undefined) nextBn.value = en.value;
    if (en.suffix !== undefined) nextBn.suffix = en.suffix;
    syncedBnStats[bnIdx] = nextBn;
  });

  (enObj as Record<string, unknown>).stats = enStats.map((st) =>
    st && typeof st === "object" ? { ...(st as Record<string, unknown>) } : st
  );
  (bnObj as Record<string, unknown>).stats = syncedBnStats;

  return { content: enObj, contentBn: bnObj };
}

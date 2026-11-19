import { sanitizeUrl } from "@/lib/cms-validation";

/** CMS keyword fields may be a JSON array or a comma/newline separated list. */
export function parseKeywords(raw: unknown): string[] | undefined {
  if (typeof raw !== "string" || !raw.trim()) return undefined;

  const value = raw.trim();
  let values: unknown = value;
  if (value.startsWith("[")) {
    try {
      values = JSON.parse(value);
    } catch {
      // Fall through to plain-text parsing.
    }
  }

  const list = Array.isArray(values) ? values : value.split(/[,\n]/);
  const keywords = list
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  return keywords.length ? Array.from(new Set(keywords)) : undefined;
}

/** Accept only safe relative paths or http(s) URLs for metadata fields. */
export function safeMetadataUrl(raw: unknown): string | undefined {
  const check = sanitizeUrl(raw);
  return check.ok && check.url ? check.url : undefined;
}

// ============================================================
// CMS validation utilities — pure functions, no DB access.
// Used by cms.ts actions, REST routes, and the public page
// renderer to guard slugs, URLs, and structured content.
// ============================================================

/**
 * Slugs that collide with real application routes. A CMS page can never
 * take one of these (static app routes always resolve first anyway — this
 * is defense in depth against confusion and future refactors).
 * `home` is reserved for the homepage record; `api`/`admin` are protected
 * app areas; `og` is the OG-image route.
 */
export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  "home",
  "admin",
  "api",
  "og",
  "about",
  "blog",
  "careers",
  "clubs",
  "contact",
  "courses",
  "donate",
  "events",
  "impact",
  "indexing",
  "library",
  "media",
  "partnerships",
  "privacy",
  "programs",
  "publications",
  "research",
  "researchers",
  "resources",
  "terms",
  "theme",
  "robots.txt",
  "sitemap.xml",
  "manifest.json",
  "rss.xml",
  "uploads",
  "images",
  "favicon.ico",
]);

export const RESERVED_SLUG_FOR_MESSAGES = "home, api, admin, about, blog, careers, clubs, contact, courses, donate, events, impact, indexing, library, media, og, partnerships, privacy, programs, publications, research, researchers, resources, terms, theme";

export interface SlugCheck {
  valid: boolean;
  error?: string;
}

/** Normalize a slug candidate: lowercase, trim, collapse separators. */
export function normalizeSlug(input: string): string {
  return (input || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9\u0980-\u09FF-]+/g, "") // keep latin digits, hyphen, bangla letters intentionally blocked: bangla not allowed in urls for CMS slugs
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Validate a CMS page slug: URL-safe, not reserved, not a bare number
 * (avoids ambiguity with potential numeric routes).
 */
export function validateSlug(slug: string): SlugCheck {
  const s = (slug || "").trim();
  if (!s) return { valid: false, error: "Slug is required" };
  if (s.length > 80) return { valid: false, error: "Slug must be 80 characters or fewer" };
  // Latin lowercase slug only (Bengali titles map differently; slugs must be URL-stable)
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) {
    return {
      valid: false,
      error: "Slug may only contain lowercase letters, digits, and single hyphens",
    };
  }
  if (RESERVED_SLUGS.has(s)) {
    return { valid: false, error: `"${s}" is a reserved route and cannot be used as a page slug (reserved: ${RESERVED_SLUG_FOR_MESSAGES.split(", ").slice(0, 6).join(", ")}…)`.replace(/"reserved:.*"$/, "") };
  }
  if (/^\d+$/.test(s)) return { valid: false, error: "Slug cannot be only digits" };
  return { valid: true };
}

// ============================================================
// URL sanitization
// ============================================================

const ALLOWED_URL_SCHEMES = new Set(["http:", "https:", "mailto:", "tel:"]);

/**
 * Validate a CMS-managed URL (nav item, CTA button, canonical, ogImage...).
 * - Same-origin relative paths are allowed ("", "/", "/path").
 * - Absolute URLs must use http(s), mailto: or tel:.
 * - "javascript:", "data:", "vbscript:", "file:" etc. are rejected.
 * - Protocol-relative "//" hosts are rejected (scheme confusion).
 * - Whitespace/control characters are rejected.
 */
export function sanitizeUrl(raw: unknown): { ok: boolean; url?: string; error?: string } {
  if (typeof raw !== "string") return { ok: false, error: "URL must be a string" };
  const value = raw.trim();
  if (!value) return { ok: true, url: "" };
  if (/[\s\u0000-\u001f]/.test(value)) {
    if (!/^mailto:[^\s]+$|^tel:[^\s]+$/.test(value)) return { ok: false, error: "URL contains whitespace or control characters" };
    return { ok: true, url: value };
  }
  if (value.startsWith("//")) return { ok: false, error: "Protocol-relative URLs are not allowed" };
  if (value.startsWith("/")) {
    // relative path — ensure no embedded scheme tricks after path segments
    if (/^[/?#]/.test(value) || value === "/") return { ok: true, url: value };
    return { ok: true, url: value };
  }
  if (value.startsWith("#")) return { ok: true, url: value };
  let parsed: URL | null = null;
  try {
    parsed = new URL(value);
  } catch {
    return { ok: false, error: "Invalid URL" };
  }
  if (!ALLOWED_URL_SCHEMES.has(parsed.protocol)) {
    return { ok: false, error: `URL scheme "${parsed.protocol.replace(":", "")}" is not allowed` };
  }
  if (parsed.protocol === "http:" || parsed.protocol === "https:") {
    if (!parsed.hostname) return { ok: false, error: "URL is missing a host" };
  }
  return { ok: true, url: value };
}

// ============================================================
// Structured content helpers
// ============================================================

/** Parse a JSON string defensively; returns fallback on any failure. */
export function parseJsonSafe<T>(raw: unknown, fallback: T): T {
  if (raw === null || raw === undefined) return fallback;
  if (typeof raw !== "string") return raw as T;
  try {
    const parsed = JSON.parse(raw);
    return (parsed ?? fallback) as T;
  } catch {
    return fallback;
  }
}

/** Serialize to a canonical JSON string, tolerating circular structures. */
export function toJson(value: unknown): string {
  try {
    return JSON.stringify(value ?? {});
  } catch {
    return "{}";
  }
}

/** Clamp a string to a max length (defensive against oversized payloads). */
export function clampText(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.length > max ? value.slice(0, max) : value;
}

/**
 * Allowed section types for the page builder renderer.
 * Mirrors PAGE_SECTION_TYPES in the admin editor + homepage types.
 */
export const SECTION_TYPES = [
  "hero",
  "heading",
  "rich_text",
  "image_text",
  "banner",
  "cards",
  "gallery",
  "stats",
  "cta",
  "featured",
  "focus_areas",
  "clubs",
  "team",
  "embed",
  // homepage-machine sections (managed by /admin/pages/home):
  "focus",
  "featured_research",
  "impact",
  "events_newsletter",
  "indexing_scanner",
] as const;

export type SectionType = (typeof SECTION_TYPES)[number];

export function isValidSectionType(type: unknown): type is SectionType {
  return typeof type === "string" && (SECTION_TYPES as readonly string[]).includes(type);
}

// ============================================================
// Section content deep validation
// Walks a parsed section content/settings object and validates any
// URL-ish string values (keys ending url/image and absolute urls).
// Returns sanitized copy or an error; renderer strips javascript:.
// ============================================================

const URL_KEY_PATTERN = /(^url$|url$|Url$|URL$|image$|Image$|ogimage$)/;
const ABSOLUTE_URL_PATTERN = /^[a-z][a-z0-9+.-]*:/i;

export interface SanitizeResult {
  ok: boolean;
  value?: unknown;
  error?: string;
}

function walk(value: unknown, keyHint: string): SanitizeResult {
  if (typeof value === "string") {
    const looksUrl = keyHint === "" ? ABSOLUTE_URL_PATTERN.test(value) : URL_KEY_PATTERN.test(keyHint);
    if (looksUrl) {
      const check = sanitizeUrl(value);
      if (!check.ok) return { ok: false, error: `${keyHint || "url"}: ${check.error}` };
      return { ok: true, value: check.url };
    }
    // Never allow scriptable markup inside any stored string.
    if (/<\s*script/i.test(value)) return { ok: false, error: "Script tags are not allowed in section content" };
    return { ok: true, value };
  }
  if (Array.isArray(value)) {
    const cleaned: unknown[] = [];
    for (const item of value) {
      const res = walk(item, "");
      if (!res.ok) return res;
      cleaned.push(res.value);
    }
    return { ok: true, value: cleaned };
  }
  if (value && typeof value === "object") {
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const res = walk(v, k);
      if (!res.ok) return res;
      cleaned[k] = res.value;
    }
    return { ok: true, value: cleaned };
  }
  return { ok: true, value };
}

/** Validate + sanitize a JSON string for section settings/content. */
export function sanitizeSectionJson(raw: string): SanitizeResult {
  const parsed = parseJsonSafe(raw, {});
  const res = walk(parsed, "");
  if (!res.ok) return res;
  return { ok: true, value: res.value };
}

export function serializeSectionJson(raw: string): { ok: boolean; value?: string; error?: string } {
  const res = sanitizeSectionJson(raw);
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, value: toJson(res.value) };
}

/** Extract safe inline-markdown tokens for rendering. Used by page renderer. */
export function extractMarkdownLinkUrl(token: string): string | null {
  const match = token.match(/\[([^\]]*)\]\(([^)]*)\)/);
  if (!match) return null;
  const check = sanitizeUrl(match[2]);
  return check.ok ? check.url || "" : null;
}

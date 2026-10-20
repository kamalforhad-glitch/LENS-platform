// Canonical public site URL resolution — shared by robots/sitemap-like
// metadata routes and other outbound URL builders. Normalizes the
// apex domain to the canonical host so search engines always see one URL.

export const CANONICAL_HOST = "www.lensbd.org";

const APEX_HOST = "lensbd.org";

export function resolveBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  if (raw) {
    try {
      const host = new URL(raw).hostname;
      if (host === APEX_HOST || host === CANONICAL_HOST) {
        return `https://${CANONICAL_HOST}`;
      }
    } catch {
      // Unusable value — fall through to canonical.
    }
  }
  return `https://${CANONICAL_HOST}`;
}

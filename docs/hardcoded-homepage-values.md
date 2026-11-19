# Homepage hardcoded-value classification

This document records why remaining literals on `/` are acceptable after the
phase-10 cleanup. "CMS-controlled" means the editor row is the source of truth
and the literal is only a safe default.

## CMS-controlled (fallback literal remains)

| Surface | CMS source | Fallback |
| --- | --- | --- |
| Newsletter subscriber count | `events_newsletter.content.subscriberCount` / `subscribers` | `2.5K+` / localized equivalent |
| Impact metrics | `impact.content.stats[]` (key, value, suffix, label, icon, color) | Four legacy stat cards; icon names are allowlisted (`FileText`, `Users`, `Globe`, `Handshake`) and colors must be `#RRGGBB` |
| Featured research card | `featured_research.content.featuredCard` (title, description, tags, date, readMinutes, slug, href, pdfUrl) | Bundled editorial copy, `May 2025`, 12 minutes |
| Indexing Scanner copy/link | Focus or `indexing_scanner` section content: `indexingKicker`, `indexingHeading`, `indexingLead`, `indexingCtaText`, `indexingCtaUrl` | i18n title/labels and `/indexing/press-freedom-index` |
| Footer logo | `site_logo_url` | `/images/logo/lens-logo.png` |
| Footer RSS | `social_rss` | `/rss.xml` |
| Footer subtitle | `site_subtitle` | `site.subtitle` i18n key |
| Global SEO keywords | `seo_keywords` (JSON array or comma-separated) | Bundled default keyword list |
| Global OG image | `seo_og_image` (legacy `og_image` read only as fallback) | `/og?...` |
| Page SEO | `pages.meta_title`, `meta_description`, `og_image`, `keywords`, `canonical_url` | Root layout metadata / current route |

## Intentionally static

- Decorative colors, blur radii, SVG radar geometry, particle counts and line dash arrays. They are visual design tokens, not editorial content.
- Legal/privacy/terms/admin footer destinations and the donate info-page CTA. These are route contracts, not CMS content.
- Canonical hostname and `metadataBase` origin. These are deployment constants.
- i18n keys used when no CMS payload exists. They are localization defaults, not CMS rows.
- Section separators and the default section order when `pages`/`page_sections` are unavailable.

## Fallback-only resilience

- Bundled focus-area seed cards when `focus_areas` is missing, empty, or unreadable. The list response now includes `source`, and logs distinguish `P2021` missing-table errors from a legitimate empty dataset.
- Default navigation/footer columns when `menu_items` is unavailable.
- Default CMS page/section payloads when the database is unavailable.
- Default homepage event and research previews when their published queries report an error.

No authenticated or personalized state is cached in the anonymous homepage path.

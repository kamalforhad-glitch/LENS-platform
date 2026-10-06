# PHASE 14 — LENS Brand SEO Audit

**Scope:** Brand search visibility audit of `https://www.lensbd.org` (LENS — Lighthouse for Evolving Narrative Systems).
**Mode:** AUDIT ONLY. No source-code changes, no deployment, no DNS changes, no sitemap/robots edits, no metadata implementation.
**Date:** 2026-10-01
**Repo HEAD at audit:** `e4d24b5 Fix crawler access for SEO routes` (working tree contained 71 uncommitted entries; none touched by this phase).
**Only file created by this phase:** `PHASE_14_LENS_BRAND_SEO_AUDIT.md`.

**Evidence base (all verified during this audit unless marked otherwise):**

- Live HTTP probes with a Googlebot UA (`Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)`) and a default `curl` UA against production.
- Full repository inspection (`src/app/**`, `src/components/**`, `next.config.ts`, `package.json`, `public/`).
- Reported-and-accepted facts from the phase brief: Googlebot `GET /` = 200, `GET /sitemap.xml` = 200 (`application/xml`), `GET /robots.txt` = 200, GSC sitemap submission = SUCCESS.
- Items requiring Google Search Console, CrUX, or server logs are listed as **manual/unverifiable** and are never asserted as fact.

---

## 1. Executive Summary

LENS is **crawlable and technically indexable** after the Phase 12 crawler fix (commit `e4d24b5`): Googlebot receives 200 responses on `/`, `/sitemap.xml`, and `/robots.txt`, and the sitemap submission in Search Console succeeded. That is the good news, and it is the ceiling of what is currently good.

The brand-facing SEO signals are substantially incomplete:

| # | Finding | Severity | Verified by |
|---|---------|----------|-------------|
| 1 | Homepage HTML has **no `<title>`, no meta description, no canonical, no `<h1>`, no `<nav>`**; visible text = 20 characters ("Skip to main content"). Root cause: `src/app/page.tsx` is `"use client"` (cannot export `metadata`) and the root layout exports no `metadata` either. | P0 | Live HTML probe + `src/app/layout.tsx`, `src/app/page.tsx` |
| 2 | **Every DB-backed detail page returns 200 with an empty `<title>` and only the loading skeleton** (67 visible chars): `/blog/<slug>`, `/careers/<slug>`, `/programs/<slug>` (and the same pattern for the other `generateMetadata` routes). | P0 | Live probes; `src/app/blog/[slug]/page.tsx:11-21` |
| 3 | Production DB queries are failing: `GET /api/researchers` → **500** `{"error":"Failed to fetch researchers"}`; `/api/search/*` and `/api/analytics/*` swallow errors into empty payloads. | P0 | Live probes; `src/app/api/researchers/route.ts:14-16` |
| 4 | Sitemap publishes **4 URLs that return 404** (`/research/<slug>`) — no such route exists in the app — and omits 4 live section pages plus every detail page. | P0 | Live sitemap (18 `<loc>`) + route inventory |
| 5 | **No canonical URL, no `metadataBase`, no `hreflang`, no `alternates` anywhere in `src`** while the domain splits across apex (`lensbd.org`, 308 → `www`). Sitemap, robots and `og:image` are emitted on the apex host; the site is served on `www`. | P0 | Grep (0 matches) + live redirects |
| 6 | Detail pages are **fully orphaned**: no internal `href` to `/blog/…`, `/careers/…`, `/media/…`, `/programs/…`, `/resources/…` exists anywhere in the codebase, and they are absent from the sitemap. | P1 | Regex sweep of `src/app/**/*.tsx` |
| 7 | Structured data: only `Organization` (on `/about`) and `Event` (on `/events`) are emitted. `WebSite`, `Breadcrumb`, `Article`, `FAQ` components exist but are used **zero** times; `Organization.logo` points at `/logo.png` → **404**. | P1 | `src/components/SchemaOrg.tsx` usage grep + live 404 |
| 8 | Social/OG: no `og:title`, `og:description`, `og:url`, `twitter:image`, `twitter:title` on any page (only `og:site_name`/`og:locale`/`og:image` from the root layout). `openGraph` is set only in the 5 failing `generateMetadata` routes. | P1 | Grep + live homepage HTML |
| 9 | `/admin/login` is indexable (`index, follow`) with **no title** (footer links to it). | P1 | Live probe; no `metadata` in `src/app/admin/login/page.tsx` |
| 10 | Broken links shipped in the UI: footer `/rss.xml` (404), footer `Admin` → `/admin/login`, research cards → `/research/<slug>` (404), `Organization.logo` → `/logo.png` (404). | P1 | Live probes + source |
| 11 | Image SEO is effectively absent: **0 `<img>` elements** in the whole app; exactly 2 `next/image` uses, both with `alt`. No image sitemap, no logo asset. | P2 | Source sweep |
| 12 | Bengali content is client-side only (react-i18next on a single URL); `og:locale:alternate bn_BD` is declared with no alternate URLs to back it. | P2 | `src/components/I18nProvider.tsx` + grep |

Nothing here blocks Googlebot. Everything here stops LENS from winning a branded query: the homepage has no title to rank, the deep content has no rendered metadata or body, and the sitemap hands Google four dead URLs.

**Verdict preview (full argument in §22): `TECHNICALLY INDEXABLE BUT SEO SIGNALS INCOMPLETE`.**

---

## 2. Current SEO Architecture

| Layer | Implementation | SEO consequence |
|-------|----------------|-----------------|
| Framework | Next.js `16.3.8`, App Router, React `19.2.8` (`package.json:33,36`) | Modern metadata APIs available (`metadata`, `generateMetadata`, `sitemap`, `robots`) — most are used, `metadataBase`/`alternates` are not. |
| Root layout | `src/app/layout.tsx` — **no `export const metadata`**; manual `<head>` tags only (lines 31-56) | No site-wide title template, no default description, no `metadataBase`, no canonical fallback. Every page must supply its own title; the homepage cannot. |
| Homepage | `src/app/page.tsx` — `"use client"`, heavy `dynamic(..., { ssr: false })` sections (lines 13-22) | A client page cannot export `metadata` → homepage ships with zero title/description. The SSR document bails out (`<!--$!--><template data-dgst="BAILOUT_TO_CLIENT_SIDE_RENDERING">`) and renders no content, nav, or links. |
| Listing pages | 17 server pages export static `metadata`; content mostly hardcoded demo arrays (e.g. `src/app/blog/page.tsx:9-62`) | Titles/descriptions render correctly and are indexable; content is static, not CMS-driven. |
| Detail pages | `blog/[slug]`, `careers/[slug]`, `media/[slug]`, `programs/[slug]`, `resources/[slug]` use `generateMetadata` + `db.*.findUnique`; `library/[slug]`, `researchers/[slug]` use static metadata | Currently render **no metadata and no body** in production (DB failure, §10/§12). |
| Crawler policy | `src/proxy.ts` allowlist committed in `e4d24b5` ("Fix crawler access for SEO routes") | Googlebot/authorized crawlers → 200 (verified); default `curl` UA → 403 by design (verified: 9-byte `Forbidden` body). |
| Sitemap | `src/app/sitemap.ts` — 14 static entries + DB-driven `researchArticle` slugs with hardcoded fallback (lines 33-38) | 18 URLs live; fallback produced 4 dead URLs (§7). |
| Robots | `src/app/robots.ts` | `Allow: /`, disallows `/api/ /admin/ /_next/ /private/ /og`; blocks GPTBot, ChatGPT-User, CCBot; sitemap declared on apex host (§8). |
| Database | Prisma `^6` + PostgreSQL; `NEXT_PUBLIC_SITE_URL` env-driven base URL | Production DB errors currently void all DB-backed SEO output (§10, §12). |
| i18n | `react-i18next`, `src/components/I18nProvider.tsx`, `locales/{en,bn}/common.json` | Single-URL, client-side translation — no locale alternates (§14). |
| Hosting | Vercel (`vercel.json`), Sentry wrapping (`next.config.ts:95`), apex → `www` 308 redirect | Host split must be resolved by canonical/`metadataBase` (§5). |
| Quality gates | `npm run lint` → **75 problems (33 errors, 42 warnings), exit 1** (re-verified this phase) | Any future implementation must not rely on lint passing today (§20). |

---

## 3. Brand Entity Audit

**What exists (verified in source):**

- `OrganizationSchema` (`src/components/SchemaOrg.tsx:6`) rendered exactly once, on `/about` (`src/app/about/AboutContent.tsx:93`):
  - `name`: "LENS", `alternateName`: "Lighthouse for Evolving Narrative Systems"
  - `url`: `BASE_URL`, `logo`: `${BASE_URL}/logo.png`
  - `foundingDate`: "2024", Dhaka (Bangladesh) address, `areaServed`: Bangladesh
  - `contactPoint` emails: `info@lens.org.bd`, `media@lens.org.bd`
  - `sameAs`: `facebook.com/lensorgbd`, `twitter.com/lensorgbd`, `linkedin.com/company/lensorgbd`, `youtube.com/@lensorgbd`
- Consistent brand strings elsewhere: `og:site_name` = "LENS — Lighthouse for Evolving Narrative Systems" (`layout.tsx:43`), `author`/`publisher` = "LENS" (`layout.tsx:40-41`), Twitter handle `@lensorgbd` (`layout.tsx:50`), footer socials matching `sameAs` (`Footer.tsx:72-75`).

**Defects:**

1. **`Organization.logo` → 404.** `public/logo.png` does not exist (live `GET /logo.png` = 404). A broken `logo` property weakens the very entity signal it is meant to provide.
2. **Entity sits on a secondary page only.** `/about` is not the homepage and is not linked with the Organization markup on `/`, so the primary brand URL carries no entity markup.
3. **Contact identity points at the legacy domain** (`@lens.org.bd` emails; `BASE_URL` fallback `"https://lens.org.bd"` in `SchemaOrg.tsx`, `layout.tsx:24`, `sitemap.ts:1`, `robots.ts:3`). If `NEXT_PUBLIC_SITE_URL` is ever unset in an environment, every absolute URL silently reverts to the wrong domain.
4. **No `WebSite` schema on the homepage** (component exists, unused) → no `SearchAction`/site-level entity anchor.
5. **Off-site entity corroboration is unverified.** Wikipedia/Wikidata/Knowledge-Panel presence cannot be verified from this environment; no claim is made either way. An exact-phrase web search for `"Lighthouse for Evolving Narrative Systems" OR "lensbd.org"` via the search index available to this audit returned **no results for LENS or lensbd.org** (results were unrelated "Lighthouse" organizations) — weak corroboration of near-zero external brand footprint, **not** a Google-result claim.
6. **AI-answer visibility is deliberately off:** `robots.txt` blocks `GPTBot`, `ChatGPT-User`, and `CCBot`. This does not affect Google, but it does mean LENS content is opted out of the AI assistants that increasingly answer branded queries. Flagged as a policy decision, not a defect (§20).

---

## 4. Homepage SEO Audit

Live `GET https://www.lensbd.org/` with Googlebot UA:

| Signal | Observed | Required state |
|--------|----------|----------------|
| HTTP status | 200 | 200 (pass) |
| `<title>` | **absent** (0 matches in 16,060-byte document) | Brand-first title, e.g. `LENS — Lighthouse for Evolving Narrative Systems` |
| `meta[name=description]` | **absent** | 140-160 char description |
| `rel=canonical` | **absent** | Absolute `www` URL |
| `og:title` / `og:url` | **absent** | Present |
| `twitter:image` | **absent** | Present |
| `<h1>` | **absent** | One H1 |
| `<nav>` / `<header>` | **absent** | Server-rendered nav |
| Visible text | **20 chars** — "Skip to main content" | Full hero + section copy |
| SSR bailout marker | `<!--$!--><template data-dgst="BAILOUT_TO_CLIENT_SIDE_RENDERING">` present | None |
| JSON-LD | none | `Organization` + `WebSite` |

**Root cause chain (verified in source):**

1. `src/app/page.tsx:1` is `"use client"` → cannot `export const metadata`.
2. `src/app/layout.tsx` exports **no** `metadata` → no fallback title/description to inherit.
3. All primary content (`Hero`, `FocusAreas`, `FeaturedResearch`, `AISection`, `ImpactStats`, `EventsNewsletter`) is `dynamic(..., { ssr: false })` (`page.tsx:13-22`) → excluded from HTML.
4. The document still bails out of SSR, so even `Header`/`Footer` (imported directly at `page.tsx:11,34`) do not appear — homepage HTML contains **zero internal links**.

**Consequence:** Googlebot's HTML fetch sees an empty branded shell; a rendered-JS fetch sees content but still no `<title>` (metadata cannot exist for this page as written). Non-rendering crawlers, social scrapers, and link-preview bots (Discord/WhatsApp/Slack) all see a titleless page. The homepage is the single most important URL for `site:lensbd.org` and for any branded sitelink.

---

## 5. Canonical Domain Audit

| Check | Verified observation |
|-------|---------------------|
| Apex → www | `https://lensbd.org/` → **308** → `https://www.lensbd.org/` (permanent) |
| Canonical tag | **0 occurrences** of `canonical` rendering (only match in repo is the unused CMS field `canonicalUrl`, `src/lib/actions/cms.ts:25`) |
| `metadataBase` | **0 occurrences** in `src` |
| `alternates` / `hreflang` | **0 occurrences** in `src` |
| Sitemap host | **apex** — all 18 `<loc>` are `https://lensbd.org…` (`NEXT_PUBLIC_SITE_URL` = `https://lensbd.org`) |
| robots.txt sitemap host | **apex** — `Sitemap: https://lensbd.org/sitemap.xml` |
| `og:image` host | **apex** — `https://lensbd.org/og?…` (resolves via 308 to www; 200 `image/png`, 1200×630) |
| Served host | **www** |
| Internal links | host-relative (`/about`), so they follow whatever host the request lands on |

**Assessment:** The 308 consolidates apex → www at the HTTP level, so duplicate-host indexing risk is *mitigated but not declared*. Because no page states its own canonical, Google must infer consolidation from redirects alone; combined with sitemap/OG URLs on the apex host, the site sends **two different absolute URLs for every page** into its own signals. Recommendation is a single declared preference (`metadataBase` + per-page canonical or a host-level canonical), choosing **one** host — the `www` host is the one that actually serves content, and the brief's verified GSC fetches were performed against the www host.

**Not verified (manual):** which host Google has actually selected as canonical — see §16.

---

## 6. Indexability Matrix

Legend: ✓ pass · ✗ fail · n/a not applicable · **bold** = P0. All rows probed live with Googlebot UA during this audit.

| Route | HTTP | `<title>` | Description | Canonical | Content in HTML | In sitemap | Internally linked | Notes |
|-------|------|-----------|-------------|-----------|-----------------|------------|-------------------|-------|
| `/` | 200 | **✗ none** | **✗ none** | ✗ | **✗ 20 chars** | ✓ | ✗ (SSR has no links) | SSR bailout |
| `/about` | 200 | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ header/footer | 1 JSON-LD (`Organization`); two `<h1>` (skeleton + page) |
| `/research` | 200 | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | cards link to 404s (§11) |
| `/publications` | 200 | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | |
| `/programs` | 200 | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | |
| `/media` | 200 | ✓ "Media" | ✓ | ✗ | ✓ 1,356 chars | ✓ | ✓ | |
| `/partnerships` | 200 | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | |
| `/events` | 200 | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | `Event` JSON-LD present |
| `/blog` | 200 | ✓ | ✓ | ✗ | ✓ 1,807 chars | ✓ | ✓ | cards are **not links** (§11) |
| `/resources` | 200 | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | |
| `/careers` | 200 | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | no `href` to detail pages |
| `/contact` | 200 | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | |
| `/privacy` / `/terms` | 200 | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ footer | |
| `/impact` | 200 | ✓ | ✓ | ✗ | **✗ 61 chars** ("Loading impact data...") | **✗** | **✗ orphan** | client-only body |
| `/library` | 200 | ✓ | ✓ | ✗ | **✗ 48 chars** ("Loading...") | **✗** | **✗ orphan** | client-only body |
| `/researchers` | 200 | ✓ | ✓ | ✗ | **✗ 149 chars** ("Loading researchers...") | **✗** | **✗ orphan** | list fetched client-side → 500 |
| `/assistant` | 200 | ✓ | ✓ | ✗ | partial | **✗** | only via client-only homepage widgets | |
| `/blog/<slug>` (×2 tested) | 200 | **✗ none** | **✗ none** | ✗ | **✗ 67 chars (skeleton)** | **✗** | **✗ orphan** | DB-backed `generateMetadata` fails |
| `/careers/<slug>` | 200 | **✗ none** | **✗ none** | ✗ | **✗ 67 chars** | **✗** | **✗ orphan** | same |
| `/programs/<slug>` | 200 | **✗ none** | **✗ none** | ✗ | **✗ 67 chars** | **✗** | **✗ orphan** | same |
| `/research/<slug>` (4 URLs) | **404** | — | — | — | 404 page | **✗ published** | from `/research` cards | route does not exist |
| `/library/<slug>`, `/researchers/<slug>` | 200 (shell) | static metadata | ✓ | ✗ | client-fetched | **✗** | client-only links | |
| `/admin/login` | 200 | **✗ none** | generic | ✗ | login form | n/a | footer "Admin" | robots meta = `index, follow` ✗ should be noindex; blocked by robots.txt |
| `/rss.xml` | **404** | — | — | — | — | — | **footer link** | broken |
| `/logo.png` | **404** | — | — | — | — | — | `Organization.logo` | broken |
| `/search` | **404** | — | — | — | — | — | — | target of unused `WebSite.SearchAction` |
| `/robots.txt` | 200 | — | — | — | valid | — | — | verified given + re-probed |
| `/sitemap.xml` | 200 | — | — | — | 18 `<loc>` | — | declared in robots | 4 dead URLs inside |

**Summary counts:** 24 public page files; **1** (`/`) exports no metadata at all; **5** detail families currently render no metadata in production; **0** routes emit a canonical; **4** sitemap URLs 404; **4** section pages are orphaned (absent from nav + footer + sitemap).

---

## 7. Sitemap Audit

Live `GET /sitemap.xml` (Googlebot UA): 200, `application/xml`, **18 `<loc>` entries**.

| # | Entry | Status |
|---|-------|--------|
| 1 | `https://lensbd.org` | 200 (after 308 → www) |
| 2-14 | `/about` `/research` `/publications` `/programs` `/media` `/partnerships` `/events` `/blog` `/resources` `/careers` `/contact` `/privacy` `/terms` | 200 |
| 15 | `https://lensbd.org/research/narratives-in-the-digital-age` | **404** |
| 16 | `https://lensbd.org/research/media-index-bangladesh-2025` | **404** |
| 17 | `https://lensbd.org/research/youth-narratives-civic-engagement` | **404** |
| 18 | `https://lensbd.org/research/media-literacy-resilient-democracy` | **404** |

**Findings:**

1. **Dead URLs (P0).** Entries 15-18 come from the hardcoded fallback in `src/app/sitemap.ts:33-38`, pushed at line 51-58 as `/research/${slug}`. There is **no** `src/app/research/[slug]` route in the app, so these can never return 200. The DB branch (`db.researchArticle.findMany`, lines 39-49) either threw or returned 0 published rows at sitemap generation time.
2. **Slug mismatch even against the cards.** `ResearchContent.tsx:21` uses slug `narratives-digital-age` while the sitemap fallback uses `narratives-in-the-digital-age` — two different dead URLs for the "same" item.
3. **Host:** all entries are apex (`lensbd.org`) while content is served on `www` (§5).
4. **Identical timestamps by construction:** `sitemap.ts:11` sets one `lastModified = new Date()` reused for every entry, so `lastmod` carries no per-page change information (live values all equal).
5. **Omissions:** `/impact`, `/library`, `/researchers`, `/assistant`, and **every** detail URL (`/blog/<slug>`, `/careers/<slug>`, `/media/<slug>`, `/programs/<slug>`, `/resources/<slug>`, `/library/<slug>`, `/researchers/<slug>`). GSC therefore cannot be told about the pages that would carry the brand's real content.
6. **Coverage vs submitted sitemap:** GSC reported SUCCESS on submission (given fact) — that confirms acceptance, not that each URL is indexed (§16).

---

## 8. Robots Audit

Live `GET /robots.txt` (Googlebot UA), verbatim:

```
User-Agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /_next/
Disallow: /private/
Disallow: /og

User-Agent: GPTBot
Disallow: /

User-Agent: ChatGPT-User
Disallow: /

User-Agent: CCBot
Disallow: /

Sitemap: https://lensbd.org/sitemap.xml
```

| Check | Result |
|-------|--------|
| Served with 200 to Googlebot | ✓ (given + verified) |
| `Allow: /` for all agents | ✓ — no blanket blocking remains after Phase 12 |
| Sitemap directive present | ✓ — but **apex host**, inconsistent with served `www` host (§5) |
| `/admin/` disallowed | ✓ — but `/admin/login` also carries `index, follow` meta and no title; robots.txt and meta signals disagree (§6, §19) |
| `/api/` disallowed | ✓ appropriate |
| `/_next/` disallowed | ✓ conventional for Next.js (note: keeps JS bundles out of the index; content must therefore arrive in HTML) |
| `/private/` disallowed | ✓ harmless (no such route exists) |
| **`/og` disallowed** | ⚠ `/og` is the **`og:image` endpoint** used by every page (`layout.tsx:46`). Googlebot does not index OG images, so impact is minor, but disallowing the URL that your own metadata points to is self-contradictory and will block any image-indexing use of it. |
| AI crawlers blocked (GPTBot / ChatGPT-User / CCBot) | Deliberate; no Google impact; suppresses AI-answer citations (§3.6, §20) |
| Non-allowlisted UAs (e.g. default `curl`) → **403** | Expected behavior of the Phase 12 allowlist; verified 9-byte `Forbidden`. Googlebot UA → 200. |

No `X-Robots-Tag` response header was observed on `/` (headers: `HTTP/1.1 200`, `Content-Type: text/html; charset=utf-8`, `X-Content-Type-Options: nosniff`). Meta robots on public pages is `index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1` (`layout.tsx:51-52`) — correct and permissive.

---

## 9. Structured Data Audit

**Component inventory** — `src/components/SchemaOrg.tsx`:

| Component | Line | Usage sites | Status |
|-----------|------|-------------|--------|
| `OrganizationSchema` | 6 | `src/app/about/AboutContent.tsx:93` (1) | Used, only on `/about` |
| `EventSchema` | 234 | `src/app/events/EventsContent.tsx:65` (1) | Used, only on `/events` |
| `WebsiteSchema` | 104 | **0** | Unused |
| `BreadcrumbSchema` | 137 | **0** | Unused |
| `ArticleSchema` | 164 | **0** | Unused — no article pages emit `Article` |
| `FAQSchema` | 307 | **0** | Unused |

**Live confirmation:** `/` → 0 JSON-LD blocks; `/about` → 1 (`Organization`).

**Gaps (only properties backed by real site data are recommended):**

1. **No `WebSite` on `/`** — the component exists; it needs only `name`, `url`, `potentialAction` pointing at a search URL. **Constraint:** there is **no `/search` route** (live 404), so `SearchAction` must **not** be emitted until a search URL exists; otherwise the schema advertises a 404.
2. **No `Article` on any detail page** — `blog/[slug]` already has `headline`, `author`, `datePublished`, `description` in its render (`src/app/blog/[slug]/page.tsx:36-58`), i.e. all required `Article` fields exist in real data. The unused `ArticleSchema` is a direct fit once pages render again.
3. **No `Breadcrumb` on detail pages** — breadcrumbs are already rendered in the DOM (`blog/[slug]/page.tsx:38-45`, `Home / Blog / <title>`), so `BreadcrumbList` would simply mirror visible markup.
4. **`Organization` not present on the homepage** — the brand's primary URL carries no entity markup.
5. **`Organization.logo` → 404** (`public/logo.png` missing) — invalid property value until an asset exists.
6. **`Organization.contactPoint` emails use the legacy `@lens.org.bd` domain** while the site is `lensbd.org`.
7. **No `Event` structured data verification beyond source** — emitted from `EventsContent.tsx:65`; confirm on the live `/events` HTML before relying on it (not re-parsed for this report).

**Explicitly not claimed:** rich-result eligibility, snippet enhancements, or Knowledge-Panel outcomes — none can be guaranteed.

---

## 10. Metadata Audit

**Coverage matrix (source-verified across all 24 public `page.tsx` files):**

| Route group | Declaration | Title quality | Description | `openGraph` |
|-------------|-------------|---------------|-------------|-------------|
| `/` (home) | **none** (`"use client"` page, no layout fallback) | **absent** | **absent** | none |
| 17 listing pages (about, research, publications, programs, media, partnerships, events, blog, resources, careers, contact, privacy, terms, impact, library, researchers, assistant) | static `export const metadata` | present, descriptive (e.g. `/research` → "Research & Insights" + full description) | present | **none** |
| `blog/[slug]`, `careers/[slug]`, `media/[slug]`, `programs/[slug]`, `resources/[slug]` | `generateMetadata` (line ~11-21 each) | would be `post.metaTitle \|\| post.title` | would be `metaDescription \|\| description` | `openGraph` set (line 19) — **but these pages currently emit no metadata at all in production** |
| `library/[slug]`, `researchers/[slug]` | static `metadata` | present | present | none |
| `admin/login` | **none** | **absent** (live) | inherits nothing | none |
| `not-found` | `metadata` + `robots: noindex,nofollow` | "Page Not Found" | ✓ | none |

**Additional findings:**

1. **No title template.** No `title: { default, template }` anywhere → brand suffixes like `%s | LENS` are impossible to apply consistently.
2. **No `metadataBase`** → any relative `openGraph.url`/`metadata` URL resolution is undefined; currently everything relies on absolute env-derived strings.
3. **`canonicalUrl` is a CMS field that is never rendered** (`src/lib/actions/cms.ts:25`); `metaTitle`/`metaDescription` are consumed only by the 5 `generateMetadata` routes (which are currently dark).
4. **Root layout `keywords` meta** (`layout.tsx:42`) — legacy signal with negligible ranking value; harmless, listed for completeness.
5. **`google-site-verification`** is emitted only if `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` is set (`layout.tsx:53-55`); presence in production is **unverifiable** from outside (it would be visible in HTML — note: the live homepage head did **not** contain a `google-site-verification` tag during this audit, which is consistent with the env var being unset; GSC property verification status still requires manual check, §16).
6. **Root-cause note for detail pages:** `generateMetadata` returns `{ title: "Post Not Found" }` when the row is merely missing (`blog/[slug]/page.tsx:16-17`) and the page calls `notFound()` → 404. Production shows **neither** (200 + empty title + skeleton), so the DB call is *erroring or hanging*, not returning null. This is consistent with `/api/researchers` → 500.

---

## 11. Internal Linking Audit

**Declared navigation (source):**

- Header (`src/components/Header.tsx:18-27`): `/` `/about` `/research` `/programs` `/publications` `/media` `/partnerships` `/events` `/blog` `/contact` — plus `/contact` CTAs (lines 135, 174).
- Footer (`src/components/Footer.tsx:56-68`): same set with `/resources` added; socials (lines 72-75); **`/rss.xml` (line 76, 404)**; `/privacy` (169); `/terms` (171); **`/admin/login` (173, "Admin")**.

**Discovery gaps (verified by regex sweep of every `src/app/**/*.tsx`):**

| Target | Linked from | Reachable in SSR HTML? |
|--------|-------------|------------------------|
| `/blog/<slug>` | **nothing** | n/a |
| `/careers/<slug>` | **nothing** | n/a |
| `/media/<slug>` | **nothing** | n/a |
| `/programs/<slug>` | **nothing** | n/a |
| `/resources/<slug>` | **nothing** | n/a |
| `/library/<slug>` | `library/LibraryContent.tsx`, `assistant/AssistantContent.tsx`, `researchers/[slug]/…` (client components) | only after JS |
| `/researchers/<slug>` | `researchers/ResearchersContent.tsx` (client; list currently 500s) | only after JS |
| `/research/<slug>` | `research/ResearchContent.tsx:86` → **404** | yes (dead) |
| `/impact` | **nothing** (not in header/footer/sitemap) | orphan |
| `/library` | **nothing** | orphan |
| `/researchers` | **nothing** | orphan |
| `/assistant` | `AISection.tsx:275`, `FloatingAIButton.tsx:21` (both `ssr:false` on homepage) | only after JS |
| `/rss.xml` | `Footer.tsx:76` → **404** | yes (dead) |
| `/logo.png` | `SchemaOrg` `Organization.logo` → **404** | yes (dead) |

**Card-level defects:**

- `src/app/blog/page.tsx:86-107` — blog cards are plain `<article>` elements with `cursor-pointer` and **no `href`**: the listing links to nothing. Same pattern on `/careers` (no `href`/`Link` occurrences in the file).
- Homepage section links (`Hero.tsx:285,295` → `/research`, `/programs`; `FocusAreas.tsx:286` → `/about`; `FeaturedResearch.tsx:321` → `/publications`; `EventsNewsletter.tsx:214` → `/events`) live inside `ssr:false` components → **absent from homepage HTML**, so no link equity flows from the strongest URL in SSR.

**Consequences:** the brand's substantive content (all detail routes) has **no crawl path at all** — not from nav, not from listings, not from the sitemap. Four section pages (`/impact`, `/library`, `/researchers`, `/assistant`) depend entirely on client-side discovery. Internal link equity from `/` is zero in the HTML Googlebot fetches first.

---

## 12. Content/Relevance Audit

**Two-tier content architecture (source-verified):**

1. **Static/demo tier (renders fine):** listing pages contain hardcoded arrays — e.g. `blog/page.tsx:9-62` defines 6 posts with titles, excerpts, dates, categories; `research/ResearchContent.tsx:8-40` defines 4 research areas. These produce real, indexable SSR text (verified: `/blog` 1,807 visible chars, `/media` 1,356).
2. **DB tier (dark in production):** all detail pages plus researcher/library listings.

**Measured SSR content (Googlebot UA, live):**

| URL | Visible text | Assessment |
|-----|--------------|------------|
| `/` | **20 chars** | empty brand page |
| `/blog/<slug>` ×2 | **67 chars** (loading skeleton: "Skip to main content LENS Lighthouse for Evolving Narrative Systems") | no article body, no title |
| `/careers/<slug>` | 67 chars | same |
| `/programs/<slug>` | 67 chars | same |
| `/impact` | 61 chars | "Loading impact data..." |
| `/library` | 48 chars | "Loading..." |
| `/researchers` | 149 chars | heading + "Loading researchers..." |
| `/blog` | 1,807 chars | healthy (but cards don't link) |

**Relevance signals that do exist:**

- Strong, on-topic static descriptions on listing pages (e.g. `/research`: "Evidence-based research on media literacy, press freedom, narrative analysis, policy advocacy and cybersecurity in Bangladesh" — `research/page.tsx:7-9`).
- Root-layout `keywords` enumerates the target vocabulary (media literacy, press freedom, narrative research, policy advocacy, digital rights, journalist safety, cybersecurity, media indexing…).
- Titles are brand/section consistent ("About LENS…", "Research & Insights", "Researcher Network").

**Relevance risks:**

1. **Content duplication of intent:** `/blog` (static demo posts) vs `/blog/<slug>` (DB posts) — if slugs diverge, listings advertise content that does not exist; if they align, the listing still links to nothing.
2. **Soft-404 exposure:** detail routes return **200 with no content** — Google may treat these as soft 404s or index an empty shell, which is worse than a clean 404.
3. **Thin-content pages in the index:** `/impact` (61 chars), `/library` (48), `/researchers` (149) are indexable but effectively empty in HTML.
4. **Bengali content is invisible to crawlers** (client-side i18n, §14), halving the potential corpus for `bn` queries.
5. **No visible FAQ/forum/how-to content** → `FAQSchema` has nothing real to mark up yet (must not be added speculatively).

---

## 13. Performance SEO Audit

| Aspect | Verified observation | SEO impact |
|--------|----------------------|------------|
| HTML delivery | Homepage document = 16,060 bytes but contains **no content**; content requires JS + hydration | First paint for crawlers is empty; rendered-content dependency |
| SSR bailout | `BAILOUT_TO_CLIENT_SIDE_RENDERING` digest present in homepage HTML | Even server-side partial rendering is not happening for `/` |
| Client-only sections | `dynamic(..., { ssr: false })` ×11 (`page.tsx:13-22`) — Three.js globe (Hero), GSAP/ScrollTrigger, Lenis smooth scroll | LCP element is created client-side; hero words start at `opacity-0` (`Hero.tsx:269`) and animate in — LCP text is invisible for the first animation frames |
| Loading UI | Global `src/app/loading.tsx` (H1 "LENS") is what crawlers actually index on failing routes | The only H1 Googlebot sees on detail URLs is the loading screen's |
| Fonts | `next/font` Inter + Hind Siliguri with `display: "swap"` (`layout.tsx:11-22`), preconnects to `fonts.googleapis.com`/`fonts.gstatic.com` | Good practice (swap avoids FOIT-blocking text) |
| Images | 0 `<img>`; 2 `next/image` (with `alt`); `images.formats` avif/webp (`next.config.ts:40`) | Little to optimize; also little image-driven discovery |
| Third parties | GTM/GA/Facebook connect in CSP + preconnects; Sentry wrapper (`next.config.ts:95`) | Standard; GTM is render-blocking-ish but accepted |
| Security headers | CSP, HSTS, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy (`next.config.ts:4-33`) | No negative SEO impact |
| Core Web Vitals | **Not measurable from this environment** (no field data, no Lighthouse run) | Must come from GSC CWV report / CrUX (§16) — no claims made |

**Assessment:** the risk profile is *empty-HTML* rather than *slow-HTML*. CWV status is explicitly **unverified**; the architectural issue that matters for SEO is content absence in the initial document, not byte weight.

---

## 14. Internationalization Audit

| Check | Observation |
|-------|-------------|
| URL structure | Single-URL i18n — English and Bengali share `/` (and every path) |
| Mechanism | `src/components/I18nProvider.tsx` + `react-i18next`/`i18next`, resources at `locales/en/common.json`, `locales/bn/common.json` |
| `<html lang>` | `"en"` in server HTML (`layout.tsx:30`); toggled client-side by the "বাং" control |
| Alternate URLs | **none** — 0 `alternates`, 0 `hreflang` in `src` |
| `og:locale` / `og:locale:alternate` | `en_US` + `bn_BD` (`layout.tsx:44-45`) declared **without** any corresponding localized URL |
| Bengali corpus visibility | Bengali strings render only after client-side language switch → **not present in crawler HTML** |
| `x-default` strategy | not defined |

**Assessment:** this is a legitimate design (single-URL toggle) but it means (a) Bengali queries have no crawlable Bengali document to rank, (b) `og:locale:alternate bn_BD` is an unsupported claim, and (c) there is no `hreflang` annotated path to a future `/bn/…` structure. **Recommendation is not to build a locale split now** — just to stop declaring an alternate locale that does not exist (§17, P2) and, if Bengali search becomes a goal, to plan server-rendered locale URLs later.

---

## 15. Social/OG Audit

**Root layout provides (live, verified on `/`):**

```
og:site_name = LENS — Lighthouse for Evolving Narrative Systems
og:locale    = en_US
og:locale:alternate = bn_BD
og:image     = https://lensbd.org/og?title=LENS&subtitle=Lighthouse+for+Evolving+Narrative+Systems
og:image:width/height = 1200 / 630
twitter:card = summary_large_image
twitter:creator = @lensorgbd
```

`GET /og?…` → **200, `image/png`** (dynamic OG image route works).

**Missing sitewide:**

| Tag | Status |
|-----|--------|
| `og:title` | **absent everywhere** (grep: 0) |
| `og:description` | **absent everywhere** (grep: 0) |
| `og:url` | **absent everywhere** |
| `og:type` | absent |
| `og:site_name` present but on apex-host image URL | ⚠ apex → www 308 |
| `twitter:image` | **absent** (only `twitter:card` + `twitter:creator`, `layout.tsx:49-50`) |
| `twitter:title` / `twitter:description` | absent |
| `openGraph` in metadata API | only in the 5 `generateMetadata` routes (`…/[slug]/page.tsx:19`) — currently not rendering (§10) |

**Other defects:**

1. **Homepage has no OG title/description** → every shared link to the homepage previews with fallback/generic text.
2. **`og:image` is on the apex host** while the canonical host is www (§5).
3. **`public/manifest.json` contains mojibake:** `"name": "LENS ? Lighthouse for Evolving Narrative Systems"` — byte `0x3F` (`?`) where the em dash should be (verified via hex dump). PWA/name strings display incorrectly.
4. Missing assets referenced elsewhere: `public/logo.png` (404), no `favicon.ico` file in `public/` (a generated `favicon.ico` route responds 200 — fine, but `logo.png` is genuinely absent).

---

## 16. Search Console Manual Checks

Items that **cannot** be verified from this environment and must be run by the operator in Google Search Console (and optionally CrUX/PageSpeed). No values below are asserted as observed facts.

**A. Already reported to this audit as done (treat as given, not re-audited):**

- [x] Sitemap submitted: `SUCCESS`
- [x] Googlebot fetch of `/`, `/sitemap.xml`, `/robots.txt` → 200

**B. Required manual checks:**

1. **URL Inspection → `https://www.lensbd.org/`**: Is a title shown? Which? "Crawled — currently not indexed" vs "Discovered — currently not indexed" vs indexed?
2. **URL Inspection → one DB detail URL** (e.g. `/blog/understanding-media-narratives-in-the-age-of-social-media`): status, and whether Google rendered the loading skeleton (compare "Viewer"/HTML).
3. **Indexing → Pages report**: counts for "Indexed" / "Excluded" / "Crawled - currently not indexed"; check for `Alternate page with proper canonical tag`, `Page with redirect` (apex vs www), `Soft 404` clusters on detail URLs.
4. **Sitemaps report**: submitted vs. *discovered* URL count — expect discovered ≈ 18, and confirm the 4 `/research/*` URLs show as "Couldn't fetch"/404.
5. **Canonicalization**: which host Google selected (www vs apex) under "View crawled page → Canonical".
6. **Search Console → Performance**: branded query `LENS`, `lens`, `lensbd`, `Lighthouse for Evolving Narrative Systems`, `site:lensbd.org` — record impressions/position (this is the actual success metric for this phase's goal).
7. **Core Web Vitals → field data** for `www.lensbd.org` (LCP/CLS/INP) — no CWV claims were made in §13.
8. **Mobile Usability report** — clean-status unverified here.
9. **robots.txt Tester**: confirm `/`, `/sitemap.xml` allowed; confirm intended `/og` disallow.
10. **`site:lensbd.org`** (Google, logged out, incognito): count and which URLs appear; confirm no `admin/login` or empty detail shells are indexed.
11. **Rich Results Test / Schema validator** on `/about` (Organization) and `/events` (Event).
12. **Verify `google-site-verification`**: no tag was present in the audited homepage HTML — confirm how the GSC property is verified (DNS vs meta) and that `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` is intentionally unset.

---

## 17. P0/P1/P2 Recommendations

**P0 — required before any brand-ranking effort is meaningful (blocks the goal):**

| # | Recommendation | Rationale (evidence) |
|---|----------------|----------------------|
| P0-1 | Restore production database connectivity / fix the failing Prisma queries, then re-probe `/api/researchers` (200), a detail URL (real title + body), and the sitemap DB branch. | `/api/researchers` → 500; all `generateMetadata` detail pages emit nothing (§10, §12) |
| P0-2 | Give the homepage a real title/description by moving site-level metadata into `src/app/layout.tsx` (`metadataBase`, `title: { default, template }`, `description`) and/or converting `page.tsx` to a server component. | `/` has no `<title>` at all (§4) |
| P0-3 | Server-render homepage content (H1 + hero copy + primary links in HTML) instead of `ssr:false` bail-out. | 20 visible chars, no nav/links (§4, §11) |
| P0-4 | Add canonical URLs + `metadataBase`, and settle one host (recommend `www`) across sitemap, robots, and `og:image`. | 0 canonicals; apex/www split (§5) |
| P0-5 | Remove or fix the 4 dead `/research/<slug>` sitemap entries (either create the route or drop them; also reconcile `narratives-digital-age` vs `narratives-in-the-digital-age`). | 4× 404 in submitted sitemap (§7) |
| P0-6 | Add every live section page (`/impact`, `/library`, `/researchers`, `/assistant`) and, once rendering, all detail URLs to the sitemap. | 4 orphans + all detail pages missing (§7, §11) |
| P0-7 | Ensure detail pages emit `title`/`description` even when data is unavailable (graceful fallback + correct 404) rather than a 200 with no metadata. | 200 + empty title = soft-404 risk (§10, §12) |

**P1 — high-value SEO signals:**

| # | Recommendation | Rationale |
|---|----------------|-----------|
| P1-1 | Link detail cards: make `/blog` and `/careers` cards real `<a href>` links; add detail routes to nav/footer context. | Cards have no `href` (§11) |
| P1-2 | Emit `WebSite` (without `SearchAction` until a `/search` route exists), `Organization` on the homepage, `Article` + `BreadcrumbList` on detail pages (data already available). | §9 |
| P1-3 | Add `og:title`, `og:description`, `og:url`, `og:type`, `twitter:image`, `twitter:title`, `twitter:description` sitewide via layout defaults. | §15 |
| P1-4 | `noindex` `/admin/login`, remove the footer "Admin" link from public pages. | indexable, untitled login page (§6) |
| P1-5 | Fix broken links: `/rss.xml` (implement or remove), `Organization.logo` → real `public/logo.png`, research card hrefs → real route. | §11 |
| P1-6 | Add `/library`, `/researchers`, `/impact` to header/footer navigation (or at least footer). | 3 orphan section pages (§11) |
| P1-7 | Fix `public/manifest.json` mojibake (`LENS ? …` → proper dash). | hex-verified (§15) |
| P1-8 | Reconcile `Organization` contact emails/domain and the `BASE_URL` fallbacks (`lens.org.bd`) with `lensbd.org`. | §3, §5 |
| P1-9 | Add descriptive `alt` text wherever images are introduced; keep the 2 existing `next/image` alts. | 0 `<img>`, 2 alts total (§13) |

**P2 — refinement:**

| # | Recommendation | Rationale |
|---|----------------|-----------|
| P2-1 | Decide the Bengali strategy: either drop `og:locale:alternate bn_BD` or plan server-rendered locale URLs + `hreflang`. | §14 |
| P2-2 | Per-entry `lastmod` in `sitemap.ts` (use real content timestamps). | single timestamp for all (§7) |
| P2-3 | Image sitemap / logo assets once photography exists. | §13 |
| P2-4 | Remove legacy `keywords` meta or keep as-is (low impact). | §10 |
| P2-5 | Revisit AI-crawler blocking (GPTBot/CCBot) as a brand-visibility policy decision. | §3.6 |
| P2-6 | Optional `/search` route so a `SearchAction` becomes truthful. | `/search` = 404 today (§9) |

---

## 18. Proposed Safe Implementation Plan

Audit-only phase: **no step below has been executed.** Each step is listed with its own verification so it can be run later without guessing.

**Stage 0 — Preconditions (no code):**
1. Operator runs §16 GSC checks and captures baseline (indexed counts, branded-query impressions).
2. Diagnose the DB failure with server logs / `prisma` connectivity (root cause of P0-1). *Verify:* `GET /api/researchers` → 200 with non-empty array on staging, then production.
3. Confirm deployment provenance: production must be built from a known commit (`e4d24b5` or later) with `NEXT_PUBLIC_SITE_URL` explicitly set to the chosen canonical host. *Verify:* response of `GET /robots.txt` shows the intended sitemap host.

**Stage 1 — Metadata foundation (smallest safe diff):**
4. Add `metadataBase`, `title.default`/`title.template`, `description` to `src/app/layout.tsx` (no other behavior change). *Verify:* homepage HTML contains one `<title>`; listing titles still render as before (template suffix only).
5. Add canonical generation (page-level `alternates.canonical` or a shared helper). *Verify:* every public URL returns one absolute canonical on the chosen host.
6. Add OG/Twitter defaults in the same layout export. *Verify:* `og:title`/`og:url`/`twitter:image` present on `/` and `/blog`.

**Stage 2 — Sitemap integrity:**
7. Remove the dead `/research/<slug>` fallback entries (or gate them behind the DB result); include `/impact`, `/library`, `/researchers`, `/assistant`; host-align URLs. *Verify:* script fetches every `<loc>` and asserts 200 (expected ≥ 18/18 passing).
8. Re-submit the corrected sitemap in GSC. *Verify:* "Discovered URLs" matches the file; no 404 entries.

**Stage 3 — Homepage rendering:**
9. Convert `src/app/page.tsx` to a server component (or extract a server shell rendering `Header`/`Hero` text statically, keeping heavy WebGL behind `dynamic ssr:false` inside it). *Verify:* homepage HTML contains `<h1>`, nav links, and ≥ some hundred chars of visible text with JS disabled.

**Stage 4 — Detail-page resilience:**
10. Wrap `generateMetadata` DB reads in try/catch with a static fallback title/description, and ensure DB failure yields either real content or a proper 404 — never 200-with-empty-head. *Verify:* kill the DB in staging → detail URL returns either 404 or a valid fallback title; with DB up → full metadata + body.

**Stage 5 — Structured data & links:**
11. Emit `Organization` + `WebSite` (no `SearchAction`) on `/`; `Article` + `BreadcrumbList` on detail pages; make listing cards real links; add orphan sections to footer; fix `/rss.xml` and `logo.png`. *Verify:* Rich Results Test clean; crawler finds ≥ 1 inbound link to each detail route (grep or crawl).

**Stage 6 — Index hygiene:**
12. `noindex` `/admin/login`; remove public "Admin" link; re-audit `robots.txt` `/og` rule. *Verify:* URL Inspection shows "noindex" for the login URL.

**Ordering rationale:** Stage 0-2 deliver the largest visibility gain per unit risk (metadata + clean sitemap) without touching rendering behavior; rendering changes (Stage 3-4) follow with staging verification.

---

## 19. Files That Would Need Changes

No file below was modified in Phase 14. List is what Stage 1-6 of §18 would touch:

| File | Intended change (future) |
|------|--------------------------|
| `src/app/layout.tsx` | `metadataBase`, title template/default, default description, OG/Twitter defaults, canonical helper |
| `src/app/page.tsx` | convert to server component / server shell (removes client-only metadata + SSR bailout) |
| `src/app/sitemap.ts` | drop dead research fallback, add missing sections, host alignment, real `lastmod` |
| `src/app/robots.ts` | host alignment of `sitemap`; revisit `/og` disallow |
| `src/components/SchemaOrg.tsx` | logo URL fix, contact email/domain fix; optional `WebSite` without `SearchAction` |
| `src/app/about/AboutContent.tsx` | (optionally) keep `OrganizationSchema`; homepage would gain its own instance via layout |
| `src/app/blog/page.tsx`, `src/app/careers/page.tsx` | make cards `<a href>` links to detail routes |
| `src/app/blog/[slug]/page.tsx`, `careers/[slug]`, `media/[slug]`, `programs/[slug]`, `resources/[slug]` | resilient `generateMetadata` fallbacks; `Article`/`Breadcrumb` JSON-LD |
| `src/app/research/ResearchContent.tsx` | fix href slug mismatch / point at real route |
| `src/components/Footer.tsx` | remove/replace `/rss.xml`; remove public Admin link; add `/library`, `/researchers`, `/impact` |
| `src/app/admin/login/page.tsx` | `robots: noindex`, title |
| `public/logo.png` (new), `public/manifest.json` | add logo asset; fix mojibake name |
| `src/proxy.ts` | **no change expected** — Phase 12 fix is committed (`e4d24b5`) and verified working |

---

## 20. Risks

1. **DB root cause unknown from outside.** Evidence proves queries fail (`/api/researchers` → 500; detail pages render no metadata) but cannot distinguish connection failure vs. credentials vs. empty tables vs. schema drift (the working tree carries uncommitted `prisma` changes). Any fix plan that assumes a cause risks being wrong — Stage 0 diagnosis is mandatory.
2. **Deployment provenance is unprovable from here.** Production contains the Phase 12 fix (commit `e4d24b5`) but the working tree has 71 uncommitted entries, including routes not present in production (e.g. `/api/health` → 404 live while the file exists locally). Changes written now may not match what is deployed; always deploy from a clean, committed state.
3. **Host consolidation risk.** Switching sitemap/OG/`metadataBase` to one host while the other still 308s is safe; removing the redirect or changing `NEXT_PUBLIC_SITE_URL` incorrectly could de-index pages. Change one variable at a time and re-check GSC canonical selection (§16.5).
4. **Homepage rendering changes carry hydration/perf regression risk** (this codebase has a documented history of hydration/scroll fixes — `PHASE_HYDRATION_WARNING_AUDIT.md`, `PHASE_SCROLL_FIX_REPORT.md`). Stage 3 must be verified in a browser, not just by HTML grep.
5. **Lint is already failing** (75 problems / 33 errors, exit 1) — CI gates that run `npm run lint` will fail regardless of any SEO change; do not treat a lint failure as caused by these edits, and do not "fix" unrelated errors inside an SEO PR.
6. **Soft-404 / index bloat:** until Stage 4 ships, detail URLs remain 200-with-no-content; Google may index empty shells. Prioritize P0-1/P0-7 to stop the bleeding.
7. **Sitemap resubmission churn:** submitting repeatedly with a still-broken file wastes crawl budget and review cycles — only resubmit after the §21 sitemap check passes.
8. **Over-optimization / policy:** no black-hat tactics are recommended; keyword stuffing, hidden text, and manipulative schema are explicitly out of scope. Schema may only describe data that exists (already enforced in §9).
9. **AI-visibility trade-off:** keeping GPTBot/CCBot blocked is compliant with Google SEO but forgoes AI-answer citations for branded queries — a business decision, flagged not overridden.
10. **No ranking guarantees:** nothing in this report predicts a position. Only GSC performance data (§16.6) can measure branded visibility, and only after the P0 items ship and Google recrawls.

---

## 21. Verification Checklist

To be run after (and only after) the §18 stages are implemented. Each item is objective.

**Crawl / index**
- [ ] `curl -A "<Googlebot UA>" https://www.lensbd.org/` → 200 and contains one `<title>`, one `meta[name=description]`, one `rel=canonical`
- [ ] Same request with JS-disabled rendering → HTML contains `<h1>` and ≥ 1 internal `<nav>` link
- [ ] `curl … /sitemap.xml` → every `<loc>` returns 200 (script the loop); count matches GSC "Discovered URLs"
- [ ] `curl … /robots.txt` → sitemap host matches canonical host; `/`, `/sitemap.xml` allowed
- [ ] `curl https://www.lensbd.org/rss.xml` → 200 or removed from footer (no 404 links)
- [ ] `curl https://www.lensbd.org/logo.png` → 200 (or `Organization.logo` removed)
- [ ] `curl https://www.lensbd.org/research/<each slug>` → 200 **or** absent from sitemap
- [ ] `curl … /admin/login` → `robots` meta contains `noindex`

**Metadata / social**
- [ ] `<title>` present on `/`, a listing, and a detail page; titles follow the template
- [ ] `og:title`, `og:description`, `og:url`, `twitter:image` present on `/`
- [ ] All absolute URLs (sitemap, robots, OG, canonical) use **one** host consistently
- [ ] Share test: paste `/` into a link preview tool → correct title, description, 1200×630 image

**Content / links**
- [ ] A detail page shows real title + body in the HTML source (not the loading skeleton)
- [ ] Grep or crawl finds ≥ 1 internal `<a href>` to every indexed detail URL
- [ ] `/impact`, `/library`, `/researchers`, `/assistant` appear in footer and sitemap

**Structured data**
- [ ] Schema validator: `Organization` on `/` and `/about` (logo URL resolves 200), `WebSite` on `/` (no `SearchAction` unless `/search` is 200), `Article` + `BreadcrumbList` on a detail page — **no errors**
- [ ] No `FAQ`/`SearchAction`/`AggregateRating` markup without real matching content

**Field data (manual, GSC)**
- [ ] URL Inspection on `/` shows the expected title and "Indexed"
- [ ] Pages report: no spike in "Soft 404" or "Crawled - currently not indexed" for detail URLs
- [ ] Performance report: branded impressions for `LENS`/`lensbd` recorded vs. baseline captured in Stage 0

**Repo hygiene**
- [ ] `npx tsc --noEmit` → exit 0 (baseline passes)
- [ ] `npm test` → 31/31 (baseline passes)
- [ ] `npm run lint` → baseline is 75 problems; no *new* errors introduced
- [ ] `npm run build` → exit 0

---

## 22. Final Verdict

# TECHNICALLY INDEXABLE BUT SEO SIGNALS INCOMPLETE

**Why not `SEO BLOCKED`:** the blocking defect of Phases 11-12 is fixed and verified — Googlebot receives 200 on `/`, `/sitemap.xml`, and `/robots.txt`, `robots.txt` unambiguously allows `/`, the sitemap is declared, and GSC accepted the sitemap submission. Robots, proxy, and HTTP-level access are no longer preventing indexing.

**Why not `STRONG TECHNICAL SEO FOUNDATION`:** the brand's primary URL ships with **no title, no description, no canonical, no H1, and no content in HTML**; **no URL on the site declares a canonical**; the submitted sitemap contains **4 permanently dead URLs**; every DB-backed detail page returns **200 with an empty head and an empty body**; five detail families are **completely unlinked**; four section pages are **orphaned from nav, footer, and sitemap**; and the site's only entity markup points at a **404 logo**. A strong foundation does not have P0 defects on its most important templates.

**Why not `AUDIT INCONCLUSIVE`:** every claim above is backed by a live probe with a Googlebot UA or a source citation; the only unavailable evidence (GSC coverage/position/CWV) is explicitly quarantined in §16 as manual operator checks and is **not** used to justify the verdict.

**What this verdict means operationally:** Google can crawl and has been permitted to index LENS, but what it finds on the pages that matter does not carry the signals required to win branded queries. Completing the seven P0 items in §17 — starting with database recovery (P0-1) and homepage metadata/SSR (P0-2, P0-3) — plus the canonical/host and sitemap corrections (P0-4, P0-5) is the minimum needed to re-evaluate this verdict.

**No ranking outcome is guaranteed.** This audit makes no claim about position, traffic, or timeline; measurable success can only be assessed through the baseline-then-compare Search Console checks in §16.6 after remediation ships.

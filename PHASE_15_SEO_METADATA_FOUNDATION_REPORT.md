# PHASE 15 — SEO Metadata Foundation + Production DB Diagnosis: Implementation Report

**Mode:** CONTROLLED IMPLEMENTATION — Stage 0 + Stage 1 ONLY
**Date:** 2026-10-01
**Repository:** `D:\downloads\civic-youth-bangladesh\lens\lens_website`
**Verdict:** `PHASE 15 PARTIALLY VERIFIED — DB BLOCKED`

---

## 1. Executive Summary

Stage 0 (diagnosis only) and Stage 1 (metadata foundation) are complete.

- **Stage 0:** The production DB failure was investigated from the repository and live probes. The evidence does **not** permit naming a single root cause from this environment: `ROOT CAUSE NOT VERIFIABLE WITHOUT PRODUCTION LOGS / DATABASE ACCESS`. Six evidence-backed candidates (C1–C6, ranked, plus ruled-out causes), the exact production commands/log signatures needed, and the "can implementation continue" determination are in `PHASE_15_DB_DIAGNOSIS_REPORT.md`. **The production DB is not fixed and is not claimed to be fixed.**
- **Stage 1:** `src/app/layout.tsx` now provides the site-wide metadata foundation via the Next.js Metadata API: `metadataBase` pinned to `https://www.lensbd.org`, default title + `%s | LENS` template, a 160-character factual default description, Open Graph and Twitter defaults on the canonical `www` host. Duplicate raw `<meta>` tags (previously hardcoded AND emitted by the metadata API) were removed; `robots`, `author`, `publisher`, `keywords`, locale, and Google verification logic were preserved untouched.
- **Key finding during implementation:** a root-layout `alternates: { canonical: "/" }` **leaks to every child route** (verified: `/blog` and `/admin/login` both emitted `canonical = https://www.lensbd.org`, i.e. the homepage), which would instruct search engines to de-index all child pages. It was removed from the layout; the homepage now emits its own self-referencing canonical `https://www.lensbd.org/` via a minimal supporting helper, and child pages emit **no** canonical (safe default) until per-route metadata is owned by a later phase.
- All required verifications pass (tsc, tests, build, scoped lint, homepage HTML tags, child titles retained, robots/sitemap/proxy/auth untouched, git diff scope) and the full regression set passes (no hydration warnings, no console errors, desktop and mobile scroll work, no horizontal overflow).
- The verdict is **PARTIALLY VERIFIED** solely because Stage 0's DB root cause remains unverifiable without production access; Stage 1 itself is fully verified. Next phase: **`PHASE 16 — Production DB Resolution`** (evidence in §11).

---

## 2. Stage 0 DB Diagnosis

Full report: `PHASE_15_DB_DIAGNOSIS_REPORT.md` (7 parts: symptoms / source paths / confirmed candidates / unverifiable list / exact production commands / "can implementation continue" / no-credentials statement).

Summary of observed production symptoms (live probes, Googlebot UA, no credentials):

| Probe | Result |
|---|---|
| `GET /api/researchers` × 3 | **500** `{"error":"Failed to fetch researchers"}` — 3.248s / 0.733s / 0.927s total; connect 0.317/0.126/0.022s (fast failure, **not** a connect-timeout) |
| `GET /api/admin/settings` (unauthenticated) | **500** — deployed route has no auth, so this is a pure DB-query failure pre-auth |
| `GET /api/admin/search?q=a` (unauthenticated) | 401 (auth path works) |
| DB detail pages (`/blog/<slug>`, …) | 200 with **empty `<title>`** + 67-char loading skeleton |
| `GET /sitemap.xml` | 200, still serving the **4 hardcoded fallback research slugs** |
| `GET /api/health` | **404** — route exists locally but is **untracked**, proving production runs the committed state (`e4d24b5`), not the working tree |

Leading candidates (all confirmed as repo facts; none provable as *the* cause without production logs): **C1** deployed `e4d24b5` schema provider = `sqlite` while `PRODUCTION_CHECKLIST.md` §1 mandates `postgresql://`; **C2** 9 of 34 models (`blog_posts`, `careers`, `media_items`, `menu_items`, `pages`, `page_sections`, `programs`, `resources`, `site_settings`) have no `CREATE TABLE` in any migration (25 tables exist); **C3** production runs pre-migration code (untracked migrations/env/health route); **C4** `DATABASE_URL` may be a `file:` SQLite value; **C5** provisioning hygiene gaps (no `migration_lock.toml`, duplicate migration timestamps, no `postinstall: prisma generate`, no production client caching); **C6** deployed `/api/admin/settings` has no auth (flagged only, unchanged).

Ruled out by evidence: gateway/robots blocking (Vercel, 500 not 403/429), slow/unreachable network, auth-only failure.

Determination: **implementation can safely continue** — `src/app/layout.tsx` has no DB dependency; Stage 1 introduces no error-swallowing and does not mask the DB failure in any way.

---

## 3. Confirmed vs Unverified Findings

**Confirmed (repo/production verified):**
- Production DB-backed endpoints fail: 500s / empty metadata / sitemap fallback (probed live, timings above).
- Deployed commit is `e4d24b5`-state code: schema provider `sqlite`, no `/api/health`, no admin-auth on settings.
- 9/34 models lack `CREATE TABLE` anywhere in migrations; `migration_lock.toml` absent; two migrations untracked.
- Local `.env` has exactly `DATABASE_URL` (`file:` scheme), `JWT_SECRET`, `NEXT_PUBLIC_SITE_URL` (key names only inspected; no values printed).
- Layout-level `alternates: { canonical: "/" }` inherits to child routes (verified leak before removal).
- After the fix: homepage emits exactly one canonical `https://www.lensbd.org/`; `/about`, `/research`, `/blog`, `/admin/login` emit none; child page titles/descriptions intact.
- `src/proxy.ts`, `src/app/robots.ts`, `next.config.ts` show **no diff**; auth/API authorization untouched by this phase.

**Unverified (explicitly not claimed):**
- The production root cause itself — requires Vercel logs, env-var scheme check, and `prisma migrate status` (exact commands in `PHASE_15_DB_DIAGNOSIS_REPORT.md` §5): `ROOT CAUSE NOT VERIFIABLE WITHOUT PRODUCTION LOGS / DATABASE ACCESS`.
- Production `DATABASE_URL` existence/scheme, applied migrations, actual Prisma error code, generated-client provider on the deployed build.
- Production `NEXT_PUBLIC_SITE_URL` **host** (must be `lensbd.org`/`www.lensbd.org`, not `lens.org.bd`). Defense added: `resolveBaseUrl()` never emits the legacy host regardless of the env value.
- GSC/CrUX field data (manual operator checks only). No ranking claims are made anywhere in this phase.

---

## 4. Files Changed

Phase 15 touched exactly four files (this session's edits; the working tree contains many pre-existing modifications from earlier phases that were **not** touched here):

| File | Change |
|---|---|
| `src/app/layout.tsx` | **Modified** — `git diff --stat`: `75`-line diff, `68 insertions(+), 7 deletions(-)` |
| `src/components/HomeCanonical.tsx` | **Created** — small supporting metadata helper (allowed by brief: "optionally a small supporting metadata helper if truly necessary") |
| `PHASE_15_DB_DIAGNOSIS_REPORT.md` | **Created** — Stage 0 report (7 required parts) |
| `PHASE_15_SEO_METADATA_FOUNDATION_REPORT.md` | **Created** — this report (11 required sections) |

No other file was modified by Phase 15. In particular: `src/app/page.tsx` unchanged (still `"use client"`, all `dynamic(..., { ssr: false })` intact), no Three.js/GlobeNetwork/MediaIntelligenceMap/Lenis/GSAP/ScrollTrigger/scroll-activity/FocusAreas changes, no sitemap, structured data, i18n, DNS, or hosting changes.

---

## 5. Metadata Changes

All site-wide defaults now come from a single `export const metadata` in `src/app/layout.tsx` (Next.js Metadata API):

- **`metadataBase`:** `new URL(resolveBaseUrl())` → always `https://www.lensbd.org`.
- **Title:** `{ default: "LENS — Lighthouse for Evolving Narrative Systems", template: "%s | LENS" }` — child pages keep their own titles and gain the `| LENS` suffix; pages with no title fall back to the default.
- **Description:** `"LENS — Lighthouse for Evolving Narrative Systems — evidence-based research on media literacy, press freedom, narrative analysis and cybersecurity in Bangladesh."` (exactly 160 characters, factual, no keyword stuffing).
- **Open Graph defaults:** `type: "website"`, `siteName`, `title`, `description`, `url: "/"`, image `/og?title=LENS&subtitle=Lighthouse+for+Evolving+Narrative+Systems` (1200×630, the existing dynamic `/og` route — unchanged).
- **Twitter defaults:** `card: "summary_large_image"`, `creator: "@lensorgbd"` (existing handle, not invented), `title`, `description`, same image.
- **Removed duplicates:** raw `<meta property="og:site_name">`, `og:image` (+ width/height), `twitter:card`, `twitter:creator` tags — previously emitted twice (raw tag + metadata API). Also removed the legacy `BASE_URL = … || "https://lens.org.bd"` constant that could leak the legacy host.
- **Preserved untouched:** `robots`/`googlebot`, `author`, `publisher`, `keywords`, `og:locale`, `og:locale:alternate`, Google site-verification conditional, all CSP/security headers (in `next.config.ts`, unmodified).
- **Canonical:** root-layout `alternates` deliberately **absent** (see §6). `src/components/HomeCanonical.tsx` is a 3-line client component (`usePathname`) rendered once inside `<head>`: it emits `<link rel="canonical" href="https://www.lensbd.org/">` **only when `pathname === "/"`**, and `null` on every other route.

Homepage `<head>` as served locally (Googlebot UA, single occurrences of every tag):

```
<title>LENS — Lighthouse for Evolving Narrative Systems</title>
<meta name="description" content="LENS — … in Bangladesh.">            (160 chars)
<link rel="canonical" href="https://www.lensbd.org/">
<meta property="og:title" …> <meta property="og:description" …>
<meta property="og:url" content="https://www.lensbd.org">
<meta property="og:type" content="website">  <meta property="og:site_name" …>
<meta property="og:image" content="https://www.lensbd.org/og?title=LENS&…">  (1200×630)
<meta name="twitter:card" content="summary_large_image">  twitter:title / twitter:description / twitter:image / twitter:creator="@lensorgbd"
```

---

## 6. Canonical Host Decision

- **Canonical host:** `CANONICAL_HOST = "www.lensbd.org"`. `resolveBaseUrl()` reads the existing `NEXT_PUBLIC_SITE_URL` convention but only accepts it when its hostname is `lensbd.org` or `www.lensbd.org`, normalizing either to `https://www.lensbd.org`. Any other, unset, or malformed value falls back to `https://www.lensbd.org` — **never** to the legacy `https://lens.org.bd` host. No competing hosts are hardcoded; the apex → www 308 redirect (`src/proxy.ts`, Phase 12) was not touched.
- **Homepage canonical:** `https://www.lensbd.org/` (with trailing slash, as required).
- **Deviation, with evidence:** the brief asked to use the metadata API for canonicals and not to build a custom system "unless necessary." It was necessary. Setting `alternates: { canonical: "/" }` on the root layout — the natural Metadata-API approach — was implemented first and then **tested**: child routes inherited it, so `/blog` (title `Blog | LENS`) and `/admin/login` both served `<link rel="canonical" href="https://www.lensbd.org">`, i.e. every page canonicalized to the homepage. Shipping that would de-index all child pages. Because `src/app/page.tsx` cannot export metadata (it is a client component, protected by this phase's homepage constraint) and the root layout cannot know the current pathname through the Metadata API, the smallest safe mechanism is the homepage-scoped helper in §5. Per-page canonicals (children currently emit none — the safe default: Google then treats each page as its own canonical) belong to the phase that gives each route ownership of its metadata.
- **Minor noted inconsistency (not a blocker):** `og:url` renders as `https://www.lensbd.org` (no trailing slash) while the canonical is `https://www.lensbd.org/`. Both resolve to the same document; both are on the canonical `www` host, so verification item 8 ("canonical URLs use `https://www.lensbd.org/...`") holds. No redirect behavior was changed.

---

## 7. Verification Results

| # | Requirement | Result |
|---|---|---|
| 1 | `npx tsc --noEmit` | **PASS** — exit 0, no errors |
| 2 | `npm test` | **PASS** — 7 files, **31/31** tests (vitest) |
| 3 | `npm run build` | **PASS** — exit 0; all routes generated; `sitemap.xml`/`robots.txt` still built |
| 4 | `npx eslint src/app/layout.tsx` (scoped) | **PASS** — 0 errors; only the 3 pre-existing warnings (`Script`, `Header`, `Footer` unused imports, present before this phase). Full-repo lint baseline (75 problems / 33 errors) unchanged |
| 5 | Start app locally | **PASS** — `next start -p 3111`; local `src/proxy.ts` blocks default curl UA (403 by design), so all checks used the Googlebot UA |
| 6 | Homepage HTML tags | **PASS** — `<title>`, `meta[name=description]`, `canonical`, `og:title`, `og:description`, `og:url`, `og:type`, `og:site_name`, `og:image`, `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`, `twitter:creator` all present, each exactly once |
| 7 | Child titles/descriptions retained | **PASS** — `/about` → `About LENS — Our Mission, Values & Team \| LENS`; `/research` → `Research & Insights \| LENS`; `/blog` → `Blog \| LENS`; `/admin/login` → default title; each keeps its own page description (e.g. /about `Learn about LENS, a research-driven think tank…`) |
| 8 | Canonical URLs use `https://www.lensbd.org/…` | **PASS with documented scope** — homepage canonical `https://www.lensbd.org/` ✓; `/about`, `/research`, `/blog`, `/admin/login` emit **no** canonical (intentional — leak evidence and rationale in §6); no page anywhere emits a `lens.org.bd` canonical/og:url |
| 9 | No accidental change to `/robots.txt`, `/sitemap.xml`, `src/proxy.ts`, authentication, API authorization, visual components | **PASS** — `git diff --stat -- src/proxy.ts src/app/robots.ts next.config.ts` → empty; `src/proxy.ts` and `src/app/robots.ts` are not in `git status` at all; `/robots.txt` and `/sitemap.xml` both serve 200 locally with unchanged rules (`Disallow: /api/ /admin/ /_next/ /private/ /og`, bot blocks); `src/app/sitemap.ts` carries only its **pre-existing** modification from an earlier phase (this session edited only `layout.tsx` + created `HomeCanonical.tsx`); admin auth files not edited in this session; no visual component touched |
| 10 | Git diff scope | **PASS** — Phase 15 files: `src/app/layout.tsx` (M, +68/−7), `src/components/HomeCanonical.tsx` (new), `PHASE_15_DB_DIAGNOSIS_REPORT.md` (new), this report (new). No dozens of unrelated files |

---

## 8. Regression Results

Verified in a headless browser (Playwright-based) against the production build served locally; the project's prior hydration/scroll fixes were deliberately not re-optimized.

| Check | Result |
|---|---|
| No new hydration warnings | **PASS** — zero hydration/React mismatch messages across homepage, `/about`, desktop and mobile runs |
| No new browser console errors | **PASS** — **0 console errors**. Only pre-existing infrastructure warnings remain: `Permissions-Policy header: Unrecognized feature: 'join-ad-interest-group'` / `'run-ad-auction'` (from the existing `next.config.ts` headers, present before this phase) |
| Homepage still loads | **PASS** — HTTP 200; `<h1>` mounts; `body.innerText` 4,202 chars desktop / 4,029 chars mobile (SSR-bailout body gap is the pre-existing, separately-scoped homepage issue, unchanged by this phase) |
| Desktop scroll works | **PASS** — 1280×800 viewport, `window.scrollY` 0 → 800 after scroll (Lenis/ScrollTrigger pipeline intact) |
| Mobile scroll works | **PASS** — 390×844 viewport, `window.scrollY` 0 → 600 after scroll |
| No horizontal overflow | **PASS** — desktop `scrollWidth == clientWidth == 1280`; mobile `scrollWidth == clientWidth == 390` |
| Canonical sanity under hydration | **PASS** — exactly **1** `<link rel="canonical">` on the homepage after hydration, `https://www.lensbd.org/`; **0** on child pages; no failed network requests (0) |

---

## 9. Git Diff Summary

Phase 15 delta (this session):

```
src/app/layout.tsx                    | 75 +++++++++++++++++++++++++++++++++++++++++++++++++-----
  1 file changed, 68 insertions(+), 7 deletions(-)
?? src/components/HomeCanonical.tsx                    (new, 21 lines)
?? PHASE_15_DB_DIAGNOSIS_REPORT.md                     (new, Stage 0)
?? PHASE_15_SEO_METADATA_FOUNDATION_REPORT.md          (new, this report)
```

- The `layout.tsx` diff is additive metadata plus deletions of the duplicate raw tags and the legacy `BASE_URL` fallback; no header/CSP/security code changed inside it.
- `git status` shows ~45 other modified files and ~20 untracked entries — **all pre-existing** from earlier phases (e.g. the postgres schema flip, admin auth, `src/lib/env.ts`, migrations). Phase 15 neither staged, edited, nor reverted any of them.
- Not modified: `src/app/page.tsx`, `src/app/sitemap.ts` (this session), `src/app/robots.ts`, `src/proxy.ts`, `next.config.ts`, `prisma/**`, `package.json`, `vercel.json`.
- Nothing was committed (no commit was requested).

---

## 10. Remaining SEO Blockers

Ordered by impact; items 1–3 are the P0/P1 carried from `PHASE_14_LENS_BRAND_SEO_AUDIT.md` plus this phase's findings:

1. **Production DB failure (P0, unverified root cause).** `/api/researchers` → 500; every DB detail page serves an **empty `<title>`** and a skeleton body; the sitemap serves only the 4 hardcoded fallback research slugs. This blocks indexability of all DB-backed content regardless of how good the metadata foundation is. Commands/log signatures to resolve it: `PHASE_15_DB_DIAGNOSIS_REPORT.md` §5.
2. **Homepage SSR bailout (P1).** The homepage's initial HTML contains the (now correct) head metadata but only ~20 visible body characters — body content arrives via client render. Explicitly out of scope this phase; belongs to the homepage SSR conversion phase.
3. **Per-page canonicals and per-page OG (P1).** Children emit no canonical and inherit site-wide `og:title`/`og:description`/`og:url` (this phase's specified site-wide defaults). Safe today, but incomplete; needs a per-route metadata pass (homepage-owned canonical already done).
4. **Structured data / JSON-LD (P1).** Not implemented (prohibited this phase).
5. **Production `NEXT_PUBLIC_SITE_URL` host (P1, unverified).** If it is the legacy `lens.org.bd`, every previously hardcoded absolute URL outside layout still uses it; `resolveBaseUrl()` neutralizes the layout, but the env host should be confirmed in Vercel (host only).
6. **Sitemap correctness (P2).** DB-driven slugs can't be validated until the DB serves them; the 4 fallback slugs must be re-checked after Phase 16.
7. **GSC/CrUX field data (P2).** Not accessible from this environment — manual operator verification required. No ranking claims made.

---

## 11. Recommended Next Phase

**Verdict: `PHASE 15 PARTIALLY VERIFIED — DB BLOCKED`**

- Stage 1 (metadata foundation) is complete and fully verified: tsc 0, tests 31/31, build 0, scoped lint 0 errors, homepage tag set complete, child titles intact, robots/sitemap/proxy/auth untouched, git diff scoped to 4 expected files, full regression set green.
- Stage 0 could not confirm the production root cause from the repository alone (`ROOT CAUSE NOT VERIFIABLE WITHOUT PRODUCTION LOGS / DATABASE ACCESS`). The database therefore remains broken and unverified — this is the "BLOCKED" component of the verdict, and the reason it is **PARTIALLY** verified rather than `PHASE 15 VERIFIED`. It is not `PHASE 15 BLOCKED` because Stage 1 required no DB assumption and succeeded on every check.
- The production DB is **not** fixed, and no code change in this phase hides, masks, or swallows the failure.

**Next phase: `PHASE 16 — Production DB Resolution`** (chosen from evidence, not assumption):

1. The single highest-impact open item (§10.1) is the DB failure — it produces 500s, empty titles on every DB detail page, and sitemap fallback content. Nothing else in the SEO chain can be validated while it persists.
2. Sitemap integrity is **DB-dependent**: the sitemap's research slugs come from `db.researchArticle.findMany` with a hardcoded fallback, so a sitemap audit now would only measure the fallback. Running `PHASE 16 — Sitemap Integrity` first would certify stale/incorrect data.
3. Stage 0 already produced the exact operator runbook (`PHASE_15_DB_DIAGNOSIS_REPORT.md` §5: Vercel source-commit, runtime log signatures for `P1012`/`P1001`/`P2021`/protocol mismatch, env-scheme checks, `prisma migrate status`, table listing), so Phase 16 can begin without re-diagnosis.
4. The metadata foundation just delivered is DB-independent and stable, so it will not be disturbed by the DB work.

Re-evaluate the sitemap question immediately **after** the DB serves real data; at that point `PHASE 16 — Sitemap Integrity` becomes the natural `PHASE 17`.

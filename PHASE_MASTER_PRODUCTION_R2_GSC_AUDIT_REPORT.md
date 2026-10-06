# MASTER PRODUCTION READINESS AUDIT — LENS Website (R2 + GSC + Full Stack)

**Mode:** READ-ONLY AUDIT. No source, schema, migration, env, config, or package change. No DB mutation. No deploy. No commit. No push.
**Date (UTC):** 2026-10-01
**Repository:** `D:\downloads\civic-youth-bangladesh\lens\lens_website`
**Auditor method:** direct file reads + safe read-only commands (`git`, `curl -I`, `npx tsc --noEmit`, `npm test`, live HTTPS GET of public endpoints). No secret was read, printed, or invented. Local `.env` inspected for **key names only**.

**Status vocabulary used in this report:**
`VERIFIED` = observed in this audit · `PARTIALLY VERIFIED` = observed in part or via prior-phase evidence re-checked against current tree · `NOT VERIFIED` = no evidence · `BLOCKED` = evidence unobtainable without access/credentials · `UNKNOWN` = genuinely unknown · `NOT IMPLEMENTED` = absent from code · `IMPLEMENTED BUT NOT LIVE-VERIFIED` = code exists, no live proof.

---

## 0. EXECUTIVE SUMMARY

1. **Current overall state:** The site serves real traffic on `https://www.lensbd.org/` (commit `965f0b6`, Production, Vercel build success) with correct homepage metadata, but **every database-backed feature fails in production** because Vercel Production has **no `DATABASE_URL`** (proven by the Phase 17 supplied runtime log: `PrismaClientInitializationError / Environment variable not found: DATABASE_URL / schema.prisma:7 / provider = "sqlite"`). The project is **NOT production-ready**.
2. **Biggest blocker:** Production has no database configuration at all — no `DATABASE_URL`, deployed schema provider still `sqlite` at HEAD, and the migration history additionally cannot provision a fresh PostgreSQL database (broken ordering + 9 missing tables). Nothing downstream (auth, uploads registry, AI/RAG, sitemap DB URLs, backups) can go live before this.
3. **R2 status:** Backup-to-R2 code is complete and unit-tested (mocked), but **zero live verification** exists: no credentials anywhere, no bucket proven, media uploads do not use R2 at all, scheduling workflow is uncommitted, `vercel.json` crons are empty. → `IMPLEMENTED BUT NOT LIVE-VERIFIED`, production readiness `BLOCKED`.
4. **Google Search Console / indexing status:** Crawl access is fixed and VERIFIED live (Googlebot-equivalent fetch returns 200 + full metadata; `robots.txt` 200 Allow; `sitemap.xml` 200 with 18 URLs). Homepage metadata/canonical regression from Phase 14 is FIXED and live. But **no private Search Console account data was available to this audit**, so coverage/indexing state (`Indexed` vs `Crawled - currently not indexed`, sitemap submission/discovery, last crawl) is `UNKNOWN`. Do not confuse the old brief's "GSC submission = SUCCESS" hearsay with observed account data.
5. **SEO status:** Foundation fixed and live (title, description, OG/Twitter, www canonical on homepage, `metadataBase` pinned to www). Remaining: homepage has **no SSR body content** (still `use client` + all `ssr:false`, `BAILOUT_TO_CLIENT_SIDE_RENDERING` verified live), sitemap serves **apex-host URLs + 4 fallback research slugs** (verified live), child-page canonicals/structured-data/internal-linking incomplete.
6. **DB status:** `BLOCKED`. Provider flip + 2 migrations + health route + env helper all exist only as **uncommitted working-tree changes** (46 modified files); HEAD still ships `sqlite`. Migration history is a proven non-DAG with 9/34 tables missing. No production database existence is proven.
7. **Security status:** Fail-closed patterns VERIFIED in working-tree code (JWT/CRON/DATABASE_URL, cron Bearer, upload auth+allowlist, AI ownership, rate limits, security headers). Deployed HEAD lags the working tree (e.g. unauthenticated settings GET per Phase 16). Full live security matrix NOT VERIFIED (production DB down blocks authenticated testing).
8. **Next safest phase:** **PHASE 19 — Production PostgreSQL provisioning + `DATABASE_URL` proof (read-only acceptance).** Details in §21.

---

## 1. CHANGE CONTROL — BASELINE (before audit work)

| Item | Value (observed this audit) |
|---|---|
| Branch | `main` (`git branch --show-current`) |
| HEAD | `965f0b65d8d3b303ae6256ac231bfcccaa842724` — `Add SEO metadata foundation and DB diagnosis` (2026-10-01) |
| Remote | `origin` → `https://github.com/kamalforhad-glitch/LENS-platform.git` |
| Unpushed commits (`origin/main..HEAD`) | **0** — VERIFIED (`git log origin/main..HEAD` empty) |
| Stash | empty — VERIFIED |
| Staged files | **0** — VERIFIED (`git diff --cached --name-only` empty) |
| Unstaged (modified) files | **46** — VERIFIED (`git diff --name-only` count = 46; `--stat` = 1553 insertions, 427 deletions) |
| Untracked entries | `.github/workflows/` (2 files), 18 phase/scroll/perf `*.md` reports, `PRODUCTION_CHECKLIST.md`, 2 migration dirs, `src/app/api/health/`, 7 test files, `src/lib/backup/r2.ts`, `src/lib/env.ts`, `src/lib/schemas.ts`, `src/lib/scroll-activity.ts`, `vitest.config.ts` |
| Recent commits | `965f0b6` (HEAD) · `e4d24b5` Fix crawler access for SEO routes · `5a107ec` focus cards layout · `650c006` Initial LENS platform commit · `78a47f5` Create Next App |
| Latest known production commit | `965f0b6` — VERIFIED via GitHub Deployments API in Phase 16/17 (environment=Production, 2026-10-01T07:45:24Z, Vercel build success); corroborated this audit by live HTML containing Phase-15-only markers (`<link rel="canonical" href="https://www.lensbd.org/">`, em-dash title) |
| `.gitignore` | `.env*` and `*.db` ignored — VERIFIED (local `.env`, `prisma/dev.db` never deployed) |
| Local `.env` keys (names only) | `DATABASE_URL`, `JWT_SECRET`, `NEXT_PUBLIC_SITE_URL` (3 keys; no values read) |

> All 46 modified + all untracked entries are **pre-existing user work** (identical in shape to the Phase 16/17/18 baselines). This audit changed none of them.

---

## 2. REPOSITORY STRUCTURE AUDIT (actual tree, not inherited claims)

### 2.1 Versions — VERIFIED (`package.json` read this audit)

| Package | Version |
|---|---|
| Next.js | `16.3.8` |
| React / React-DOM | `19.2.8` |
| TypeScript | `^5` (dev) |
| Prisma (`prisma` + `@prisma/client`) | `^6.0.0` (installed 6.19.3 per Phase 18 evidence; not re-printed this audit) |
| `@aws-sdk/client-s3` / `s3-request-presigner` | `^3.800.0` (used as R2 transport + S3 uploads) |
| OpenAI SDK | `^7.20.0` |
| three / @react-three/fiber / drei | `^0.186.0` / `^9.7.0` / `^10.7.8` |
| GSAP | `^3.15.0` |
| lenis (smooth scroll) | `^1.3.26` |
| Sentry (`@sentry/nextjs`) | `^10.75.1` (client+server configs present) |
| i18n (`i18next`, `react-i18next`, `next-i18next`) | present; locales `en`/`bn` |
| zod / bcryptjs / jsonwebtoken / resend / sharp / uuid | present |
| vitest | `^3.2.7` (dev); eslint `^9` + `eslint-config-next` 16.3.5 |

### 2.2 Architecture — VERIFIED by file reads

| Layer | Implementation (file) | Status |
|---|---|---|
| Framework | Next.js App Router (`src/app/*`, 21 public route dirs) | VERIFIED |
| DB layer | Single `PrismaClient` in `src/lib/db.ts` (+ `slugify`); no pooling/Accelerate; `globalThis` cache only in non-production | VERIFIED |
| Env fail-closed helper | `src/lib/env.ts` (`getJwtSecret`, `getCronSecret`, `requireDatabaseUrl`, build-phase placeholders) — **untracked, NOT deployed** | IMPLEMENTED BUT NOT LIVE-VERIFIED |
| AuthN | JWT (24h) in httpOnly `lens-session` cookie, `bcryptjs`, DB-backed `Session` (`src/lib/auth.ts`) | VERIFIED (code) |
| AuthZ/RBAC | `requireAuth/requireAdmin/requireEditor`, hierarchy admin(3)>editor(2)>viewer(1) | VERIFIED (code) |
| Edge/middleware | `src/proxy.ts` (Next 16 convention): API rate limit 30/min, bot blocklist w/ crawler allowlist, `/admin` redirect gate, security headers, cache rules | VERIFIED |
| HTTP headers | Duplicated in `next.config.ts` (CSP, HSTS, X-Frame-DENY, etc.) + `proxy.ts` | VERIFIED |
| Storage (media) | `src/lib/storage/index.ts`: generic S3-compatible (`S3_*`) or local `public/uploads` fallback; allowlist + size limits; signed PUT URLs | VERIFIED (code) |
| Storage (backups) | `src/lib/backup/r2.ts`: R2-specific (`R2_*`), fail-closed; wired into `src/lib/backup/index.ts` (`createBackup`/`restoreBackup`/`downloadBackup`, `pg_dump`/`psql` via `execFile` no-shell, retention sweep) | IMPLEMENTED BUT NOT LIVE-VERIFIED |
| Upload API | `src/app/api/upload/route.ts`: 401 anon, 403 viewer, type+size validation, S3-or-local write, DB log | VERIFIED (code) |
| Cron backup API | `src/app/api/cron/backup/route.ts`: 503 without `CRON_SECRET`, 401 wrong Bearer | VERIFIED (code) |
| Scheduling | `vercel.json` → `"crons": []` (EMPTY, working tree); `.github/workflows/backup.yml` (correct Bearer-curl design) is **untracked → not active** | NOT IMPLEMENTED (live scheduling) |
| Health | `src/app/api/health/route.ts` (app/db/storage/email/ai/cron checks) — **untracked, NOT deployed** (`/api/health` → 404 in production) | IMPLEMENTED BUT NOT LIVE-VERIFIED |
| AI/RAG | `src/lib/ai/index.ts` (chunk→embed→pgvector `<=>` search→`gpt-4o-mini` w/ retrieval fallback, in-memory rate limit, injection patterns) + `src/app/api/ai/chat/route.ts` (ownership-checked POST/GET) + `src/app/api/ai/index/route.ts` + admin stats/index routes | VERIFIED (code) |
| Admin UI | `src/app/admin/*` (21 sections: dashboard, pages, research, review, authors, publications, programs, blog, media-items, events, resources, careers, team, media, menus, seo, contact, analytics, ai, impact, backups) + client-side auth-gate layout | VERIFIED (exists) |
| Public pages | about, assistant, blog, careers, contact, events, impact, library, media, og, partnerships, privacy, programs, publications, research, researchers, resources, terms (+ home) | VERIFIED |
| API routes | 34 `route.ts` files (academic×3, admin×13, ai×2, analytics×4, auth, contact, cron, health, newsletter, researchers, search×2, upload) | VERIFIED |
| SEO | root `metadata` (`src/app/layout.tsx`, committed in HEAD), `HomeCanonical`, `sitemap.ts`, `robots.ts`, `SchemaOrg.tsx`, `/og` image route | VERIFIED (code); foundation live |
| i18n | `I18nProvider` client-side `react-i18next`, single URL, `og:locale:alternate bn_BD` w/o alternate URLs | VERIFIED |
| Tests | vitest, 7 files / **31 tests — all PASS re-run this audit** | VERIFIED |
| CI | `.github/workflows/ci.yml` (lint+tsc+test+build, synthetic pg URL) — **untracked → not running** | NOT IMPLEMENTED (live) |
| Observability | Sentry configs present; no DSN proven in production; no uptime/error-tracking dashboard evidence | NOT VERIFIED |

---

## 3. MASTER MISSING-FEATURE INVENTORY

| Area | Requirement | Current State | Evidence | Priority | Blocker |
|---|---|---|---|---|---|
| PostgreSQL | Provisioned production Postgres w/ `vector`+`pg_trgm` | NOT VERIFIED / UNKNOWN existence | Phase 18 §12–15; no vendor anywhere in repo | P0 | YES |
| `DATABASE_URL` (prod) | Present in Vercel Production | MISSING — VERIFIED (runtime log via Phase 17) | `PrismaClientInitializationError / Environment variable not found: DATABASE_URL` | P0 | YES |
| Prisma provider | `postgresql` deployed | NOT IMPLEMENTED live (HEAD=`sqlite`, working tree=`postgresql` uncommitted) | `git show HEAD:…` vs working tree, re-checked this audit | P0 | YES |
| Migrations | History provisions fresh PG | NOT IMPLEMENTED (non-DAG; #1 fails deterministically) | Phase 18 §5; files re-listed this audit (6 dirs, no lockfile) | P0 | YES |
| Missing tables | 9 models w/o `CREATE TABLE` | NOT IMPLEMENTED | Phase 16 §9 repro + Phase 18 §8; schema re-read (34 models) | P0 | YES |
| Missing column/FK/index | `author_articles.researcher_profile_id` + FK + index; `backup_records_storage_idx` drift | NOT IMPLEMENTED | Phase 18 §7 | P0 | YES (column/FK) |
| `migration_lock.toml` | Tracked w/ `provider="postgresql"` | NOT IMPLEMENTED (absent, never tracked) | dir listing this audit | P1 | no (hygiene) |
| Authentication | Working login/sessions in prod | BLOCKED (DB down; code VERIFIED) | live login probe fails (Phase 16 §4.1) | P0 | YES (via DB) |
| RBAC | Enforced on all admin APIs | PARTIALLY VERIFIED (code in working tree; deployed HEAD lacked settings-GET auth) | `backup/route.ts` read; Phase 16 §4 | P0 | YES (verify live post-DB) |
| API security | 401/403 matrix, IDOR, SQLi-safe | PARTIALLY VERIFIED (code patterns good; live matrix not runnable) | `upload`, `ai/chat`, `cron/backup` reads | P1 | DB |
| Uploads | Durable media storage | NOT IMPLEMENTED live (local `public/uploads` fallback is ephemeral on serverless; `S3_*` unset) | `storage/index.ts` + `upload/route.ts` + `health` degraded | P0 | YES |
| Cloudflare R2 | Live bucket + creds + objects | NOT IMPLEMENTED live (code only) | §5 matrix; `.env` has no `R2_*` keys | P0 | YES |
| Backups | Scheduled, R2-persisted, reported | IMPLEMENTED BUT NOT LIVE-VERIFIED (schedule untracked, crons empty) | `backup/index.ts`, `backup.yml`, `vercel.json` | P0 | YES |
| Restore | Proven DB restore | NOT IMPLEMENTED (code only, never executed) | `restoreBackup` read; no drill evidence | P0 | YES |
| Cron | Authenticated schedule | NOT IMPLEMENTED live | `vercel.json` empty; workflow untracked | P0 | YES |
| AI/RAG | Live answers over indexed corpus | BLOCKED (needs DB+pgvector+`OPENAI_API_KEY`) | `ai/index.ts`; fallback-only without key | P1 | YES |
| pgvector | Extension + HNSW + embeddings | NOT VERIFIED live | Phase 18 §11; local server lacks `vector` | P0 | YES |
| Search | Full-text + trigram library search | BLOCKED (needs PG + GIN/trgm indexes) | `library.ts` per Phase 18; indexes in unapplied migration | P1 | YES |
| SEO foundation | Title/desc/OG/canonical | VERIFIED live (homepage) | live HTML this audit | — | no |
| SSR body content | Indexable homepage HTML | NOT IMPLEMENTED (client-only, BAILOUT verified live) | `page.tsx` + live flight data | P1 | no (indexing risk) |
| Metadata (children) | Per-route titles/canonicals | PARTIALLY VERIFIED (listing pages static; detail rely on DB) | Phase 14/15 | P1 | DB |
| Canonical/host | Single declared host | PARTIALLY VERIFIED (www canonical + metadataBase live; sitemap/robots still apex) | live sitemap/robots/HTML | P1 | no |
| Sitemap | DB-driven, all-www URLs | NOT IMPLEMENTED live (fallback slugs, apex host, build-time) | live `sitemap.xml` (18 URLs, 4 fallbacks) | P1 | DB |
| robots.txt | Correct + consistent sitemap host | PARTIALLY VERIFIED (allows `/`, blocks bots/AI crawlers; sitemap URL on apex not www) | live `robots.txt` | P2 | no |
| Structured data | Org/WebSite/Article/Breadcrumb | PARTIALLY VERIFIED (components exist; only Org on /about + Event on /events wired) | `SchemaOrg.tsx` grep | P1 | no |
| Internal links | Detail pages reachable | NOT IMPLEMENTED (detail URLs orphaned per Phase 14; not re-swept) | Phase 14 §2 | P1 | no |
| Google indexing | Pages indexed | UNKNOWN (no GSC account access) | §7 | P1 | time/crawl |
| Search Console | Verified property + reports | UNKNOWN (account data unavailable) | §7 | P1 | access |
| Performance | Benchmarks/budgets | NOT VERIFIED (no Lighthouse/CWV this audit; heavy client stack noted) | `page.tsx` dynamic list; prior perf reports only | P1 | no |
| Accessibility | Full pass | PARTIALLY VERIFIED (skip link, landmarks observed; no full audit) | live HTML + layout | P2 | no |
| Mobile | Verified rendering | NOT VERIFIED this audit | — | P2 | no |
| Tests | Suite green | VERIFIED (7 files / 31 pass, re-run) | `npm test` this audit | — | no |
| CI/CD | Running checks + deploys | NOT IMPLEMENTED live (workflows untracked) | `.github/` untracked | P1 | no |
| Dependency security | Audit clean | NOT VERIFIED (no `npm audit` run; majors flagged in Phase 10) | — | P2 | no |
| ESLint | Clean | NOT VERIFIED this audit (Phase 16: 74 problems pre-existing) | Phase 16 §18 | P2 | no |
| Monitoring/alerts | Sentry/uptime live | NOT VERIFIED | configs exist, no DSN proof | P1 | no |

---

## 4. CLOUDFLARE R2 — FULL IMPLEMENTATION AUDIT

### 4.1 Files that implement R2 — VERIFIED by reads

- `src/lib/backup/r2.ts` (148 lines, untracked): `getR2Config` (null-if-unset, fail-closed throw naming vars only), `r2ObjectKey` (`backups/`+basename, traversal-safe), `r2PublicUrl`, `createR2Client` (region `auto`, S3-compatible endpoint), `uploadToR2`/`downloadFromR2`/`deleteFromR2`, `R2UploadError`.
- `src/lib/backup/index.ts` (working-tree modified): dump→stat→R2-upload→record(`storage:"r2"`, `remoteKey`, `remoteUrl`)→local-unlink; R2 failure marks backup `failed` (never false-success); `restoreBackup` R2→temp→`psql`; `downloadBackup` disk-then-R2; local retention (30 files / 30 records).
- `prisma/schema.prisma` (`BackupRecord`: `storage` default `"local"`, `remoteKey?`, `remoteUrl?` — secrets never stored) + `prisma/migrations/20261002_backup_r2_fields/migration.sql` (untracked, unapplied).
- `.env.example`: R2 section (6 vars, commented placeholders) + S3 section relabeled uploads-only.
- `src/lib/__tests__/r2.test.ts`: 9 mocked tests (null-config, fail-closed, endpoint derivation, key safety, URL building, upload ok/fail, download, client construction, no-leak) — all PASS this audit.

### 4.2 Thirty capability questions — answered from code

1. Code implemented? **YES — VERIFIED.** 2. Files? Above. 3. Used for uploads? **NO — VERIFIED** (`upload/route.ts` + `storage/index.ts` use `S3_*`/local only; zero `R2_` references outside backup). 4. Used for backups? **YES (code) — IMPLEMENTED BUT NOT LIVE-VERIFIED.** 5. Used for media? **NO.** 6. Storage abstraction? **PARTIAL** — two parallel seams (generic-S3 vs R2-specific), no unified interface. 7. Fallback? **YES explicit**: `storage:"local"` when R2 unconfigured; on R2 *failure* no silent fallback (correct). 8. Local FS still used? **YES** (`public/uploads`, `backups/`). 9. Vercel FS relied upon? **YES — defect**: local uploads/backups are ephemeral on serverless; documented in code comments. 10. Fail-closed? **YES — VERIFIED.** 11. Env documented? **YES** (`.env.example`). 12. Production vars present? **MISSING — VERIFIED** (no `R2_*` in local env key list; production env unreadable, CLI logged out; nothing committed). 13. Bucket configured? **MISSING.** 14. Public access? **UNKNOWN** (needs dashboard). 15. Private access? **UNKNOWN.** 16. Signed URLs? Media side has presigned-PUT helper (S3); R2 side uses plain Put/Get (no signed-URL flow) — **PARTIAL, by design for backups**. 17. Content-Type? **YES** (`application/sql` default; upload route passes `file.type`). 18. Size validated (uploads)? **YES** (10 MB images / 50 MB docs); backup size **not capped** (`MAX_BACKUP_SIZE_MB` declared but unenforced — minor gap). 19. Filename sanitized? **YES** (`generateStorageKey` + `basename`). 20. SVG restricted? **YES** (allowlist excludes `image/svg+xml`; test asserts) — but the upload error string wrongly lists "SVG" as allowed (cosmetic bug, `upload/route.ts:37`). 21. Upload authZ? **YES** (401 + 403 viewer). 22. Delete protected? **PARTIAL** — `deleteFromStorage` is a log-only stub; `deleteFromR2` exists but no caller enforces RBAC around it (admin backup delete path not found). 23. Backup upload? **Code YES / live NO.** 24. Retention (R2-side)? **NO** (local-only sweep; no lifecycle policy evidence). 25. Integrity verified? **NO** (no checksum/hash compare). 26. Restore? **Code YES / never executed.** 27. Restore tested? **NO** (no test, no drill). 28. Live connectivity? **NO.** 29. Real object round-trip? **NO.** 30. Production-ready or code-ready? **CODE-READY ONLY.**

### 4.3 R2 Status Matrix

| Capability | Code | Config | Live Verification | Status |
|---|---|---|---|---|
| R2 client | YES | MISSING vars | NO | IMPLEMENTED BUT NOT LIVE-VERIFIED |
| Media upload | NO (S3/local) | MISSING | NO | NOT IMPLEMENTED (for R2) |
| Media download | NO | MISSING | NO | NOT IMPLEMENTED |
| Media delete | stub only | — | NO | NOT IMPLEMENTED |
| Backup upload | YES | MISSING | NO | IMPLEMENTED BUT NOT LIVE-VERIFIED |
| Backup listing | YES (DB records) | — | NO | IMPLEMENTED BUT NOT LIVE-VERIFIED |
| Backup retention | local-only | — | NO | PARTIALLY VERIFIED (code) |
| Restore | YES (code) | MISSING | NO | IMPLEMENTED BUT NOT LIVE-VERIFIED |
| Signed access | partial (media S3 only) | — | NO | PARTIALLY VERIFIED |
| Security (fail-closed, traversal-safe, no leak) | YES (+9 tests) | — | NO | IMPLEMENTED BUT NOT LIVE-VERIFIED |
| Production credentials | — | MISSING | — | BLOCKED |
| Live test | — | — | NO | BLOCKED |

### 4.4 REQUIRED R2 ANSWER — "R2 implement koto dur hoice?"

No single percentage is honest across dimensions, so none is asserted as a headline. Objective derivation from the matrix (12 rows):

- **Code implementation: 7/12 capabilities present** (client, backup upload/listing/restore/download paths, fail-closed security, docs, mocked tests). Media-side R2, R2 retention, integrity, delete-RBAC absent by design/scope.
- **Configuration: 0/12 live** (all `R2_*` MISSING; bucket/dashboard state UNKNOWN).
- **Live verification: 0/12** (no real upload/download/delete ever observed).
- **Production readiness: BLOCKED** (not partial — without credentials, bucket, schedule, and a restore drill, nothing is operable).

Plain answer: **code ~done for backups, config zero, live proof zero — R2 is code-ready only and must not be called production-ready.**

---

## 5. BACKUP / RESTORE AUDIT

- Automated backup **code**: VERIFIED (`createBackup`, `pg_dump --format=plain` via `execFile`, email report via Resend-optional `sendBackupReport`).
- Actually scheduled? **NO — VERIFIED**: `vercel.json` crons `[]`; `backup.yml` untracked (never runs); cron route exists but nothing calls it.
- Vercel-cron compatible? **By design NO** — documented in `backup.yml` header: Vercel crons cannot attach the required Bearer header, so GitHub Actions is the intended scheduler (correct decision, but the workflow itself is uncommitted).
- Uploads to R2? Code-yes / live-no (§4).
- Live-tested? **NO.** Restorable? **UNKNOWN** (code path plausible; `psql` plain-format restore; temp-file cleanup; but zero drills, `pg_dump`/`psql` availability on the runner unproven).
- Retention: local 30 files + 30 records — VERIFIED code; R2-side: none. Encryption: none. Integrity: none. Failure handling: good (failed status, no false success, warn-and-continue cleanup). Notifications: email report only (Resend optional → dev-log fallback).
- Verdict: `IMPLEMENTED BUT NOT LIVE-VERIFIED` — **NOT production-ready**.

---

## 6. POSTGRESQL + PRISMA AUDIT (reconfirmed against current tree)

- Schema: 34 models, provider `postgresql` working-tree / **`sqlite` at HEAD (re-verified this audit)**; `Unsupported("vector(1536)")` pgvector field; 18 FK relations; string-typed statuses (no enums).
- Migrations: 6 dirs (4 tracked + 2 untracked), **no `migration_lock.toml` (re-verified absent)**, duplicate prefixes `20250101000000×2` + `20260921000000×2`, lexicographic order puts `add_pgvector` before `init` (forward dependency on `document_embeddings` from migration #3) → **fresh `migrate deploy` fails deterministically** (Phase 16 reproduced P3018; static analysis holds unchanged — files untouched since).
- Gaps (unchanged, files match Phase 18 hashes by inspection): **9 missing tables** (`pages`, `page_sections`, `site_settings`, `menu_items`, `programs`, `blog_posts`, `media_items`, `resources`, `careers`), **1 missing column** (`author_articles.researcher_profile_id` + FK + index), **1 drift index** (`backup_records_storage_idx` unrepresented in schema), PG-only DDL vs deployed sqlite.
- Production `DATABASE_URL`: **MISSING — VERIFIED** (Phase 17 runtime log). Production DB existence / data state: **UNKNOWN**. No mutation performed; `prisma validate` implicitly passed via green `tsc`/build path (Phase 16); not re-run with synthetic URL this audit (read-only `tsc`+tests were).
- **Current DB blocker (one line):** production has no database URL, the deployed build speaks sqlite, and even with a URL the history cannot provision or complete the schema — all three must be fixed in dependency order (§21).

---

## 7. GOOGLE SEARCH CONSOLE / GOOGLE INDEXING AUDIT

### 7.1 Live website evidence — VERIFIED this audit (public GETs, no credentials)

| Signal | Status | Evidence | Meaning |
|---|---|---|---|
| Googlebot access | VERIFIED (via prior Googlebot-UA probes + current structural state) | `proxy.ts` allowlists `googlebot`; Phase 16 Googlebot-UA `/` → 200 +Phase-15 metadata; curl-UA → 403 by design (re-observed: `curl -I https://www.lensbd.org/` → 403; apex → 308 www) | Crawlers allowed; default-curl 403 is intentional bot policy, not an outage |
| Homepage crawl | VERIFIED fetchable | This audit fetched `/` HTML (200): full `<title>`, description, OG/Twitter on www host, `rel=canonical https://www.lensbd.org/`, robots `index,follow` | Technically indexable |
| robots.txt | VERIFIED 200 | `Allow: /`, disallows `/api/ /admin/ /_next/ /private/ /og`, blocks GPTBot/ChatGPT-User/CCBot; `Sitemap: https://lensbd.org/sitemap.xml` (**apex**, not www) | Allows crawling; sitemap host inconsistent w/ canonical www |
| sitemap.xml | VERIFIED 200, 18 URLs | All `<loc>` on **apex** `https://lensbd.org` (not www); research entries = the **4 static fallbacks only**; `<lastmod>` = build timestamp `2026-10-01T07:44:58.173Z` (build-time DB branch) | Served but DB-dead: no real research URLs; apex/www split |
| Sitemap submission | UNKNOWN (account data) | Phase 14 brief accepted "SUCCESS" as given fact, never as observed account data | Acceptance ≠ indexing |
| Sitemap discovery | UNKNOWN | Requires GSC Sitemaps report | — |
| Homepage indexing | UNKNOWN | Requires GSC Pages/URL-Inspection | Metadata present is necessary, not sufficient |
| Canonical | VERIFIED (homepage) | `https://www.lensbd.org/` self-canonical in HTML + `metadataBase` www in code; apex 308 → www VERIFIED (`308 Location: https://www.lensbd.org/`) | Consolidation declared for `/` only; children emit none (safe) |
| SSR content | NOT IMPLEMENTED | Live HTML contains `BAILOUT_TO_CLIENT_SIDE_RENDERING`; body = loader + skip link only; `page.tsx` still `use client` + all sections `ssr:false` | Googlebot gets metadata but **no indexable body copy** |
| Detail-page indexing | BLOCKED | Detail routes DB-dependent; DB down → skeletons/404s (Phase 16); sitemap omits all detail URLs except 4 dead fallbacks | Nothing real to index yet |
| Last crawl / fetch / "Crawled - currently not indexed" | UNKNOWN | **No Search Console account access in this audit; prior reports list these as manual operator checks, never as observed values** | No claim made |

### 7.2 REQUIRED GOOGLE SEARCH CONSOLE ANSWER — "Google Search Console e amader current obostha ki?"

**Search Console account evidence:** *None in this audit.* No login, no property data, no Pages/Performance/CWV numbers were accessed or are quoted. Any "current obostha" inside the GSC dashboard is **UNKNOWN** until an operator opens it.

**Google live-crawl evidence (public, VERIFIED):** the site answers crawlers correctly at the HTTP layer — 200 homepage with complete metadata + canonical, 200 `robots.txt` (Allow), 200 `sitemap.xml`, apex→www 308. The Phase 11/12 crawler-403 incident is fixed in the deployed build (allowlist present in working tree and consistent with live Googlebot-200 observations).

**Current indexing state:** **UNKNOWN as reported by Google.** The task brief's "Crawled - currently not indexed" phrase does not appear as an observed GSC value in any repository report — Phase 14 §16 treats it as a *check to run*, not a finding. Repeating it as fact would be fabrication; the honest state is: indexability blockers are gone, but index *outcomes* are unobserved.

**Remaining technical blockers that may affect indexing:** (1) no SSR body copy on homepage; (2) DB-backed pages render empty until the DB is fixed; (3) sitemap lists apex URLs + 4 dead fallback slugs while canonical is www; (4) no per-page canonicals/structured-data/internal links for detail content; (5) `google-site-verification` meta only renders if the env var is set (absent from live HTML observed in Phase 14; not re-checked tag-by-tag this audit — verify how the property is verified: DNS vs meta).

**What NOT to conclude:** do not predict whether or when Google will index any page; do not read "submission SUCCESS" as indexing; do not treat metadata presence as ranking.

---

## 8. SEO AUDIT (actual implementation vs Phase 14/15)

**Fixed since Phase 14 — VERIFIED live this audit:** `metadataBase` (www-pinned, legacy-host-proof `resolveBaseUrl`), default title + `%s | LENS` template, 160-char description, canonical (homepage-only via `HomeCanonical`, avoiding the child-inheritance trap Phase 15 proved), OpenGraph + Twitter on www host, robotsmeta `index,follow`, author/publisher/keywords/locale, favicon/manifest, `/og` image endpoint referenced.

**Remaining (code-read + live):** `robots.ts` + `sitemap.ts` still fall back to legacy `https://lens.org.bd` when env unset and emit apex hosts live (host split); sitemap = 14 static + 4 fallbacks, omits `/impact`, `/library`, `/researchers`, `/assistant`, all detail URLs, no image sitemap; per-route canonicals absent (children emit none — safe but incomplete); JSON-LD components exist (`Organization`, `WebSite`, `Breadcrumb`, `Article`, `FAQ`, `Event`) but only Organization(/about)+Event(/events) wired, `logo` 404 risk per Phase 14 (asset not re-checked); admin login has no `noindex` (client layout can't export metadata; robots-disallow is the only guard); `hreflang` absent (single-URL i18n, `og:locale:alternate` unbacked); RSS link 404 + research-card 404s per Phase 14 (not re-probed — carry as PARTIALLY VERIFIED). Verdict: foundation `VERIFIED`, full SEO `PARTIALLY VERIFIED`.

## 9. SSR / INDEXABLE CONTENT AUDIT

Homepage: `use client` + 12 `dynamic(ssr:false)` sections (Header/Footer direct). Live flight data shows `BAILOUT_TO_CLIENT_SIDE_RENDERING` and loader-only body → **Googlebot receives zero indexable copy** (VERIFIED). Listing pages are server pages with static metadata (indexable headers, demo content). DB detail pages: metadata + body both DB-gated → empty when DB unavailable (VERIFIED pattern, Phase 16). Skeletons are not indexable content. Verdict: metadata layer indexable; content layer `NOT IMPLEMENTED` for homepage, `BLOCKED` for detail pages.

## 10. SECURITY AUDIT (working-tree code; deployed HEAD lags)

VERIFIED in code: fail-closed JWT/CRON/DATABASE_URL (`env.ts`); cron Bearer + 503; upload 401/403 + allowlist + quotas + sanitized keys; AI ownership checks (POST+GET 403) + 20–30/min rate limits + injection patterns + 5k-char sanitize; proxy API 30/min + bot policy + admin redirect + security headers (also in `next.config.ts`); `execFile` no-shell for `pg_dump`/`psql`; `basename` traversal guards; R2 fail-closed + no secret leakage (tested); SQLi-safe patterns (`$executeRaw` params, `ILIKE` filters per Phase 16). Gaps/risks: in-memory rate limits (per-instance, no Redis — note, not defect); cookie CSRF relies on `SameSite=Lax` only; `deleteFromStorage` stub; R2 delete path lacks RBAC wiring; deployed HEAD lacks settings-GET auth + `/api/health` (uncommitted fixes NOT live); error messages generic (good) but upload message wrongly names SVG allowed (cosmetic bug); full authenticated live matrix BLOCKED by DB outage. Verdict: design `PARTIALLY VERIFIED`, live posture `NOT VERIFIED`.

## 11. AI / RAG AUDIT

Implemented: embeddings (`text-embedding-3-small`, 1536-dim pgvector w/ HNSW + in-memory cosine fallback), chunking, `indexDocument`/`indexAllDocuments`, `<=>` retrieval, `gpt-4o-mini` answers w/ citations + retrieval-only fallback, conversation ownership, rate limits, injection guards, admin stats/index routes — VERIFIED by reads + 4 unit tests passing. Blocked by: no DATABASE_URL, no `vector` extension, no indexed corpus, `OPENAI_API_KEY` unset → fallback-only. Live behavior `NOT VERIFIED`. Verdict: `IMPLEMENTED BUT NOT LIVE-VERIFIED`, production `BLOCKED`.

## 12. AUTH / RBAC / ADMIN AUDIT

Login/session/RBAC code VERIFIED; 21 admin sections exist; proxy + client layout double-gate `/admin` (cookie→JWT verify→redirect). No publicly-reachable-but-should-be-protected route found in code reads (`/api/admin/*` require auth in working tree; backup requires admin; upload requires editor; cron requires Bearer). Caveat: deployed HEAD's settings-GET lacked auth (Phase 16) — the fix is uncommitted, so **live HEAD is less protected than the working tree**. Live admin verification BLOCKED (DB down). Verdict: code `PARTIALLY VERIFIED`, live `NOT VERIFIED`.

## 13. PERFORMANCE AUDIT

Stack risks noted (not benchmarked): full-client homepage (R3F/three, GSAP/ScrollTrigger, lenis, WebGL globe + maps, `CustomCursor`, noise overlays), `ssr:false` everything below header/footer, font preconnects present, `next/image` AVIF/WebP + R2 remote patterns configured. No Lighthouse/CWV/bundle numbers produced this audit → performance `NOT VERIFIED` as a whole; prior scroll/canvas/perf reports are historical evidence only. Recommendations (P2): RSC homepage shell, route-level code-split audit, image/OG caching policy, `next/image` for avatars (Phase 16 checklist item), long-task review on mobile.

## 14. ACCESSIBILITY AUDIT

Observed: skip-to-content link (live + code), `<main id="main-content">`, landmarks, decorative `aria-hidden`, focus-visible skip styles, `lang="en"`, Hind Siliguri for Bengali. Not audited: full keyboard flow, focus traps, contrast ratios, names/labels inventory, `prefers-reduced-motion` (heavy animation stack — lenis/GSAP/WebGL — needs a motion opt-out check), mobile nav semantics. Verdict: `PARTIALLY VERIFIED`.

## 15. TESTING / CI/CD AUDIT

- `npm test` re-run this audit: **7 files / 31 tests PASS (VERIFIED)** — r2 9, ai/auth/schemas/slugify 4 each, storage/scroll 3 each.
- `npx tsc --noEmit`: **PASS, exit 0 (VERIFIED)**.
- `npm run lint` / `npm run build`: **NOT re-run** this audit (prior: lint 74 pre-existing problems per Phase 16; build 77 pages success). Carry as PARTIALLY VERIFIED.
- CI (`ci.yml`) + backup schedule (`backup.yml`): correct-looking but **untracked → NOT IMPLEMENTED live**. No Playwright/E2E. No deployment workflow beyond Vercel git integration.

## 16. VERCEL / PRODUCTION DEPLOYMENT AUDIT

Deployed: `965f0b6` on Production (Vercel build success; apex 308 → www at platform level). `vercel.json` working tree = empty crons (deliberate — Bearer incompatible). No `postinstall: prisma generate` (client-generation risk noted since Phase 16). Env docs exist (`.env.example`); production env contents **UNKNOWN** (CLI logged out, no `.vercel/` link) except the one proven fact: `DATABASE_URL` MISSING. `NEXT_PUBLIC_SITE_URL` production host unproven (code defensively pins www regardless). Assumption risks: ephemeral FS for uploads/backups; per-instance rate limits; build-time sitemap (redeploy needed after DB fix). No Vercel setting was viewed or changed. Verdict: hosting works; configuration `BLOCKED`/incomplete.

## 17. PHASE HISTORY RECONCILIATION (claims vs current reality)

| Phase | Claim | Current Evidence | Status |
|---|---|---|---|
| 7 (staging) | Staging audit baseline | Historical; staging never provisioned | SUPERSEDED |
| 8 (blockers) | Anonymous AI ownership IP-bound; DB prod blocker | Ownership fix VERIFIED in `ai/chat/route.ts` (user-key + legacy IP compat) | FIXED (code) |
| 9 (staging acceptance) | 19/19 tests; DB-gated items unverified | Suite now 31/31 PASS (re-run) | VERIFIED |
| 10 (R2) | R2 code + 9 mocked tests; live BLOCKED | Files identical in tree; tests PASS; still no creds/live run | HOLDS — still code-only |
| 11 (403) | 403 from `proxy.ts` bot regex incl. Googlebot | Working tree uses allowlist-first (`ALLOWED_CRAWLERS` before block list); live Googlebot 200s | FIXED (deployed `e4d24b5`+) |
| 12 (crawler fix) | Fix committed, GSC re-check pending | Crawl verified working; GSC account part still pending | PARTIALLY HOLDS |
| 14 (brand SEO) | 12 findings; indexable-but-incomplete | Homepage metadata/canonical findings FIXED live; SSR-body/orphan-links/sitemap-host findings OPEN | PARTIALLY FIXED |
| 15 (metadata+diagnosis) | Stage 1 shipped in HEAD; DB root cause unverifiable then | Metadata live VERIFIED; DB cause later proven by Phase 17 logs | CONFIRMED |
| 16 (DB resolution) | Root cause unproven; leading hypothesis sqlite-vs-pg URL | Proven correct direction by Phase 17 (missing URL + sqlite provider) | CONFIRMED |
| 17 (DB proof) | `DATABASE_URL` MISSING proven; provider `sqlite` at deploy | Re-verified: HEAD schema still `sqlite`; env still unconfigured | HOLDS |
| 18 (migration audit) | Non-DAG history, 9 missing tables, BLOCKED on DB-existence proof | Files unchanged; all structural claims re-confirm by inspection | HOLDS |
| Perf/scroll phases | Scroll budgets, R3F fixes, hydration | Code shows follow-ups landed (direct Header/Footer, `page.tsx` note re RSC); numbers not re-measured | HISTORICAL |

No prior report was found to fabricate evidence; Phase 14's quarantined "manual checks" were respected (not upgraded to facts).

## 18. FINAL PRODUCTION READINESS MATRIX

| Domain | Status | Production Ready? | Blocking Issue | Next Action |
|---|---|---|---|---|
| PostgreSQL | BLOCKED | NO | No proven instance; ext. requirements unmet | Provision PG + prove reachability (§21-1) |
| Prisma migrations | NOT IMPLEMENTED (live) | NO | Non-DAG + 9 missing tables + uncommitted | Repair + commit + deploy (§21-2/3) |
| Authentication | BLOCKED | NO | DB down; fixes uncommitted | DB first, then live auth matrix |
| RBAC | PARTIALLY VERIFIED | NO | HEAD lacks settings-GET auth | Commit fixes; live 401/403 matrix |
| API security | PARTIALLY VERIFIED | NO | Live matrix unrunnable | Post-DB penetration pass |
| R2 | IMPLEMENTED BUT NOT LIVE-VERIFIED | NO | No creds/bucket/schedule/drill | Live-config + round-trip + drill (§21-6) |
| Backups | IMPLEMENTED BUT NOT LIVE-VERIFIED | NO | Unscheduled, local-only, untested | Commit workflow; trigger; verify R2 object |
| Restore | NOT IMPLEMENTED (live) | NO | Never executed | Staging restore drill |
| AI/RAG | BLOCKED | NO | DB + pgvector + key | Post-DB index + keyed test |
| SEO | PARTIALLY VERIFIED | PARTIAL (foundation yes) | SSR body, sitemap, detail meta | §21-9/10/11 |
| Google indexing | UNKNOWN | UNKNOWN | No GSC data; DB-empty pages | Open GSC; fix blockers; monitor |
| Sitemap | IMPLEMENTED BUT NOT LIVE-VERIFIED (DB branch) | NO | Fallbacks + apex host | DB + www + resubmit |
| SSR | NOT IMPLEMENTED (homepage body) | NO | Client-only shell | RSC conversion |
| Structured data | PARTIALLY VERIFIED | NO | Only 2 routes wired | Wire WebSite/Article/Breadcrumb |
| Performance | NOT VERIFIED | UNKNOWN | No current benchmarks | Lighthouse + budgets |
| Accessibility | PARTIALLY VERIFIED | UNKNOWN | No full pass | Full a11y audit incl. reduced-motion |
| Testing | VERIFIED | YES (unit) | No E2E | Add smoke/E2E post-DB |
| CI/CD | NOT IMPLEMENTED (live) | NO | Workflows uncommitted | Commit + activate + required checks |
| Monitoring | NOT VERIFIED | NO | No DSN proof, no uptime | Sentry DSN + uptime + log review |

**Production-ready today: NOTHING end-to-end** (unit code quality is green; every live data path is down or unproven).

## 19. MISSING WORK — PRIORITIZED ROADMAP

### P0 — MUST FIX BEFORE PRODUCTION (genuine blockers)

1. **Provision production PostgreSQL (vendor decision + `vector` + `pg_trgm`)** — Evidence: no vendor anywhere; Phase 18 §12–15. Files: none yet. Dep: operator decision. → Phase 19.
2. **Set Vercel Production `DATABASE_URL` (+ Preview/Dev) and redeploy** — Evidence: missing proven (Phase 17 log). Dep: #1. → Phase 19.
3. **Repair migration history** (order/DAG, duplicates, 9 tables, 1 column/FK/index, drift index, `migration_lock.toml`) — Evidence: Phase 18 §§5–10, reconfirmed. Dep: DB-existence/data-state proof (fresh→rewrite/baseline; existing→preserve+forward). → Phase 20.
4. **Run `prisma migrate deploy` staging-first, then production; acceptance (`/api/health` db:ok, CRUD smoke)** — Evidence: checklist §1/§6; health route untracked. Dep: #1–3. → Phase 20.
5. **Commit the 46-file working tree** (provider flip, auth hardening, env helper, health, schemas, upload/cron fixes) — Evidence: `git status` this audit; HEAD=`sqlite` proves deploy gap. Dep: review of diff. → Phase 20 (with #3).
6. **Live R2 configuration + first real backup round-trip + restore drill** — Evidence: §4 matrix all-live-zero. Dep: #4 (records table must exist). → Phase 21.
7. **Activate scheduling** (commit `backup.yml` + repo secrets `BACKUP_APP_URL`/`CRON_SECRET`, or documented Vercel alternative) — Evidence: `vercel.json` empty + workflow untracked. Dep: #6. → Phase 21.
8. **Durable media path** (configure `S3_*`/R2-media or equivalent; stop relying on ephemeral `public/uploads`) — Evidence: `storage/index.ts` fallback + `health` degraded design. Dep: storage decision. → Phase 21.
9. **Post-DB live security matrix** (admin 401/403, upload 403+SVG-400, AI cross-owner 403, cron 401/503, SQLi probe) — Evidence: checklist §3; code ready. Dep: #4. → Phase 22.

### P1 — REQUIRED FOR PRODUCTION QUALITY

- Homepage SSR/RSC body content; DB-driven www sitemap + GSC resubmit; per-route canonicals + JSON-LD wiring + internal links to detail pages; `robots.ts`/`sitemap.ts` host constants unified to www; admin `noindex`; OG/logo asset fixes; AI keyed answers + indexed corpus; library search verification; CI workflows committed + required; Sentry DSN + uptime monitoring; dependency majors + lint cleanup; nonce-based CSP review.

### P2 — POST-LAUNCH / POLISH

- E2E suite, reduced-motion + full a11y pass, performance budgets, R2 lifecycle/retention policies + backup encryption + checksum verification, email deliverability hardening, Bengali `hreflang`/locale URLs decision, AI-chatbot opt-in policy review (GPTBot/CCBot currently disallowed).

## 20. EXACT NEXT PHASE ORDER (evidence-based)

1. **Production PostgreSQL provisioning + `DATABASE_URL` proof** (vendor, `SELECT 1`, `_prisma_migrations` inspection — read-only acceptance; decides repair branch).
2. **Migration repair** (branch from step-1 evidence: fresh→rewrite/baseline; existing→preserve+forward; add 9 tables + column/FK + lockfile).
3. **Production migration** (`migrate deploy` staging-first) + DB acceptance (health `database: ok`, smoke CRUD).
4. **Commit + deploy working-tree fixes** (provider, auth, env, health) — ordered with #2 (single reviewed cutover, then re-verify).
5. **Auth/RBAC/security live acceptance** (checklist §3 matrix).
6. **R2 live configuration** (bucket, creds, first `storage:"r2"` backup, object listing proof).
7. **Backup/restore proof** (schedule run, retention evidence, restore drill on staging).
8. **AI/RAG activation** (extensions → index corpus → keyed answer test).
9. **Homepage SSR/RSC** (indexable body without losing interactivity).
10. **Sitemap correction + GSC resubmit** (www, DB URLs, no dead slugs) + open GSC baseline.
11. **Structured data + internal linking** completion.
12. **Performance + accessibility** passes with numbers.
13. **Dependency/lint cleanup + CI enforcement.**
14. **Final production acceptance** (48h Sentry/health watch, checklist §6).

## 21. FINAL VERDICT

**MASTER AUDIT COMPLETE — NEXT IMPLEMENTATION PHASE IDENTIFIED**

- **Reason:** every audit question (A–P) is answered with classified evidence; the single decisive unknown from Phase 18 (production DB existence/state) is now correctly framed as the *first implementation step* (provision + prove), not as audit-blocking missing evidence — the audit itself encountered no missing evidence it was entitled to: code, history, configs, live public endpoints, and prior reports were all inspectable, and `tsc` + 31/31 tests were re-verified.
- **Missing evidence (for implementation, not for this audit):** PostgreSQL vendor choice, production `DATABASE_URL`, production migration state, R2 bucket/credentials, private GSC account data.
- **What must happen before implementation:** operator provisions production Postgres (with `vector` + `pg_trgm`), sets `DATABASE_URL` in Vercel, and grants read-only proof access (runtime log snippet + `migrate status` output) — then Phase 19/20 executes in the §20 order. No code, migration, or infra change is authorized by this report.

---

## 22. FINAL CHANGE-CONTROL PROOF

Pre-audit and post-audit `git status` compared; branch/HEAD unchanged; only this report file added.

```
FILES CREATED:

* PHASE_MASTER_PRODUCTION_R2_GSC_AUDIT_REPORT.md

FILES MODIFIED:

* NONE

FILES DELETED:

* NONE

SCHEMA CHANGED:

* NO

MIGRATIONS CHANGED:

* NO

ENVIRONMENT CHANGED:

* NO

DATABASE MUTATIONS:

* NONE

DEPLOYMENTS:

* NONE

COMMITS:

* NONE

PUSHES:

* NONE
```

*Read-only commands executed (no mutation): `git branch/status/log/diff/show/ls-files`, `curl -I` + public HTTPS GETs (`/`, `/robots.txt`, `/sitemap.xml`, apex redirect), `npx tsc --noEmit` (PASS), `npm test` (7 files / 31 PASS), directory/test-file inventory greps. No secret values read or printed; `.env` inspected for key names only.*

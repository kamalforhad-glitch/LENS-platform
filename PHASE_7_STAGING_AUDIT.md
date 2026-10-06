# Phase 7 — Staging Audit (code-level, no live staging environment)

> Scope: Step 1 of Phase 7. No code modified for this document.
> Method: file reads, `prisma validate`, `npm test`, `tsc`, `eslint`, `npm audit`,
> `npm run build`, `Get-Command` tool checks. No running server, no live PostgreSQL,
> no Vercel project access. Anything not executed is marked NOT VERIFIED.

## 1. What is already verified (actually executed)

- `prisma validate` with a postgres `DATABASE_URL` override: **valid**.
  (`prisma/schema.prisma` provider `postgresql`, `Unsupported("vector(1536)")`,
  fixed `DownloadLog` relation all parse.)
- `npm test` (vitest 3.2.7): **5 files / 18 tests pass** — slugify incl. Bengali,
  zod contact/blog schemas, SVG rejection + size quota, role hierarchy
  (viewer/editor/admin), AI chunking + conversation-ownership rule.
- `npx tsc --noEmit`: **clean (exit 0)**.
- `npm run build` (postgres URL override): **success, 77 routes** incl. new
  `/api/health`. The build log proves the sitemap DB-fallback works: the
  `researchArticle.findMany()` call fails without a live DB
  (`User was denied access`) and the sitemap falls back to static slugs
  without failing the build.
- `npm audit`: full classification done (see §6 of staging report).
- Local tool check: `pg_dump` / `psql` / `pg_restore` are **absent** on this
  machine (`Get-Command` returned nothing). Node v26.5.0.
- `/api/health` source read: returns only `ok/degraded/down` presence flags +
  version — **no secret values** in the response shape.
- Login page source read: default-credential hint removed.
- Seeds read: `admin123` removed from both `seed.ts` and `seed.js`;
  `ADMIN_SEED_PASSWORD` required (throws in production, skips in dev).
- `src/lib/actions/library.ts` read: `$queryRawUnsafe` gone; parameterized
  `$queryRaw` + `Prisma.raw()` applied to a strict ORDER BY whitelist only;
  tsQuery sanitized, filters validated (year 1900–2100, dates parsed).
- Admin routes read (13 files): GET requires auth, POST/PUT require editor,
  DELETE requires admin, 401/403 mapping present. `backup/*` already admin-only.
- Upload route + storage read: editor gate + `image/svg+xml` removed from
  allowlist (tests confirm rejection).
- AI chat route read: IP-prefix ownership checks on POST and GET + GET
  rate-limit. Cron route read: fail-closed (503 if `CRON_SECRET` unset).
- Backup lib read: `execFile` argv (no shell), `mkdir -p` before dump, plain
  SQL format matching `.sql` + cleanup filter, `basename()` on restore/download.

## 2. What is only code-reviewed (NOT executed against live services)

- Prisma migration `20261001_pg_standardization` (extensions, FK drop/add,
  GIN/HNSW indexes): SQL reviewed, idempotent by construction
  (`IF NOT EXISTS`, `DO $$ ... EXCEPTION`), **never applied to a live DB**.
- `$transaction` wrappers (trackDownload, author link/unlink, review
  assign/status, version save/restore): reviewed + type-checked, **no
  concurrency test run** (needs live PG).
- Review-status aggregation fix, event date guards, team `?? 0`, unicode
  slugify: unit-covered where pure (slug/dates), **workflow-level behavior
  NOT VERIFIED** end-to-end.
- `next/image` avatar conversions, ImpactContent retry panel, `<html lang>`
  sync, DB-driven sitemap (fallback path proven; live-DB path NOT VERIFIED).
- `.github/workflows/ci.yml`: YAML reviewed, **never run** (no repo remote /
  runner access from here).
- `prisma generate` after schema change: **BLOCKED by Windows EPERM
  file-lock** on `query_engine-windows.dll.node` (dev server / file handle
  held). Must be retried with no node processes running.

## 3. What requires a real PostgreSQL environment

- `prisma migrate status` → P1010 denied (no server at localhost:5432).
  `migrate deploy`, extension creation (`vector`, `pg_trgm`), HNSW/GIN index
  builds: **BLOCKED — REAL POSTGRESQL REQUIRED**.
- `DocumentEmbedding` vector column behavior, `to_tsvector`/`ts_rank`
  ranking, trigram search, `<=>` vector search, `mode:"insensitive"` parity:
  **NOT VERIFIED** (code paths exist; no live execution).
- `GET /library?search=<real term>` and AI vector retrieval on real data:
  **NOT VERIFIED**.
- Health 200-with-healthy-DB branch: **NOT VERIFIED** (only the
  down/degraded branches are exercisable here).
- Staging security acceptance tests over HTTP (anon 401 / viewer 403 /
  editor 200 / admin delete): **NOT VERIFIED** — no running server was
  started in this phase (unit tests cover the pure role predicates only).

## 4. What requires Vercel configuration

- `CRON_SECRET` value in project env **plus** a scheduler that can actually
  send `Authorization: Bearer` (see §5 of staging report — `vercel.json`
  crons carry path+schedule only, no headers).
- `DATABASE_URL` (postgres), `JWT_SECRET` (≥32 chars), `ADMIN_SEED_PASSWORD`,
  `RESEND_API_KEY`/`EMAIL_FROM`/`ADMIN_EMAIL`, `OPENAI_API_KEY`, `S3_*`,
  `CDN_URL`, `NEXT_PUBLIC_SITE_URL`, Sentry DSN/org/project.
- Cron executability, `public/uploads` ephemerality, backup-file persistence:
  architectural facts below — provisioning out of scope for this repo phase.

## 5. What requires external services

- Resend (contact/newsletter delivery — current code logs dev-mode success).
- OpenAI (embeddings + chat completions — current code uses zero-vector /
  retrieval fallback).
- S3-compatible storage (uploads — current code uses local `public/uploads`).
- ORCID / CrossRef (author lookup enrichment — optional, graceful `null`).
- Sentry (error monitoring — DSN-gated).
- GA4 / Meta Pixel (analytics — consent-gated, ID-gated).

## 6. What remains unsafe for production

1. **No live PostgreSQL staging has ever run these migrations.** The
   provider switch + pgvector + DownloadLog fix are code-complete but
   migration-untested. Deploying blind risks a down site.
2. **`next@16.3.5` critical RCE (GHSA-vcvr-r3jv-pc5j, next/og
   ImageResponse)** — this project ships an `og/route.tsx`. Patch 16.3.8
   exists (non-major) but was NOT applied here (pinned framework +
   `eslint-config-next@16.3.5` + no staging env to regression-test).
3. **Vercel cron cannot satisfy the Bearer-secret gate** (`vercel.json`
   supports path+schedule only). As coded, scheduled backups 401 forever on
   Vercel; backup files + `pg_dump` binary + `backups/` persistence are
   separately unavailable on serverless. Backup strategy is therefore
   **designed but not executable** in the current hosting assumption.
4. **HTTP-level security tests never ran** (no server): role gates, cron
   matrix, IDOR matrix, SQLi probes, upload matrix are code+unit verified
   only.
5. **AI IDOR binding is IP-prefix** — documented limitation: NAT/shared IP,
   IPv6 variations, and mobile IP rotation can over-share or break sessions.
   Acceptable interim control, not a durable ownership model.
6. **Full lint is red for pre-existing reasons** (34 errors: admin
   `set-state-in-effect` pattern ×20+, GlobeNetwork refs, AssistantContent
   purity, etc.). Changed files are 0-error; the backlog is untouched per
   Phase 7 rules.
7. **`npm audit`: 7 vulns incl. 1 critical (next), 4 high** — none auto-fixed
   (all fixes are major/breaking or need staging verification).

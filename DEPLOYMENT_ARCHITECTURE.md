# LENS Platform — Deployment Architecture

**Status:** audited 2026-10-20 · branch `main` · HEAD `333f379` (“feat: add comprehensive CMS and admin management”)
**Live production site:** https://lensbd.org (canonical: `https://www.lensbd.org`)

This document describes **what actually runs today** and the **target temporary architecture** (Vercel + Supabase + Render), with an honest note about why the Render portion is deferred.

---

## 1. What this repository is

A single **Next.js 16 (App Router) application** — `next 16.3.8`, React 19, Prisma 6, PostgreSQL (+`pgvector`, `pg_trgm`) — that simultaneously provides:

| Concern | Where it lives in this repo | Mechanism |
|---|---|---|
| Public pages (research, blog, events, courses, resources…) | `src/app/**` | Server Components reading Prisma directly |
| CMS / admin UI (`/admin/**`) | `src/app/admin/**` | Client pages + **Server Actions** (mutating) |
| Authentication & sessions | `src/lib/auth.ts`, `src/lib/actions/auth.ts`, `src/proxy.ts` | bcrypt password hashes (DB) + signed JWT in `lens-session` httpOnly cookie + `sessions` table; `proxy.ts` (Next 16 middleware convention) guards `/admin/**` |
| Public APIs | `src/app/api/**` | Route handlers (`/api/health`, `/api/researchers`, `/api/auth/*`, `/api/contact`, `/api/newsletter/*`, `/api/ai/*`, `/api/analytics/*`, `/api/og`, `/api/backup`, `/api/cron/backup`, …) |
| Media uploads | `src/app/api/upload`, `src/lib/storage` | S3-compatible object storage (R2-capable) with explicit local `public/uploads` fallback (ephemeral!) |
| Backups | `src/lib/backup/**`, `.github/workflows/backup.yml` | `pg_dump` → Cloudflare R2 artifact upload |
| Email | `src/lib/email` | Resend (optional; dev-logs when unconfigured) |
| AI research assistant | `src/lib/ai`, `/api/ai/*` | OpenAI + pgvector similarity search |
| Schedules/cron | `vercel.json` `"crons": []` (empty), GA workflow at 02:00 UTC | See §5 |
| Error monitoring | `sentry.client.config.ts`, `sentry.server.config.ts`, `withSentryConfig` | Sentry (optional, env-gated) |

There is **no separate backend service** in this repository. Everything (pages, CMS mutations, auth, APIs, file uploads, backups) executes inside the Next.js server runtime, deployed as one unit on **Vercel**.

---

## 2. Current dependency map (Vercel → Supabase → others)

```
Browser
  │ lensbd.org, www.lensbd.org  (HTTPS; Vercel-managed TLS, apex 308 → www)
  ▼
Vercel  ── Next.js app (main branch)
  ├── proxy.ts (auth guard for /admin, rate limit, bots, security headers, cache rules)
  ├── Server Actions (login, logout, CMS/CRUD, media, users, review…) ◄─ runs HERE
  ├── Route Handlers /api/* (health, public read APIs, ai, upload…)
  ├── Edge CDN cache: immutable /_next/static/*; no-store /admin/*; no HTML overrides
  │
  ├──► Supabase PostgreSQL (pooled, port 6543, transaction pooler via DATABASE_URL)
  │      SELECT 1 health = OK (verified live 2026-10-20)
  ├──► Supabase PostgreSQL (direct, port 5432 via DIRECT_URL)
  │      used by prisma migrate deploy / pg_dump / psql — operator-side only
  ├──► S3-compatible object storage (S3_* env) — media uploads      [OPTIONAL, currently unconfigured]
  ├──► Cloudflare R2 (R2_* env) — durable backup artifacts          [OPTIONAL, currently unconfigured]
  ├──► Resend (RESEND_API_KEY) — transactional email                [OPTIONAL, currently unconfigured]
  ├──► OpenAI (OPENAI_API_KEY) — AI retrieval answers               [OPTIONAL, currently unconfigured]
  └──► Sentry (SENTRY_* env) — error tracking                       [OPTIONAL, currently unconfigured]

GitHub Actions
  └── "Scheduled database backup" 02:00 UTC daily
        reads repo secrets (DIRECT_URL, R2_*) — pg_dump → R2 (schedule owner)
```

**Live verification (read-only probes, 2026-10-20, no credentials, no secrets):**

| Probe | Result | Meaning |
|---|---|---|
| `GET /api/health` on www.lensbd.org | **200** `{"database":"ok","cron":"ok",storage/email/ai:"degraded"}` | `DATABASE_URL` and `CRON_SECRET` configured on Vercel; DB reachable; optional integrations not configured |
| `GET /api/researchers` | **200** `{"researchers":[]}` | `researcher_profiles` table exists → migrations are applied on Supabase |
| `GET /admin` | **307** → `/admin/login` | proxy auth guard works |
| `GET /admin/login` (pre-fix) | **200** with `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`, `X-Vercel-Cache: HIT`, `Age: 1341` | *root cause of the Server Action error* (see §3) |
| `GET /robots.txt`, `/sitemap.xml`, `/` | **200** | SEO routes intact |
| apex `lensbd.org/admin/login` | **308** → `https://www.lensbd.org/...` | single canonical deployment |

---

## 3. Root causes found (production log errors)

### 3.1 `Failed to find Server Action "..."`

**Mechanism.** Every Next.js build assigns each Server Action a new action ID (IDs rotate per build, at most every 14 days for unchanged code — a build-artifact property, not a bug). A browser holding a page/JS bundle from an older deployment will call an Action ID that the new server no longer knows; Next.js responds 404 with `x-nextjs-action-not-found` and the client throws `UnrecognizedActionError` (E715).

**Local evidence (confirmed by fixing, not assumed):**
1. The blanket cache rule in `src/proxy.ts` set `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400` on **all** HTML — including `/admin/login` and action-bearing pages. Live response headers showed `X-Vercel-Cache: HIT; Age: 1341`, i.e. the edge served a **prerendered HTML document captured ~22 minutes earlier**; up to 1h retention + 24h SWR in front of every redeploy allowed HTML referencing action IDs from an older build.
2. The admin login page hard-caught every exception as a generic error with **no recovery path**.

**Fix (this repo, preserving Next.js defaults — CSRF/auth unchanged):**
* `src/proxy.ts`: admin responses → `no-store, must-revalidate`; public HTML → no explicit CDN `Cache-Control` (per-route Next.js semantics govern caching; CMS actions already call `revalidatePath`).
* `src/app/admin/login/page.tsx`: uses the public `unstable_isUnrecognizedActionError` (from `next/navigation`) to detect exactly this failure and offer a **Reload page** action that fetches the current deployment’s bundle. No credential auto-retry, no rate-limit bypass.

**Deployment-ops rules (otherwise inherent to the platform, cannot be "fixed" in code):**
* users with the site open across a deploy get one stale interaction; the new login/refresh UX recovers them;
* keep Server Action implementations stable near release time (e.g., don’t rewrite `actions/*` signatures on a hotfix);
* when self-hosting on **Render with ≥2 instances**, set the same `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` on all instances — mismatch produces exactly this error class (Next.js self-hosting docs).

### 3.2 Admin login-generic **“An internal error occurred. Please try again.”**

`login()` (`src/lib/actions/auth.ts`) returns this message when *any* exception is thrown server-side; the actual error is printed only to server logs (`[AUTH] Login error: …`). Credential-verification failures correctly return the safe “Invalid email or password” message *before* any of the throwing paths. With the live probes above (DB reachable, `researcher_profiles` tables exist, so the 9 SQLite-era migrations have equivalent Postgres migrations applied), the remaining plausible throw sites are — in order of likelihood:

| # | Throw site | How to confirm (operator, server-side or direct read-only SQL) |
|---|---|---|
| 1 | `db.user.findUnique` / session table ops — DB *reachable* but `users`/`sessions` table missing on the current DB | `SELECT table_name FROM information_schema.tables WHERE table_schema='public'` vs the 37-table checklist (RUNBOOK §4) |
| 2 | `getJwtSecret()` throws when `JWT_SECRET` is missing or shorter than 32 chars in production | Vercel env panel / log line `JWT_SECRET environment variable is required` |
| 3 | `bcrypt.compareSync` throws on a malformed `password_hash` (e.g. account inserted by hand with a non-bcrypt value) | read-only: `SELECT left(password_hash,4), length(password_hash) FROM users WHERE email='admin@lens.org.bd'` — bcrypt prefixes are `$2a$/$2b$/$2y$` at 60 chars |
| 4 | session insert / user update failures (connection pool exhaustion under load) | Vercel runtime logs around the failure timestamp |

`logAudit` failures are **not** a cause — it is self-silencing by design (`audit.ts` catches and logs).

The error message exposes nothing sensitive, and server logs (which the operator reads privately) already carry the true cause — that behaviour is retained. The fix path is operational: confirm JWT_SECRET, confirm all tables, confirm hash prefix; procedures in the RUNBOOK.

---

## 4. Target architecture: Vercel + Supabase + (Render, phased)

### 4.1 What is approved to run where **today**

| Component | Service | Why |
|---|---|---|
| Next.js app: pages, /admin, Server Actions, /api/* | **Vercel** (branch `main`, domain `lensbd.org`/`www`) | this is the entire repo; Server Actions are intrinsic to the Next.js runtime |
| PostgreSQL data | **Supabase** (pooled runtime URL + direct URL for migrations) | verified live: `database: ok`, migrations applied |
| Scheduled DB dumps | **GitHub Actions** (pg_dump → R2) | pg_dump cannot run on Vercel serverless; workflow performs read-only dumps |
| Manual admin backup button | Vercel (`/api/backup` + CRON_SECRET) | now reports a clear ENOENT diagnostic instead of failing cryptically |

### 4.2 Why a Render *backend service* is NOT deployed yet

A clean split would require a second deployable that owns state-changing operations. In this repo:

* **CMS mutations are Server Actions** (`src/lib/actions/**`, invoked via the React/Next protocol with Next.js CSRF-origin checks) — not HTTP REST calls. Converting them means replacing typed-action boundaries with an HTTP API + client adapter for ~13 action modules (cms, content, media, authors, publications, research, review, team, users, events, dashboard, library, auth).
* **Auth is action-coupled**: login sets the httpOnly session cookie from inside the action; `proxy.ts` guards every page using the same JWT secret. A separate API would need the same JWT/session machinery, a strict CORS allowlist, and a re-test of RBAC for every admin route.
* **File uploads** stream through `/api/upload` with validated magic-byte sniffing and R2 storage — moving it means re-testing CMS media pickers end-to-end.
* **Read paths everywhere** are Prisma calls inside server components — they belong to the Next.js runtime; only mutations would migrate, leaving a half-migration.

Splitting any subset now risks breaking login, CSRF, CMS mutation flows or RBAC audits. **Decision: keep the Next.js server on Vercel; document the phased path below.** This satisfies “separate only if safe”.

### 4.3 Phased migration path to Render (when initiated)

| Phase | Work | Exit criteria |
|---|---|---|
| P1 — prepare | Introduce an internal service layer (pure functions in `src/lib/**` already are); add `public` typed HTTP handlers per action module, or keep actions as thin wrappers delegating to those handlers | Server Actions unchanged; unit tests 100% pass |
| P2 — extract jobs first (low risk) | Move `createBackup`/maintenance to a **Render Cron/service** with `postgresql-client`; DELETE the GitHub schedule then (single-owner rule) | Render cron produces dumps in R2; GH workflow disabled |
| P3 — extract mutations | Stand up Render web service (Node/Next or Fastify adapter), `render.yaml` from Runbook §9; move auth mutations behind API + stable `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`; strict CORS: `https://www.lensbd.org` only | login, invite-accept, CMS flows verified through Render endpoint; Vercel keeps reads |
| P4 — split reads | Optionally move public APIs to Render; pages consume `NEXT_PUBLIC_API_URL` | all public APIs served by Render or Vercel — never both |
| P5 — cutover | Final DNS review; disable duplicate paths | no duplicate schedules; rollback plan exercised once in staging |

Constraints carried into every phase: secrets only server-side; no `NEXT_PUBLIC` DB/JWT/R2 values; one owner per scheduled job; rollback re-deploy + migrate-down plan per RUNBOOK.

---

## 5. Scheduled jobs — single ownership

| Job | Owner | Not this owner anymore | Notes |
|---|---|---|---|
| Daily DB dump (02:00 UTC) | GitHub Actions `Scheduled database backup` | — (Vercel `crons` stays `[]`; no Render cron until P2) | read-only; uploads to R2; retention via R2 lifecycle rule |
| Manual backup | admin UI → `/api/backup` (CRON_SECRET) | — | may still run on Vercel where pg_dump is unavailable → clear diagnostic | 
| numpy/other maintenance | none present in repo | — | — |

`vercel.json` stays `"crons": []` deliberately. If a Vercel cron is ever added, the GH schedule must be disabled first, and vice versa.

---

## 6. Data management

* **Schema:** `prisma/schema.prisma` (PostgreSQL, 37 models; `embedding Unsupported("vector(1536)")` handled via raw SQL; HNSW cosine index).
* **Migrations:** 9 directories, ordered DAG, `migration_lock.toml = postgresql`. Additive-only; all previous known defects (duplicate timestamps, missing tables, missing `author_articles.researcher_profile_id`, missing lock file) were repaired in prior phases and audited in this one.
* **Extensions:** `vector` (created in `20260921000001_add_pgvector` and re-guarded in `pg_standardization`) and `pg_trgm` (GIN trigram indexes) — both **available on Supabase**; verify with RUNBOOK §4 step 4.
* **Connection strategy:** pooled (`pgbouncer=true`, port 6543, `connection_limit=1`) → `DATABASE_URL` runtime; direct (5432) → `DIRECT_URL` for `migrate deploy` / dumps. The Prisma client is reused as a single global instance (`src/lib/db.ts`) to avoid exhausting the Supabase transaction pooler.
* **Seeding:** `prisma/seed.ts` creates `admin@lens.org.bd` (super_admin) **only if absent**, requires `ADMIN_SEED_PASSWORD` in production, never resets existing accounts. No destructive seed on production.

---

## 7. Media (uploads) durability

Local fallback writes to `public/uploads` — **ephemeral on Vercel** (lost on redeploy; filesystem is read-only in production, uploads effectively require S3 storage more). The CMS-dependent path:

* configure an S3-compatible store (R2/S3) with `S3_*` variables, plus `CDN_URL=https://cdn.lensbd.org`;
* pre-existing R2 images referenced in DB rows are served from `cdn.lensbd.org` / `*.r2.cloudflarestorage.com` via `remotePatterns` in `next.config.ts`;
* until then: uploads persist only if the S3 config exists; the health endpoint reports `storage: degraded` when unconfigured (true and visible today).

---

## 8. Environment variable matrix

Canonical matrix with requiredness per service lives in `DEPLOYMENT_RUNBOOK.md §6` and `.env.example`. Highlights:

* runtime secrets **only on server side**: `DATABASE_URL`, `DIRECT_URL` (migrations/admin), `JWT_SECRET`, `CRON_SECRET`, `S3_*`/`R2_*`, `RESEND_API_KEY`, `OPENAI_API_KEY`, `SENTRY_*` — **never** `NEXT_PUBLIC_*`;
* browser-visible: only `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`, `NEXT_PUBLIC_BING_VERIFICATION`, `NEXT_PUBLIC_SENTRY_DSN`.

---

## 9. Change log of this document’s accompanying code

| File | Change | Reason |
|---|---|---|
| `src/proxy.ts` | removed blanket `s-maxage/SWR` from HTML; `no-store` for `/admin` | stale Server Action IDs root cause |
| `src/app/admin/login/page.tsx` | detects `UnrecognizedActionError`, offers reload | actionable recovery for deployment skew |
| `src/lib/backup/index.ts` | ENOENT diagnostics for pg_dump/psql | cryptic serverless failures |
| `.github/workflows/backup.yml` | schedule executes pg_dump itself via secrets | runs were guaranteed to fail on Vercel |
| `src/lib/email/index.ts` | `ADMIN_EMAIL` fallback `admin@lens.org.bd` | matches seeded admin identity |
| `.env.example` | seed semantics, Render key, backup secrets, email identities | operator clarity |

See `DEPLOYMENT_RUNBOOK.md` for exact operational steps.

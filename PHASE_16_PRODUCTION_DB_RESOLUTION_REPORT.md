# PHASE 16 — PRODUCTION DATABASE RESOLUTION

**Mode:** EVIDENCE-FIRST / PRODUCTION-SAFE / NO DESTRUCTIVE CHANGES
**Date:** 2026-10-01
**Repository:** `D:\downloads\civic-youth-bangladesh\lens\lens_website` (branch `main`, remote `origin` = `https://github.com/kamalforhad-glitch/LENS-platform.git`)
**Secrets policy honored:** no credentials, passwords, tokens, connection strings or secret values were read into, printed in, or invented for this report. Local `.env` was inspected for **key names only**.

---

## 1. Executive Summary

Production `https://www.lensbd.org/` is serving **commit `965f0b6`** (GitHub Deployment environment = **Production**, created `2026-10-01T07:45:24Z`). Every database-backed route still fails: `/api/researchers` → **500**, `/api/admin/settings` → **500**, `/api/admin/search?q=a` → 401 (auth path healthy), and a direct production server-action probe of the admin `login` action returns **"An internal error occurred."**, which is the `catch` branch of `db.user.findUnique()` — i.e. a **live production read of the `users` table threw**.

However, **the production runtime error text and the production `DATABASE_URL` were not obtainable from this environment**: the Vercel CLI is installed but reports `Logged out.`, no Vercel token exists (env vars, `%APPDATA%\com.vercel.cli\auth.json`, `~/.vercel`, `.vercel/` all absent), the GitHub repository has **no Actions runs** (`.github/` is untracked), and no deployed route discloses error details to an unauthenticated caller.

Therefore **no production root cause is claimed**. What *was* proven is a set of repository/deployment defects that any one of (or a combination of) explains the symptoms, plus one controlled timing observation that leans toward a pre-connection failure. The phase ends **blocked on production access** with an exact list of what the operator must supply.

**Verdict: `PHASE 16 PARTIALLY VERIFIED — PRODUCTION ACCESS BLOCKED`**

---

## 2. Scope

In scope: deployment identity, production runtime behaviour of DB routes, production `DATABASE_URL` metadata (scheme/host only), Prisma provider verification, migration inventory and migration state, root-cause determination, (conditional) minimal safe fix, post-fix verification, local code quality.

Out of scope (explicitly untouched): SEO/metadata/structured-data code, homepage, `src/app/sitemap.ts`, `src/proxy.ts`, UI, unrelated lint debt, and **all** destructive database operations (no `migrate reset`, no `db push`, no truncate/drop/delete, no production migration).

---

## 3. Deployment Identity

| Question | Answer | Evidence |
|---|---|---|
| Deployed commit SHA | **`965f0b65d8d3b303ae6256ac231bfcccaa842724`** | GitHub REST `GET /repos/…/deployments` → newest deployment `id=6778953076`, `sha=965f0b6…`, **`environment=Production`**, `created=2026-10-01T07:45:24Z` |
| Vercel build status | success | GitHub commit status `context=Vercel`, `state=success`, `target=https://vercel.com/kamalforhad-glitchs-projects/lens-platform/AC1Jnjz8SQcUr6jc7c7yfAJxwXYa`, `updated=2026-10-01T07:45:24Z` |
| Production branch | `main` (pushed, `origin/main` up to date) | `git log origin/main --oneline -10` |
| Previous production deployment | `e4d24b5` (`id=6777756377`, `2026-10-01T06:29:34Z`) | same API |
| Does production contain the Phase 15 metadata changes? | **YES** | live HTML contains `<link rel="canonical" href="https://www.lensbd.org/">` (component `HomeCanonical` **added only in `965f0b6`**), plus `<title>`/`description` beginning `LENS — Lighthouse…` (U+2014) matching the root `metadata` export **added only in `965f0b6`** |
| Are untracked files deployed? | **NO** | `GET /api/health` → **404** with `X-Matched-Path: /404`; `src/app/api/health/` is untracked (`??`) |

Independent corroboration: live `/sitemap.xml` `<lastmod>2026-10-01T07:44:58.173Z</lastmod>` = the `965f0b6` build timestamp (sitemap is statically prerendered, see §7).

---

## 4. Production Runtime Evidence

All probes: Googlebot/browser UA, no credentials, `https://www.lensbd.org`, 2026-10-01.

| # | Route | Status | Body / note | Warm latency |
|---|---|---|---|---|
| 1 | `GET /api/researchers` | **500** | `{"error":"Failed to fetch researchers"}` (39 B), `X-Vercel-Cache: MISS` | **~303 ms** (median) |
| 2 | `GET /api/admin/settings` | **500** | **empty body** (uncaught throw — deployed `GET` has no `try/catch` and no auth) | ~310 ms |
| 3 | `GET /api/admin/search?q=a` | **401** | `{"error":"Unauthorized"}` — auth route healthy | ~80 ms |
| 4 | `GET /` | **200** | full HTML, canonical + Phase 15 metadata present | ~79 ms |
| 5 | `GET /api/health` | **404** | route not in deployed build | ~80 ms |
| 6 | `GET /sitemap.xml` | **200** | well-formed XML, **18 URLs**, research entries = the **4 hardcoded fallbacks only** | ~90 ms |
| 7 | `GET /robots.txt` | **200** | 251 B | ~90 ms |
| 8 | `GET /api/analytics/overview` | 200 `null` | `X-Vercel-Cache: HIT`, `Age: 1081` → **CDN-cached error payload**; proves nothing about the DB | n/a (cached) |
| 9 | `GET /api/admin/ai/stats` | 200 zeros | `Cache-Control: no-store` → executed fresh; body is the route's **`catch` fallback** | ~70–110 ms |
| 10 | `GET /research/media-index-bangladesh-2025` | **404** | research detail route/data unavailable | — |
| 11 | `GET /blog/<unknown-slug>` | 200, **empty `<title>`** | skeleton, no `notFound()` → `db.blogPost.findUnique` threw inside `generateMetadata` | ~1.5 s |
| 12 | `GET /researchers/<unknown-slug>` | 200, generic title | skeleton, no DB content | ~1.5 s |
| 13 | `GET /blog`, `/research`, `/researchers` | 200 | SSR HTML contains **zero** content-slug links → no DB content rendered server-side | — |

### 4.1 Decisive probe: production server action `login` (read of table `users`)

The deployed client chunk `/_next/static/immutable/chunks/0val477z09rp_.js` registers:

```
(0,r.createServerReference)("60a0092fb8fcdff8e23a5bcca1f3633658e28233f6", … , "login")
```

`POST https://www.lensbd.org/admin/login` with header `Next-Action: 60a0092f…` and body `["phase16-probe@example.invalid","phase16-wrong-password"]` (non-existent email ⇒ **read-only**, no write, no lock-out) returns HTTP 200 / `text/x-component`:

```
1:{"success":false,"error":"An internal error occurred. Please try again."}
```

That string is produced **only** by the `catch` of `login()` in `src/lib/actions/auth.ts`, i.e. `db.user.findUnique({ where: { email } })` **threw**. The expected result for an unknown user would have been `"Invalid email or password"`.

**Consequence: production cannot read the `users` table** — a table created by the *first* migration (`20250101000000_init`). The failure is therefore not specific to recently-added models.

### 4.2 Controlled timing experiment (same route, same lambda)

Alternating `login` (DB read) vs `logout` (no DB — no session cookie ⇒ early return before any query) server-action POSTs to the **same** URL:

```
login  ms: 910,377,369,355,368,397   → median ≈ 373 ms
logout ms: 392,362,377,362,538,713   → median ≈ 370 ms
```

**Delta ≈ 0 ms** — a failing DB read adds no measurable time inside one route.

Weaker cross-route data: `/api/auth/check` (no DB) median **78.5 ms** vs `/api/researchers` (DB) median **303 ms**, but `/api/auth/check` itself ranged 74–488 ms, so cross-route deltas are noise-dominated.

Local ground truth (§6.1): a datasource **validation** failure takes **34–45 ms** locally; an **unreachable Postgres** takes **~2.08 s** (`Can't reach database server`, P1001). Production DB routes never show multi-second stalls.

**Reading (indication, NOT proof):** production behaves like a *pre-connection* failure (URL/provider validation, missing env, or unusable Prisma Client) rather than a network timeout. Not proof: a near-region Postgres refusing/auth-failing in one round trip cannot be excluded at this noise level.

---

## 5. DATABASE_URL Configuration Check — BLOCKED

| Item | Result |
|---|---|
| Vercel Production env access | **NOT AVAILABLE** — `npx vercel whoami` → `Vercel CLI 62.1.0 … Logged out.` (exit 1); no `VERCEL*` env vars; `%APPDATA%\com.vercel.cli\auth.json` missing; `~/.vercel` missing; `.vercel/` missing |
| `DATABASE_URL` present in Production? | **UNKNOWN** |
| Scheme (`postgresql:` / `file:` / other) | **UNKNOWN** |
| Host / database name | **UNKNOWN** |
| SSL parameters | **UNKNOWN** |
| Intended production scheme | **`postgresql://`** — `PRODUCTION_CHECKLIST.md` §1 ("Set `DATABASE_URL=postgresql://…` in Vercel env (all environments)"), `.env.example`, `.github/workflows/ci.yml` |
| Local `.env` scheme | **`file:`** (SQLite). Key names only inspected: `DATABASE_URL`, `JWT_SECRET`, `NEXT_PUBLIC_SITE_URL`. Local dev uses `prisma/dev.db`; `*.db` is gitignored and never deployed |
| Vercel caveat | env changes require a **redeployment** before they take effect |

No value was invented, substituted, or printed. Per safety rule 6 this alone blocks any production change.

---

## 6. Prisma Provider Verification

| Artefact | Provider | Proof |
|---|---|---|
| **Deployed** `prisma/schema.prisma` (commit `965f0b6`) | **`sqlite`** | `git show 965f0b6:prisma/schema.prisma` → `datasource db { provider = "sqlite" }` |
| Working tree `prisma/schema.prisma` (uncommitted) | `postgresql` | `git diff prisma/schema.prisma` → `- provider = "sqlite"` / `+ provider = "postgresql"` |
| Local generated client `node_modules/.prisma/client` | `postgresql` | generated from the working tree |
| Client generated during production build? | **NOT VERIFIED** | `package.json` has **no** `postinstall`; `build` = `next build`; `vercel.json` has no build override. Prisma docs warn Vercel dependency caching can skip auto-generation |
| Multiple Prisma clients / DB helpers? | **One** | only `src/lib/db.ts:9` constructs `PrismaClient`; `src/lib/actions/library.ts:4` imports the `Prisma` namespace only |
| Pooling / caching | **None** | `src/lib/db.ts` has no `connection_limit`/pooler/Accelerate settings; `globalThis.prisma` is cached **only** when `NODE_ENV !== "production"` ⇒ new client per invocation in production |
| Recent DB changes still uncommitted? | **YES (large)** | `prisma/schema.prisma` (provider flip + `DownloadLog` FK fix + R2 columns + `Unsupported("vector(1536)")`), both new migration dirs, `src/lib/env.ts`, `src/app/api/health/`, admin auth hardening, `src/lib/schemas.ts`, `vercel.json` crons removed — 46 modified + 26 untracked entries, all pre-existing (identical to the state at the start of this phase) |

### 6.1 Local reproduction matrix (deployed artefact vs candidate env values)

The **deployed** client (`git show 965f0b6:prisma/schema.prisma`, provider `sqlite`) and the **working-tree** client (provider `postgresql`) were generated into scratch dirs under `node_modules/.phase16/`; `researcherProfile.findMany()` was executed per case in a child process whose `cwd` is outside the repo (so no local `.env` can leak in). All credentials synthetic.

| Case | Client | DATABASE_URL | Result | Elapsed |
|---|---|---|---|---|
| **A** | **deployed (sqlite)** | `postgresql://…@db.example.com:5432/…` | `error: Error validating datasource db: the URL must start with the protocol 'file:'` (no Prisma error code) | **34 ms** |
| **B** | deployed (sqlite) | unset | `P2021 The table 'main.researcher_profiles' does not exist in the current database.` | 45 ms |
| **C** | deployed (sqlite) | `file:` (missing file) | `P2021 The table 'main.researcher_profiles' does not exist…` | 33 ms |
| **D** | working tree (postgres) | `file:` | `error: … the URL must start with the protocol 'postgresql://' or 'postgres://'` | 34 ms |
| **E** | working tree (postgres) | closed port `127.0.0.1:59999` | `Can't reach database server at '127.0.0.1:59999'` (**P1001**) | **2079 ms** |
| **F** | working tree (postgres) | unset | `error: … the URL must start with the protocol 'postgresql://' or 'postgres://'` | 45 ms |

**Interpretation:** the deployed build can only ever talk to a `file:` URL. If Production `DATABASE_URL` is `postgresql://` (as documented) → case A: instant validation error on *every* query, matching §4. If it is missing/`file:` → cases B/C/F: instant `P2021`/validation error, also matching §4. **Both are consistent with production behaviour; neither is proven without the production env/logs.**

---

## 7. Migration Inventory

`prisma/migrations/` contains **6** directories:

| # | Migration | Tracked in git? | Content |
|---|---|---|---|
| 1 | `20250101000000_add_pgvector` | yes | `CREATE EXTENSION vector` + `ALTER TABLE document_embeddings DROP/ADD COLUMN` (**PostgreSQL-only**) |
| 2 | `20250101000000_init` | yes | `CREATE TABLE` ×12 (`users`, `sessions`, `research_articles`, `publications`, `events`, `team_members`, `media_files`, `download_logs`, `newsletter_subscribers`, `contact_submissions`, `email_logs`, `backup_records`) |
| 3 | `20260921000000_phase7_ai_i18n` | yes | `CREATE TABLE IF NOT EXISTS` ×6 (`ai_conversations`, `ai_messages`, `document_embeddings`, `researcher_profiles`, `impact_metrics`, `translations`) |
| 4 | `20260921000000_research_workflow` | yes | `ALTER TABLE research_articles …` + `CREATE TABLE` ×6 workflow tables |
| 5 | `20261001_pg_standardization` | **NO (`??`)** | idempotent pgvector/pg_trgm/FK/index repair |
| 6 | `20261002_backup_r2_fields` | **NO (`??`)** | `ADD COLUMN IF NOT EXISTS` ×3 + index |

Proven inventory defects:

1. **`migration_lock.toml` is absent.** (Empirically Prisma 6.19.3 `migrate deploy` still proceeds to connect without it — hygiene defect, not a hard blocker.)
2. **Duplicate migration timestamps:** `20250101000000_{add_pgvector,init}` and `20260921000000_{phase7_ai_i18n,research_workflow}`.
3. **Broken order on a fresh database:** sorted directory order applies `20250101000000_add_pgvector` **before** `…_init` and before `document_embeddings` exists. Executed locally against a fresh PostgreSQL (`prisma migrate deploy`): **`Applying migration 20250101000000_add_pgvector` → `Error: P3018`** (locally at `extension "vector" is not available`; on a pgvector-enabled server the next statement, `ALTER TABLE "document_embeddings" DROP COLUMN`, would fail with *relation does not exist*). Migration #1 fails ⇒ **a fresh database can never be provisioned by `prisma migrate deploy` as the history stands.**
4. **9 of 34 models have no `CREATE TABLE` anywhere** (tracked *or* untracked): `pages`, `page_sections`, `site_settings`, `menu_items`, `programs`, `blog_posts`, `media_items`, `resources`, `careers`.

---

## 8. Production Migration Status

**NOT VERIFIABLE — no production database access** (no `DATABASE_URL`, no Vercel token, no DB client reachable).

| Question | Status |
|---|---|
| Migrations applied to production | **UNKNOWN** |
| Migrations pending | **UNKNOWN** |
| Migration history mismatch / missing `_prisma_migrations` | **UNKNOWN** |
| `migration_lock.toml` state in production build | absent in git ⇒ absent in the deployed build (proven by `git ls-files`) |
| Tables expected by the application but missing in production | **UNKNOWN** (production schema unreadable) |

`npx prisma migrate status` cannot be run: it requires a reachable database; locally the `.env` URL is `file:` while the schema provider is `postgresql`, so the command fails validation first (case D).

---

## 9. Actual Database Schema Findings

Production schema: **UNKNOWN** (no access). The only *executed* schema experiment was **local**, on a throwaway PostgreSQL:

Command: create local scratch DB → copy `prisma/schema.prisma` + 4 of the 6 migrations (the two `CREATE EXTENSION vector`-dependent ones cannot run on this machine) → `npx prisma migrate deploy` → read `pg_tables`.

```
Applying migration 20250101000000_init
Applying migration 20260921000000_phase7_ai_i18n
Applying migration 20260921000000_research_workflow
Applying migration 20261002_backup_r2_fields
All migrations have been successfully applied.
```

Resulting tables: **25 application tables for 34 models → 9 tables missing**:

`pages, page_sections, site_settings, menu_items, programs, blog_posts, media_items, resources, careers`

Consequences that hold **regardless** of which production fix is chosen:

- `/api/admin/settings` (model `SiteSetting` → `site_settings`) and `/blog/[slug]` (`blog_posts`) **cannot work** on a database provisioned purely from this migration history — they will always raise `P2021`.
- `/api/researchers` (`researcher_profiles`) and the `login` probe (`users`) **would** work if migrations had been applied — but they do **not** work in production. So production is either *unmigrated* or failing *before* the query.

Column check (defensive): `researcher_profiles` as created by `20260921000000_phase7_ai_i18n` contains **every** column `/api/researchers` selects/orders by (`featured`, `total_downloads`, `total_citations`, `status`, …). A column-level mismatch on that table is therefore **disfavoured** by evidence.

---

## 10. Root-Cause Matrix

| Finding | Evidence | Status |
|---|---|---|
| `DATABASE_URL` missing in Production | Vercel env unreadable; missing-URL and wrong-scheme both produce the same instant, generic failure (cases B/F/A) | **NOT PROVEN** |
| `DATABASE_URL` points to wrong provider (`postgresql:` vs sqlite client / `file:` value) | Deployed schema provider = **`sqlite`** (proven) while intended scheme = `postgresql://` (documented); local case A reproduces an instant validation failure that matches production exactly | **NOT PROVEN** (deployed-side proven, production value unknown) |
| PostgreSQL unreachable | No multi-second stalls anywhere; local P1001 reproduction = ~2.08 s vs production ≤ 0.4 s typical | **NOT PROVEN — evidence against** |
| Authentication failure (P1000) | Requires a completed round trip; not observable from outside | **NOT PROVEN** |
| Migrations never applied (missing migration) | Every model read fails, including `users` (first migration); equally consistent with a pre-query failure | **NOT PROVEN** |
| Table missing (the 9 models with no `CREATE TABLE`) | **Proven repo/migration defect**, reproduced locally (9/34 tables absent after a clean apply). Explains `site_settings`/`blog_posts`, **cannot** explain `users`/`researcher_profiles` failures | **PROVEN as a repository defect; NOT PROVEN as the production state** |
| Column missing | `researcher_profiles` columns in the migration match what the code queries | **NOT PROVEN — evidence against (that table)** |
| Deployed code/schema mismatch | Deployed commit ships `provider = "sqlite"`; postgres flip + 2 migrations + `env.ts` + `/api/health` are uncommitted/untracked (`/api/health` → 404 in production) | **PROVEN as a deployment fact; causality NOT PROVEN** |
| Prisma Client generation problem | No `postinstall`, no build-time generate, no `vercel.json` override; Vercel dependency caching documented to skip auto-generation; a non-generated client throws at construction with an equally generic signature | **NOT PROVEN** |
| Migration history broken on fresh DB (order) | `prisma migrate deploy` on a fresh local Postgres applied `…_add_pgvector` **first** → `P3018` failure | **PROVEN (migration-history defect)** |
| Production runtime error (exact Prisma code P1000/P1001/P1012/P2021/…) | Vercel CLI logged out, no token, no Actions logs, no error-disclosing endpoint | **NOT OBTAINED — BLOCKED** |
| CDN-cached error responses masking state | `/api/analytics/overview` returns a cached `null` (`Age: 1081`) | **PROVEN (measurement caveat)** |

---

## 11. Proven Root Cause

**No production root cause is proven.** Declaring one would require either the Vercel runtime log for `/api/researchers` or the production `DATABASE_URL` scheme — neither is obtainable here, and safety rule 6 forbids fabricating a diagnosis.

What *is* proven (all repository/deployment-level, each independently sufficient to keep production broken):

1. The **deployed artefact is provider-inconsistent with the documented production datasource** (deployed `provider = "sqlite"` vs intended `postgresql://`).
2. **The migration history cannot provision a database** (`add_pgvector` applies before `init`) and **cannot create 9 of the 34 model tables** even when it does apply.
3. **Production DB reads fail for every model probed** — `users`, `researcher_profiles`, `site_settings` — with no measurable connection latency.
4. **The working tree containing every intended DB fix is uncommitted**, so none of it is deployed.

Leading (unproven) hypothesis: **C1 — deployed sqlite client + `postgresql://` Production URL (case A)**, with **C2/C3 (unapplied migrations / missing tables)** as the necessary *second* step that must be verified before production can return 200.

---

## 12. Resolution Applied

**NONE.** No production change, no local source change, no migration applied to production, no commit.

Per TODO 7 the fix may only be chosen *after* the root cause is proven; it is not. Per safety rule 6, work stopped and the missing access is reported instead.

### Exact operator actions required to unblock (not performed here)

1. **Vercel → Settings → Environment Variables → Production** (or `vercel login` + `vercel env ls production`): report **only** — does `DATABASE_URL` exist, and what is its **scheme** (`postgresql:` vs `file:`)? Do not paste the value.
2. **Vercel → Deployments → `965f0b6` → Runtime Logs**, filter `/api/researchers` and `admin/login`: capture the Prisma code/message (`P1001` / `P1012` / `P2021` / "URL must start with the protocol" / "Environment variable not found").
3. With the production URL available to a shell (never echo it): `npx prisma migrate status` → applied vs pending.
4. Then execute the matching branch of §13.

---

## 13. Why the Resolution Is Safe

Not applicable — no resolution was applied. The phase therefore satisfies the safety rules by construction: no reset, no `migrate reset`, no `db push`, no DDL against production, no row/table deletion, no invented or printed `DATABASE_URL`, no SEO/UI code touched, no commit.

For the *next* phase, the plan below is recorded but **not executed**:

| Step | Action | Non-destructive because |
|---|---|---|
| 1 | Confirm production `DATABASE_URL` scheme + reachability | read-only |
| 2 | `npx prisma migrate status` against production | read-only |
| 3 | If postgres + unmigrated: repair history so `add_pgvector` no longer precedes `init` (e.g. guard it with `DO $$ … EXCEPTION` / make it idempotent — **edit only if it was never applied**; otherwise add a forward migration) | additive only |
| 4 | Add **one new** migration `CREATE TABLE IF NOT EXISTS` for the 9 missing tables | additive only, matches §9 |
| 5 | Commit the existing (already-written) provider flip + `migration_lock.toml` + 2 untracked migrations | code-only, no data change |
| 6 | Deploy, then `prisma migrate deploy` (never `db push`, never `reset`) | applies existing forward migrations only |
| 7 | Verify per §16 | read-only |

---

## 14. Files Changed

| File | Change |
|---|---|
| `PHASE_16_PRODUCTION_DB_RESOLUTION_REPORT.md` | **created** (this report) |

**No other file was created, edited, staged or deleted.** `git diff --stat` at the end of the phase is byte-identical to the state at the start (46 modified / 26 untracked, all pre-existing from earlier phases).

Non-repository scratch artifacts created for diagnosis (all outside git tracking):

- `node_modules/.phase16/**` (schema copies, two generated Prisma clients, test runners) — inside `node_modules`, git-ignored.
- Local PostgreSQL databases `phase16_scratch_verify` and `phase16_scratch_plan` (**creation only**; no pre-existing database, table or row was touched; **not dropped**, so no destructive operation occurred — remove with `DROP DATABASE phase16_scratch_verify; DROP DATABASE phase16_scratch_plan;` if desired).
- `C:\Users\Mypc\AppData\Local\Temp\opencode\*` (captured production HTML/sitemap/robots/chunk files).

---

## 15. Commands Executed

Sanitized (no secrets, synthetic URLs only):

```
git status / git log --oneline -10 / git branch -r --contains <sha> / git show <sha>:prisma/schema.prisma
git diff -- prisma/schema.prisma package.json vercel.json src/lib/db.ts
git ls-files prisma/migrations        git grep … (error handling, cache headers)
GitHub REST: /repos/…/deployments , /repos/…/commits/965f0b6/status
HTTP probes: / , /api/researchers , /api/admin/settings , /api/admin/search?q=a ,
             /api/health , /sitemap.xml , /robots.txt , /api/auth/check ,
             /api/analytics/overview , /api/admin/ai/stats , /api/search/* ,
             /blog , /research , /researchers , /research/<slug> , /blog/<slug>
Server-action probe: POST /admin/login  Next-Action: 60a0092f…  (invalid, read-only creds)
npx vercel whoami                       → Logged out (exit 1)
npx prisma validate                     (fails with local file: URL; passes with CI synthetic pg URL)
npx prisma generate --schema <scratch>  (deployed sqlite client + working-tree pg client)
node <reproduction matrix>              (cases A–F, §6.1)
CREATE DATABASE phase16_scratch_verify / phase16_scratch_plan   (local, additive)
npx prisma migrate deploy               (local fresh DB → P3018 at add_pgvector)
npx prisma migrate deploy --schema <scratch plan>                (4 migrations applied)
node <list pg_tables>                   (25 tables / 9 missing, §9)
npx tsc --noEmit        npm test        npm run lint        npm run build
```

---

## 16. Production HTTP Verification

Current state (no fix applied, so this is the **pre-fix baseline**):

| # | Check | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | `GET /api/researchers` | 200 + JSON | **500** `{"error":"Failed to fetch researchers"}` | **FAIL** |
| 2 | `GET /` | 200 | 200 | PASS |
| 3 | DB-backed research/detail route | 200 + real content | `/research/<slug>` **404**; `/blog/<slug>` 200 with empty title/skeleton | **FAIL** |
| 4 | `GET /sitemap.xml` | 200 + valid XML | 200, well-formed, 18 URLs | PASS (but still 4 fallback research URLs) |
| 5 | `GET /robots.txt` | 200 | 200 | PASS |
| 6 | `GET /` as Googlebot | 200 | 200 | PASS |
| 7 | No new 500 DB errors in Vercel logs | logs readable | **logs inaccessible** | **BLOCKED** |
| 8 | `/api/admin/settings` auth preserved | 401 anon | **500** (deployed `GET` has no auth; working-tree version adds it but is not deployed) | **FAIL — flagged, not changed** |

---

## 17. Googlebot Verification

- `User-Agent: Googlebot` → `GET https://www.lensbd.org/` → **HTTP 200**, full HTML, `X-Vercel-Cache: HIT`.
- Head contains `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">` and the matching `googlebot` meta (deployed from `965f0b6`).
- Canonical `https://www.lensbd.org/` present on the homepage only.
- `robots.txt` 200, `Allow: /`, `Sitemap: https://lensbd.org/sitemap.xml`.
- **No SEO code was changed in this phase** — Google's "Crawled — currently not indexed" status is a *render/index* concern, and DB-backed pages still render empty skeletons; that remains unaddressed until the DB is fixed.

---

## 18. Local TypeScript / Test / Build Verification

| Check | Command | Result |
|---|---|---|
| TypeScript | `npx tsc --noEmit` | **PASS** (exit 0, no output) |
| Tests | `npm test` (vitest) | **PASS** — 7 files, **31 tests passed** |
| Prisma schema | `npx prisma validate` with CI-style synthetic `postgresql://` URL | **PASS** ("The schema … is valid"); **fails** with the local `.env` `file:` URL (pre-existing local mismatch, case D) |
| Production build | `npm run build` (synthetic pg URL, as CI would) | **PASS** (exit 0; 77 static pages). Build log showed one caught DB error during static generation: `prisma:error … User was denied access on the database (not available)` for `prisma.researchArticle.findMany()` — expected, the synthetic URL is not a real database |
| ESLint | `npm run lint` | **FAIL — pre-existing**: `✖ 74 problems (33 errors, 41 warnings)`, concentrated in `prisma/seed.js` and admin pages (`react-hooks/set-state-in-effect`, `no-explicit-any`). **Not touched** per the brief (no source file was modified by this phase) |
| Windows EPERM | — | **not encountered**; `node_modules` untouched |

Build note that matters for the fix: `next build` reports **`○ /sitemap.xml` (static)** — its database branch executes **at build time**, which is why the live sitemap shows the fallback slugs and a build-time `lastmod`. After the DB is fixed, a **redeploy** is required before `/sitemap.xml` reflects real research URLs.

---

## 19. Remaining Blockers

1. **No Vercel access** — CLI logged out, no token, no `.vercel/` project link ⇒ no runtime logs (TODO 3), no environment metadata (TODO 4), no deployment re-trigger.
2. **No production database access** — `DATABASE_URL` unknown ⇒ no `prisma migrate status` (TODO 5), no schema comparison (TODO 9 of the plan), no connectivity proof.
3. **No error-disclosing endpoint** — every route returns a generic message or empty body; server actions were probed and also return generic errors.
4. **Root cause therefore unproven** ⇒ TODO 7 (resolution) intentionally not executed.
5. Secondary (documented, not blocking the diagnosis): production `GET /api/admin/settings` is **unauthenticated**; the working-tree fix is not deployed.

---

## 20. Phase 16 Final Verdict

# PHASE 16 PARTIALLY VERIFIED — PRODUCTION ACCESS BLOCKED

- **Verified:** deployment identity (`965f0b6`, Production, 2026-10-01T07:45:24Z), Phase 15 metadata present in production, production HTTP behaviour of every probed route, a live production DB-read failure on the `users` table, the deployed `sqlite` provider, the full migration inventory, the broken migration order (reproduced), the 9 missing tables (reproduced), and local TS/test/build health.
- **Not verified:** the exact production Prisma error, the production `DATABASE_URL` scheme/host, the production migration status, and therefore the production root cause.
- **Not done by design:** any production or source change.

---

# FINAL CHANGE CONTROL

```
git diff --stat   → 46 files changed, 1553 insertions(+), 427 deletions(-)   (identical to phase start)
git status        → 46 modified, 26 untracked; 0 staged; 0 deleted
```

- Every changed file listed in §14: **only this report** was added by Phase 16; the 46 modified + 26 untracked entries were already present when the phase began.
- **No secrets added** — no `.env*`, token, key or connection string was written to any file.
- **No destructive database operation occurred** — no reset, no `migrate reset`, no `db push`, no `DROP`/`TRUNCATE`/`DELETE`; only two local scratch databases were *created*.
- **No SEO redesign mixed in** — `src/app/layout.tsx`, `src/app/page.tsx`, structured data and metadata code untouched.
- **`src/app/sitemap.ts` unchanged** — the DB fix does not yet exist to justify touching it.
- **Architecture preserved** — one Prisma client, same routes, same `vercel.json`/`next.config.ts`, nothing refactored.
- **Nothing committed.**

## A. Root cause

**Not proven** (production logs/env/DB inaccessible). Leading unproven hypothesis: deployed `provider = "sqlite"` client vs documented `postgresql://` Production `DATABASE_URL` (reproduced as case A), with unapplied/insufficient migrations as the necessary second factor. Proven defects: provider mismatch in the deployed artefact, migration order that cannot provision a database, 9 missing tables, all DB fixes uncommitted.

## B. Fix applied

**None.** Blocked by safety rule 6; exact operator actions listed in §12 and the conditional plan in §13.

## C. Production verification

Pre-fix baseline only: `/` 200, `/sitemap.xml` 200 (valid), `/robots.txt` 200, Googlebot 200; **`/api/researchers` 500**, `/api/admin/settings` 500, detail routes empty/404, `/api/health` 404. Post-fix verification impossible until a fix exists.

## D. Remaining blockers

Vercel authentication/token; production `DATABASE_URL` (scheme only needed); production runtime logs; production migration status.

## E. Exact next phase recommendation

**PHASE 17 — PRODUCTION DB ACCESS & PROOF (read-only):** obtain Vercel access, capture the `/api/researchers` runtime error code, record the `DATABASE_URL` scheme (never the value), run `npx prisma migrate status` against production, and confirm whether the production database exists and is reachable. Deliverable: a **PROVEN** root-cause row in the §10 matrix. Only then, **PHASE 18 — MIGRATION REPAIR & DEPLOY** (steps 1–7 of §13: guard/repair `add_pgvector`, add the 9-table migration, commit the existing provider flip, deploy, `prisma migrate deploy`, then re-run §16/§17 verification).


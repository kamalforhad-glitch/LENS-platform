# PHASE 17 — PRODUCTION DB READ-ONLY PROOF & EVIDENCE CAPTURE

**Mode:** READ-ONLY / NO CODE CHANGES / NO MIGRATIONS / NO ENV CHANGES / NO COMMITS
**Date:** 2026-10-01
**Repository:** `D:\downloads\civic-youth-bangladesh\lens\lens_website` (branch `main`, HEAD = `965f0b6`, remote `origin` = `https://github.com/kamalforhad-glitch/LENS-platform.git`)
**Secrets policy:** no credential, token, password, hostname-with-credentials, query string or connection string value was read, printed, or guessed.

---

## 1. Executive Summary

Phase 17 received confirmed Vercel production runtime logs showing that every database-backed route fails at **Prisma Client initialization**, before any query is sent:

```text
PrismaClientInitializationError
Environment variable not found: DATABASE_URL
schema.prisma:7
provider = "sqlite"
```

This is the **proven production root cause**: the Vercel Production environment has **no `DATABASE_URL` variable**, and the deployed schema (commit `965f0b6`) declares `provider = "sqlite"` with `url = env("DATABASE_URL")` at `prisma/schema.prisma:7`. Prisma throws while constructing the client, so `users`, `researcher_profiles`, `site_settings`, `blog_posts`, and every other model read fail identically and instantly — exactly matching the Phase 16 timing evidence (≈0 ms DB penalty) and the Phase 16 server-action probe (admin `login` returning its `catch` branch).

Supporting facts re-verified this phase: production deployment = commit `965f0b6` (GitHub Deployments API, `environment=Production`); intended production DBMS = **PostgreSQL** (documented in `PRODUCTION_CHECKLIST.md` §1, `.env.example`, CI workflow); the migration history still cannot provision a fresh database (broken ordering) and still lacks `CREATE TABLE` migrations for **9 of 34 models**.

**Verdict: `PHASE 17 VERIFIED — ROOT CAUSE PROVEN`**

(The project is **not** production-ready: production has no database configuration at all, no database is provably reachable, and no fix has been applied.)

---

## 2. Production Deployment Baseline

| Item | Value | Evidence source |
|---|---|---|
| Deployed commit | **`965f0b65d8d3b303ae6256ac231bfcccaa842724`** (`965f0b6`) | GitHub REST `GET /repos/kamalforhad-glitch/LENS-platform/deployments` (re-queried this phase): newest deployment `id=6778953076`, `sha=965f0b6…`, `environment=Production`, `created_at=2026-10-01T07:45:24Z` |
| Deployment build status | `success` (context `Vercel`, updated `2026-10-01T07:45:24Z`) | GitHub REST `GET …/commits/965f0b6…/status` → `state=success` |
| Previous production deployments | `e4d24b5` (`6777756377`, 06:29:34Z), `5a107ec` (`6770261551`, 2026-09-30) | same API |
| Local repo vs deployed | local `main` HEAD = `965f0b6`; `git log origin/main..HEAD` = **0 commits** (nothing unpushed) | `git log -1 --format='%H'`, `git branch --show-current` |
| Working tree vs deployed | 73 uncommitted entries (46 modified + 27 untracked) — the postgres provider flip and both new migrations are **NOT deployed** | `git status --porcelain` (Phase 17 change control, §16) |

No deploy was performed or triggered in this phase.

---

## 3. Confirmed Vercel Runtime Error

Supplied by the operator from Vercel production runtime logs (primary finding, used verbatim):

```text
PrismaClientInitializationError
Environment variable not found: DATABASE_URL
schema.prisma:7
provider = "sqlite"
```

Interpretation of the cited location against the deployed file (`git show 965f0b6:prisma/schema.prisma`):

```prisma
 5: datasource db {
 6:   provider = "sqlite"
 7:   url      = env("DATABASE_URL")     ← error location: env() reference
 8: }
```

- `schema.prisma:7` is the `env("DATABASE_URL")` lookup inside the datasource block whose `provider = "sqlite"` (lines 5–8).
- Failure class: `PrismaClientInitializationError` — thrown at **client construction**, i.e. before any network round trip. This matches Phase 16's controlled timing (login ≈ logout, ≈0 ms DB penalty) and the generic 500/empty-body responses (routes' own `catch` handlers convert the initialization failure).

**No Prisma error code (e.g. P1012) is asserted** — none appears in the supplied log, and inventing one is forbidden. Recorded exactly as supplied.

The same `DATABASE_URL` initialization failure also appeared in (per supplied logs, corroborated by Phase 16 probes):

- `GET /api/researchers` → HTTP 500 `{"error":"Failed to fetch researchers"}`
- admin `login` server action (`db.user.findUnique` lookup) → `"An internal error occurred. Please try again."`
- blog / research detail DB lookups (`generateMetadata` / page data) → empty `<title>` / 404 skeletons

---

## 4. Affected Production Routes

Confirmed failing (runtime-log confirmed this phase, HTTP-verified in Phase 16):

| Route | Symptom | DB models touched |
|---|---|---|
| `GET /api/researchers` | **500** generic error body | `researcher_profiles` |
| `POST /admin/login` (server action `login`) | catch-branch generic error | `users` |
| `GET /blog/[slug]`, `GET /research/[slug]`, `GET /researchers/[slug]` | 200 with empty/skeleton content, or 404 | `blog_posts`, research tables, `researcher_profiles` |
| `GET /api/admin/settings` | **500** empty body (uncaught) | `site_settings` |
| `/sitemap.xml` (DB branch) | build-time only → fallback slugs, no real research URLs | `research_articles` |

Not DB-dependent and unaffected: `/` 200, `/robots.txt` 200, `/api/admin/search` 401 (auth path), `/api/health` 404 (route not in deployed build — file untracked).

---

## 5. Vercel Environment Variable Evidence

No secret values retrieved or printed (Vercel CLI status: `npx vercel whoami` → `Logged out.`, exit 1 — no token, no dashboard/CLI access from this environment; no CLI was installed or authenticated for this phase).

| Variable | Production | Preview | Development |
|---|---|---|---|
| `DATABASE_URL` exists? | **MISSING — PROVEN** by the supplied runtime log: `Environment variable not found: DATABASE_URL` | `UNKNOWN` (not observable) | `UNKNOWN` (not observable; local `.env` has its own `file:` value — local only, never deployed) |
| Scheme (if present) | n/a — **variable absent** | `UNKNOWN` | local only: `file:` (key name inspected in Phase 16; value not printed) |

Notes:
- "Environment variable not found" is Prisma's error when `process.env.DATABASE_URL` is `undefined` at client construction → the Production environment does not define it (or does not define it under that exact name, case-sensitive).
- It does **not** prove a PostgreSQL instance does or does not exist — only that the app is not configured to reach one.
- Dashboard confirmation of Preview/Development is left to the operator (§15); no further access attempt was made.

---

## 6. Local Prisma Configuration

| Item | Finding |
|---|---|
| Working-tree `prisma/schema.prisma` | `datasource db { provider = "postgresql"; url = env("DATABASE_URL") }` (provider at line 6, `env()` at line 7). **Uncommitted — NOT deployed.** |
| Deployed `prisma/schema.prisma` (`965f0b6`) | `provider = "sqlite"` (line 6), `url = env("DATABASE_URL")` (line 7) — matches the runtime error |
| Datasource provider (as shipped) | **`sqlite`** |
| `DATABASE_URL` usage | only through `env("DATABASE_URL")` in the schema datasource; `src/lib/env.ts:35-38` additionally validates `process.env.DATABASE_URL` and throws `"DATABASE_URL environment variable is required"` (that file is **untracked**, so production never ran it) |
| Prisma version | **`prisma` 6.19.3** and **`@prisma/client` 6.19.3** (installed; `package.json` declares `^6.0.0` in `devDependencies`) |
| `prisma.config.*` | **absent** (no `prisma.config.ts` / `prisma.config.js`; `@prisma/config` exists only as a transitive package inside `node_modules`) |
| Prisma-related scripts | `db:generate`, `db:push`, `db:migrate`, `db:migrate:prod` (`prisma migrate deploy`), `db:seed`, `db:studio`; `build = next build`; **no `postinstall`** ⇒ no guaranteed `prisma generate` on Vercel install |
| Migration structure | 6 directories under `prisma/migrations/`; **`migration_lock.toml` absent** |
| Migration ordering | duplicate timestamps; `20250101000000_add_pgvector` sorts **before** `20250101000000_init` (see §8) |
| PostgreSQL intended by docs? | **YES** — §10 |
| pgvector / pg_trgm dependencies | `CREATE EXTENSION IF NOT EXISTS vector` (in `add_pgvector` and `pg_standardization`), `CREATE EXTENSION IF NOT EXISTS pg_trgm` (in `pg_standardization`); `PRODUCTION_CHECKLIST.md` §1 requires provisioning a Postgres **with `vector` and `pg_trgm` extensions** |

---

## 7. Prisma Migration Inventory

| Migration | Purpose | Creates tables? | PostgreSQL-specific? | Ordering issue? |
|---|---|---:|---:|---:|
| `20250101000000_add_pgvector` | enable pgvector; convert `document_embeddings.embedding` to `vector(1536)` | No (only `CREATE EXTENSION vector` + `DROP/ADD COLUMN`) | **Yes** (extension + vector type) | **YES** — sorts before `init`; assumes `document_embeddings` already exists (created much later by `phase7_ai_i18n`) |
| `20250101000000_init` | baseline: 12 core tables | **Yes** (12) | No (portable DDL) | **YES** — duplicate timestamp `20250101000000`; runs *after* `add_pgvector` |
| `20260921000000_phase7_ai_i18n` | AI + i18n + researcher tables | **Yes** (6: `ai_conversations`, `ai_messages`, `document_embeddings`, `researcher_profiles`, `impact_metrics`, `translations`) | No (`IF NOT EXISTS` used) | Duplicate timestamp `20260921000000` |
| `20260921000000_research_workflow` | review/workflow feature: alters `research_articles`, adds 7 tables | **Yes** (7: `author_profiles`, `author_articles`, `research_versions`, `review_assignments`, `review_comments`, `citation_records`, `search_queries`) | No | Duplicate timestamp `20260921000000`; runs after `phase7` only by directory-name tie-break |
| `20261001_pg_standardization` | FK/index extension repair; `CREATE EXTENSION vector, pg_trgm` | No (`ALTER/CREATE INDEX`) | **Yes** (extensions) | Untracked (`??`) — **not in deployed build** |
| `20261002_backup_r2_fields` | add 3 R2 backup columns + index | No (`ADD COLUMN IF NOT EXISTS`) | No | Untracked (`??`) — **not in deployed build** |

Verification of the previously identified issues (all still present):

- ✅ **`add_pgvector` before `init`** — lexicographic order of `20250101000000_add_pgvector` vs `20250101000000_init` (underscore `_a` < `_i`). Reproduced in Phase 16: fresh local Postgres `migrate deploy` applied `add_pgvector` first → `P3018` failure; on a pgvector-enabled server it would then fail on `ALTER TABLE "document_embeddings" DROP COLUMN` (table does not exist yet).
- ✅ **Missing `CREATE TABLE` migrations for 9 models** — §9.
- ✅ **Duplicate migration timestamps** — two pairs (`20250101000000_*`, `20260921000000_*`).
- ✅ **Missing `migration_lock.toml`** — `Test-Path prisma/migrations/migration_lock.toml` → `False`; no lock file in git history either.
- ✅ **Migrations assuming extensions/tables already exist** — `add_pgvector` assumes `document_embeddings` exists (it does not until migration #3) and that `vector` is installed.

---

## 8. Migration Ordering Analysis

Apply order on a fresh database (pure lexicographic sort of directory names):

```
1. 20250101000000_add_pgvector   ← FAILS: extension/table prerequisites unmet
2. 20250101000000_init           ← 12 core tables (should have been first)
3. 20260921000000_phase7_ai_i18n
4. 20260921000000_research_workflow
5. 20261001_pg_standardization   (untracked)
6. 20261002_backup_r2_fields     (untracked)
```

Consequences:

1. **A fresh database can never be provisioned by `prisma migrate deploy` as history stands** — migration 1 fails (Phase 16 reproduction: `Error: P3018` on local Postgres without `vector`).
2. Tie-broken duplicate timestamps make ordering depend on directory-name suffixes, not intent — `init` must be first by design but sorts second.
3. `add_pgvector` is also **idempotent-hostile**: `DROP COLUMN` then `ADD COLUMN` with no `IF EXISTS` guard on `document_embeddings`.
4. No `migration_lock.toml` → Prisma cannot record which provider the history belongs to (it still proceeds without it in 6.19.3, but the history is provider-ambiguous: DDL is a mix of SQLite-era and PostgreSQL-era statements).
5. None of this affects the *current* production failure (which happens before any connection), but **every** Phase 18 provisioning path runs straight into it.

---

## 9. Missing Migration Analysis

Method (read-only, this phase): parse `prisma/schema.prisma` models (34, every model has an explicit `@@map`) and collect `CREATE TABLE` targets across all 6 `migration.sql` files (25 distinct tables); diff.

**25 of 34 model tables have migrations. 9 do not:**

| Missing table | Model | Impact already observed in production (once DB is configured) |
|---|---|---|
| `site_settings` | `SiteSetting` | `/api/admin/settings` → P2021 |
| `blog_posts` | `BlogPost` | `/blog/[slug]` has no data source |
| `pages` | `Page` | CMS pages |
| `page_sections` | `PageSection` | CMS sections |
| `menu_items` | `MenuItem` | navigation |
| `programs` | `Program` | programs listing |
| `media_items` | `MediaItem` | media library |
| `resources` | `Resource` | resources listing |
| `careers` | `Career` | careers listing |

These 9 models are served by admin CRUD routes (`src/app/api/admin/{pages,settings,blog,programs,resources,careers,media-items,menus}/route.ts`) that exist in the deployed build. Repair = one new forward migration with `CREATE TABLE IF NOT EXISTS` (Phase 18 scope only — not done here).

---

## 10. Intended Database Provider Evidence

| Source | Evidence |
|---|---|
| `PRODUCTION_CHECKLIST.md` §1 | Header: **"Database (PostgreSQL + pgvector)"**; item: *"Provision Postgres with `vector` and `pg_trgm` extensions"*; item: *"Set `DATABASE_URL=postgresql://...` in Vercel env (all environments)"*; item: *"Run `prisma migrate deploy` on staging first"*; item: *"Migrate data from `prisma/dev.db` if needed"* |
| `.env.example` | `# DATABASE (PostgreSQL)` / `DATABASE_URL=postgresql://user:password@localhost:5432/lens_db?schema=public` |
| `.github/workflows/ci.yml` | job env `DATABASE_URL: postgresql://user:password@localhost:5432/lens_db?schema=public` (untracked, but documents intent) |
| Working-tree `prisma/schema.prisma` | `provider = "postgresql"` (uncommitted flip of the deployed `sqlite`) |
| Phase 15 / Phase 16 reports | record the same intent and the `sqlite`-vs-`postgresql` mismatch |

**Determination:** the project **explicitly requires PostgreSQL** (`postgresql://` URL, pgvector + pg_trgm extensions, `prisma migrate deploy` workflow). This is proven documentation, not inference.

- DBMS provider: **PostgreSQL — PROVEN**
- Specific hosted service/vendor (e.g. Neon, Supabase, RDS, Vercel Postgres): **not documented anywhere in the repository → `PROVIDER NOT PROVEN`** at the service level (checklist says only "Provision Postgres").

---

## 11. Production Database Access Status

```
PRODUCTION DB ACCESS NOT AVAILABLE
```

- No production `DATABASE_URL` exists (§5), so there is no connection string to test — read-only connectivity checks (server version, current schema, `_prisma_migrations` existence/status) were **not attempted and not possible**.
- Vercel CLI: `Logged out.` — no token, no project link (`.vercel/` absent). Not installed/authenticated further, per §6 rules.
- No `migrate deploy`, `migrate reset`, `db push`, DDL, or any DML was executed against any production system. (Phase 16's local scratch databases were local-only and predate this phase.)

This is an **access fact, not a code failure**.

---

## 12. Confirmed Facts

1. Production runs commit `965f0b6` (GitHub Deployments API, `environment=Production`, `2026-10-01T07:45:24Z`; build status `success`).
2. Vercel Production has **no `DATABASE_URL`** — runtime error: `Environment variable not found: DATABASE_URL`.
3. The deployed schema's datasource is `provider = "sqlite"` with `url = env("DATABASE_URL")` at `prisma/schema.prisma:7`.
4. The failure is a `PrismaClientInitializationError` at client construction; no query reaches any database.
5. The same initialization failure affects `/api/researchers`, the admin `login` `users` lookup, and blog/research detail DB lookups (supplied logs + Phase 16 probes).
6. Intended production DBMS = PostgreSQL, documented in `PRODUCTION_CHECKLIST.md`, `.env.example`, and the CI workflow; pgvector/pg_trgm required.
7. Working tree has the postgres provider flip + 2 extra migrations, all **uncommitted/undeployed**.
8. Migration history: `migration_lock.toml` missing; duplicate timestamps; `add_pgvector` applies before `init`; fresh-DB `migrate deploy` fails (Phase 16 reproduction).
9. 9 of 34 model tables (`pages, page_sections, site_settings, menu_items, programs, blog_posts, media_items, resources, careers`) have no `CREATE TABLE` in any migration.
10. Prisma toolchain version 6.19.3 (`prisma` + `@prisma/client`); no `postinstall`/`prisma generate` hook in `package.json`.
11. No source file, schema file, migration, env file, Vercel setting, or git state was modified during Phase 17 (§16).

## 13. Likely Findings

- The `sqlite` provider in the deployed schema is itself a defect awaiting correction: even after `DATABASE_URL` is added as `postgresql://`, the shipped client would reject the URL (`the URL must start with the protocol 'file:'` — Phase 16 case A). **Both** defects must be fixed together.
- Preview/Development `DATABASE_URL` are probably also unset (same project-level configuration was never done) — but this is unobserved.
- Once configured, `migrate deploy` will be attempted by the operator (per checklist) and will fail at `add_pgvector` unless the history is repaired first — unless the production database already has prior `_prisma_migrations` history.
- The 9 missing tables will be the next failure class after connectivity works (routes touching `site_settings`/`blog_posts` first).
- The untracked `src/lib/env.ts` guard would have failed the build loudly at `DATABASE_URL` absence earlier had it been deployed.

## 14. Unknowns / Blockers

1. Whether a PostgreSQL instance has been provisioned at all (checklist step 1 is unticked) — **`UNKNOWN`**.
2. Preview/Development `DATABASE_URL` presence and schemes — **`UNKNOWN`** (dashboard-only).
3. Current production DB schema state and `_prisma_migrations` history — **`UNKNOWN`** (no access; and today, no variable to connect with).
4. Where the operator will provision the database (vendor choice undocumented) — **`UNKNOWN`**.
5. Whether `DATABASE_URL` should be set as `postgresql://` directly or through a Vercel-native integration (e.g. `@prisma/accelerate`, pooled URL) — not documented; decision deferred.

---

## 15. Phase 18 Required Scope

Derived strictly from §12 evidence (all items NOT implemented now):

| # | Category | Required? | Evidence basis |
|---|---|---|---|
| 1 | **Prisma provider correction** | **REQUIRED** | deployed `provider = "sqlite"` vs required `postgresql://` (Confirmed Facts 3/6) |
| 2 | **Migration ordering repair** | **REQUIRED before provisioning** | `add_pgvector` before `init`; fresh-DB deploy fails (Confirmed Fact 8) |
| 3 | **Missing table migrations** | **REQUIRED for full function** | 9 models without `CREATE TABLE` (Confirmed Fact 9) |
| 4 | **Production PostgreSQL provisioning** | **REQUIRED (operator)** | no proven instance exists (Unknown 1); checklist step unticked |
| 5 | **Vercel `DATABASE_URL` configuration** | **REQUIRED (operator)** | root cause: variable missing (Confirmed Fact 2); `postgresql://`, all environments |
| 6 | **Migration deployment** | **REQUIRED** | checklist mandates `prisma migrate deploy` on staging first, then production |
| 7 | **Production verification** | **REQUIRED** | `/api/researchers` 200 + JSON, admin `login` returns credential error (not catch-branch), detail routes render, `/sitemap.xml` re-build with real slugs |

Sequencing: 4 → 5 → (commit 1 + 2 + 3) → 6 (staging first) → 7. Also regenerate the Prisma client during deploy (checklist §4; `db:generate` exists; consider adding `postinstall` — scope decision for Phase 18).

---

## 16. Safety / Change-Control Verification

| Check | Result |
|---|---|
| Files **modified** during Phase 17 | **NONE** (`git status --porcelain` diff vs phase start: identical content; only the new report below was added) |
| Files **created** during Phase 17 | **exactly one:** `PHASE_17_PRODUCTION_DB_READ_ONLY_PROOF_REPORT.md` |
| Files **deleted** | **NONE** |
| Staged changes | **0** (`git diff --cached --name-only` empty) |
| Commits created | **0** (HEAD still `965f0b6`, no new commits) |
| Pushes performed | **0** (`git log origin/main..HEAD` empty) |
| Application source modification | **NONE** |
| Prisma schema / migration modification | **NONE** (`prisma/schema.prisma`, `prisma/migrations/*` untouched) |
| Environment modification | **NONE** — no `.env*` edits, no Vercel env/settings changes, no variables added |
| Database mutation | **NONE** — no `migrate deploy/reset`, no `db push`, no DDL/DML; no production connection attempted (§11) |
| Vercel deploy/trigger | **NONE** |
| Secrets printed or invented | **NONE** |
| Destructive commands | **NONE** |

Scratch artifacts: one throwaway script under `C:\Users\Mypc\AppData\Local\Temp\opencode\` (outside the repository); `node_modules/.phase16/**` predates this phase and is git-ignored.

## 17. Final Verdict

# PHASE 17 VERIFIED — ROOT CAUSE PROVEN

**Root cause (proven):** Vercel Production has **no `DATABASE_URL` environment variable**, and the deployed Prisma schema (`965f0b6`, `prisma/schema.prisma:7`, `provider = "sqlite"`) therefore fails at `PrismaClientInitializationError` during client construction for every database-backed route — `/api/researchers` (500), admin `login` DB lookup, and blog/research detail lookups.

**Secondary proven defects** (must be addressed after the primary fix, before production DB routes can return real data): deployed provider mismatch vs documented PostgreSQL intent; migration history that cannot provision a fresh database; 9 model tables with no migration; missing `migration_lock.toml`; all DB fixes uncommitted.

**Not claimed:** the project is **not** production-ready — production currently has no working database configuration, no provably reachable database, and zero fixes applied in this phase.

---

**Next:** Phase 18 per §15 (operator steps 4–5 first: provision Postgres + set `DATABASE_URL=postgresql://` in Vercel Production/Preview/Development, then redeploy).

# PHASE 18 — PRODUCTION POSTGRESQL & PRISMA MIGRATION REPAIR AUDIT

**Mode:** READ-ONLY AUDIT / NO SCHEMA CHANGES / NO MIGRATION CHANGES / NO ENV CHANGES / NO DB MUTATIONS / NO DEPLOY / NO COMMIT / NO PUSH
**Date:** 2026-10-01
**Repository:** `D:\downloads\civic-youth-bangladesh\lens\lens_website` (branch `main`, HEAD = `965f0b65d8d3b303ae6256ac231bfcccaa842724`, remote `origin` = `https://github.com/kamalforhad-glitch/LENS-platform.git`)
**Prisma:** `prisma` 6.19.3 / `@prisma/client` 6.19.3
**Secrets policy:** no credential, token, password, connection string value or secret was read into this report, printed, or invented.

---

## 1. Executive Summary

Phase 18 performed a **read-only** audit of the Prisma schema and the complete migration history to determine the safest exact repair path for the production PostgreSQL cutover.

**Proven structural defects (all re-verified against the current working tree, not inherited from prior reports):**

| # | Defect | Evidence |
|---|---|---|
| 1 | Deployed schema provider is `sqlite`; working-tree schema provider is `postgresql` (uncommitted) | `git show HEAD:prisma/schema.prisma` vs working tree |
| 2 | **`20250101000000_add_pgvector` is lexicographically ordered before `20250101000000_init`** | directory-name sort (`_a` < `_i`) |
| 3 | `add_pgvector` also depends on `document_embeddings`, which is not created until migration **#3** (`20260921000000_phase7_ai_i18n`) — a **forward (backward-in-time) dependency**, so the history is **not a valid DAG** | §5 |
| 4 | **34 Prisma models vs 25 tables with `CREATE TABLE` migrations → 9 tables have no migration** | §8 |
| 5 | One column on an *existing* table has no migration: `author_articles.researcher_profile_id` | §7 |
| 6 | Two duplicate timestamp prefixes (4 directories) | §9 |
| 7 | `prisma/migrations/migration_lock.toml` **missing** (never tracked in git) | §10 |
| 8 | Migrations are PostgreSQL-only DDL while the deployed datasource is `sqlite` | §4, §3 |
| 9 | 2 migration directories (`20261001_pg_standardization`, `20261002_backup_r2_fields`) are **untracked** — not in the deployed build | §2 |

**Evidence gaps that block an implementation plan:**

- `SPECIFIC PROVIDER NOT PROVEN` — no PostgreSQL hosting vendor is documented anywhere (§12)
- Vercel Production `DATABASE_URL` = **MISSING** (Phase 17 runtime evidence; not re-verifiable this phase — Vercel CLI `Logged out.`) (§13)
- `PRODUCTION POSTGRES EXISTENCE — UNKNOWN` (§14)
- `PRODUCTION DATA STATE UNKNOWN` (§15)

**Verdict: `PHASE 18 AUDIT BLOCKED — REQUIRED PROOF MISSING`**

(The audit itself completed without a single mutation. It is *blocked* because the repair **strategy** cannot be chosen safely until it is known whether a production database and production data exist — the answer changes the mandatory strategy from "rewrite history" to "preserve history" and back again.)

---

## 2. Repository Baseline

| Item | Value |
|---|---|
| Current branch | `main` |
| Current HEAD | `965f0b65d8d3b303ae6256ac231bfcccaa842724` (`965f0b6`) |
| HEAD subject | `Add SEO metadata foundation and DB diagnosis` (2026-10-01 13:44:20 +0600) |
| HEAD still `965f0b6`? | **YES** — unchanged from Phase 17 |
| Unpushed commits (`origin/main..HEAD`) | **0** |
| Staged changes | **0** (`git diff --cached --name-only` empty) |
| Working-tree entries (`git status --porcelain`) | **74** = 46 modified + 28 untracked |
| Remote | `origin` → `https://github.com/kamalforhad-glitch/LENS-platform.git` |

**Prior reports present (untracked):** `PHASE_15_DB_DIAGNOSIS_REPORT.md`, `PHASE_15_SEO_METADATA_FOUNDATION_REPORT.md`, `PHASE_16_PRODUCTION_DB_RESOLUTION_REPORT.md`, `PHASE_17_PRODUCTION_DB_READ_ONLY_PROOF_REPORT.md` (plus Phase 7/8/9/10/11/14 and scroll/perf reports).

**Prisma-relevant working-tree state (all pre-existing user work, untouched by this phase):**

```
 M prisma/schema.prisma          (provider sqlite -> postgresql + relation/field changes)
 M prisma/seed.js
 M prisma/seed.ts
?? prisma/migrations/20261001_pg_standardization/
?? prisma/migrations/20261002_backup_r2_fields/
```

**Git-tracked migrations (only 4 of 6):**

```
prisma/migrations/20250101000000_add_pgvector/migration.sql
prisma/migrations/20250101000000_init/migration.sql
prisma/migrations/20260921000000_phase7_ai_i18n/migration.sql
prisma/migrations/20260921000000_research_workflow/migration.sql
```

All four were introduced in the initial commit `650c006`. `migration_lock.toml` has **never** been tracked.

**Other baseline facts:** `prisma/dev.db` exists (782,336 bytes, local SQLite dev data); `.env` exists locally with `DATABASE_URL="file:./dev.db"` (key/value inspected only for **scheme**, never printed); `.vercel/` **absent**; Vercel CLI → `Logged out.`; no `prisma.config.ts`.

No clean, reset, stash, or cleanup was performed.

---

## 3. Prisma Schema Audit

File: `prisma/schema.prisma` (816 lines, working tree).

### Datasource / generator

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"     // line 6
  url      = env("DATABASE_URL")  // line 7
}
```

| Item | Working-tree state | Deployed state (`965f0b6`) |
|---|---|---|
| datasource provider | **`postgresql`** (line 6) | **`sqlite`** (line 6) |
| `DATABASE_URL` usage | only `env("DATABASE_URL")` in the datasource | same |
| generator | `prisma-client-js`, no `previewFeatures`, no custom output | same |
| schema validity | `npx prisma validate` → **valid** (exit 0) | n/a |

**DEPLOYED STATE:** `provider = "sqlite"`
**WORKING TREE STATE:** `provider = "postgresql"` (uncommitted; produced by the pre-existing uncommitted diff, not by this phase)

### Model inventory

- **34 models**, every one with an explicit `@@map` (34 distinct table names).
- **0 `enum` blocks** — all enumerated-looking fields are `String` with comment-documented value sets (e.g. `status`, `role`, `type`). No enum gap is possible because none exist.
- **PostgreSQL-specific features:** exactly one — `DocumentEmbedding.embedding Unsupported("vector(1536)")` (line 491), i.e. pgvector. A second-order PG dependency: `Float` → `DOUBLE PRECISION`, `DateTime` → `TIMESTAMP(3)`.
- **vector-related fields:** `DocumentEmbedding.embedding` only (1536 dims, `text-embedding-3-small`).
- **Relations:** 23 `@relation(...)` mentions, of which **18** are field-level `@relation(fields: [...], references: [...])` → **18 expected FK constraints**. Named relations: `"ResearchAuthor"`, `"PublicationAuthor"`, `"EventAuthor"`, `"TeamAuthor"` (User back-relations), `"MediaDownloads"` (DownloadLog↔MediaFile).
- **Constraints/indexes:** **95 `@@index` + 3 `@@unique` = 98** block-level declarations, plus **15 field-level `@unique`** → **113** index/unique objects expected in total.
- **Special field note (working tree):** `DownloadLog.mediaFileId` is now the only FK to `media_files`; `DownloadLog.contentId` is deliberately a non-FK polymorphic reference (comment in schema).

---

## 4. Migration Inventory

6 directories under `prisma/migrations/`. Sorted order = the order Prisma applies them (lexicographic by directory name).

| # | Directory / timestamp | Tracked? | Lines | CREATE TABLE (plain / IF NOT EXISTS) | ALTER TABLE | CREATE INDEX (uniq) | CREATE EXTENSION | ADD CONSTRAINT | `DO $$` blocks | PG-specific syntax | Requires from earlier | Creates | Can run on a fresh PG **in this position** |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|---|---|---|
| 1 | `20250101000000_add_pgvector` | yes | 9 | 0 / 0 | 2 | 1 (0) | **1 (`vector`)** | 0 | 0 | `CREATE EXTENSION`, `vector(1536)`, `USING hnsw`, `vector_cosine_ops` | ext. `vector`; table `document_embeddings` | ext `vector`; `document_embeddings.embedding` type change; HNSW index | **NO** |
| 2 | `20250101000000_init` | yes | 331 | 12 / 0 | 7 | 40 (6) | 0 | 7 | 0 | none (portable PG DDL: `TIMESTAMP(3)`, `BOOLEAN`, `DOUBLE PRECISION`) | nothing | 12 tables, 40 indexes, 7 FKs | **YES** |
| 3 | `20260921000000_phase7_ai_i18n` | yes | 121 | 0 / **6** | 1 | 18 (2) | 0 | 1 | **1** | `DO $$ … EXCEPTION WHEN duplicate_object` | nothing (self-contained) | 6 tables (`ai_conversations`, `ai_messages`, `document_embeddings` *(embedding as **TEXT**)*, `researcher_profiles`, `impact_metrics`, `translations`) + 1 FK | **YES** |
| 4 | `20260921000000_research_workflow` | yes | 165 | 7 / 0 | 20 | 19 (3) | 0 | 8 | 0 | none | `research_articles` (#2), `users` (#2) | 7 tables, 12 new `research_articles` columns, 19 indexes, 8 FKs | **only after #2** |
| 5 | `20261001_pg_standardization` | **no (untracked)** | 49 | 0 / 0 | 3 | 5 (0) | **2 (`vector`, `pg_trgm`)** | 1 | **3** | `DO $$`, `IF NOT EXISTS`, `gin_trgm_ops`, `to_tsvector`, `USING hnsw` | ext. `vector`+`pg_trgm`; `download_logs`, `media_files`, `research_articles`, `document_embeddings`; `embedding` must already be `vector` type (⇒ #1) | drops `download_logs_content_id_fkey`; adds `media_file_id` + FK + index; GIN/trgm/HNSW indexes | **NO** (needs #1 to have succeeded) |
| 6 | `20261002_backup_r2_fields` | **no (untracked)** | 9 | 0 / 0 | 3 | 1 (0) | 0 | 0 | 0 | `ADD COLUMN IF NOT EXISTS` | `backup_records` (#2) | 3 columns + 1 index | **only after #2** |

Totals: **25 `CREATE TABLE` statements across 25 distinct tables**, 36 `ALTER TABLE`, 84 `CREATE INDEX`, 3 `CREATE EXTENSION`, 17 `ADD CONSTRAINT`.

### Per-migration detail

**#1 `20250101000000_add_pgvector`** (9 lines)
1. `CREATE EXTENSION IF NOT EXISTS vector;`
2. `ALTER TABLE "document_embeddings" DROP COLUMN "embedding";` ← **unguarded**
3. `ALTER TABLE "document_embeddings" ADD COLUMN "embedding" vector(1536);`
4. `CREATE INDEX "document_embeddings_embedding_idx" … USING hnsw (embedding vector_cosine_ops);`

**#2 `20250101000000_init`** (331 lines) — 12 tables: `users`, `sessions`, `research_articles`, `publications`, `events`, `team_members`, `media_files`, `download_logs`, `newsletter_subscribers`, `contact_submissions`, `email_logs`, `backup_records`. 40 indexes (6 unique), 7 FKs — including **`download_logs_content_id_fkey → media_files(id)`**, which the working-tree schema no longer declares.

**#3 `20260921000000_phase7_ai_i18n`** (121 lines) — 6 tables, all `CREATE TABLE IF NOT EXISTS`; `document_embeddings.embedding` created as **`TEXT NOT NULL`** (not `vector`); one `DO $$` FK block for `ai_messages_conversation_id_fkey`.

**#4 `20260921000000_research_workflow`** (165 lines) — 12 `ALTER TABLE research_articles ADD COLUMN`, 2 new indexes on it, 7 new tables, 17 indexes, 8 FKs. Creates `author_articles` **without** `researcher_profile_id`.

**#5 `20261001_pg_standardization`** (49 lines, untracked) — creates `vector` + `pg_trgm`, drops the polymorphic FK, adds `media_file_id` + FK + index, one GIN full-text index on `research_articles`, two `gin_trgm_ops` indexes, one HNSW index (wrapped in `DO $$ … EXCEPTION WHEN duplicate_table`).

**#6 `20261002_backup_r2_fields`** (9 lines, untracked) — `ADD COLUMN IF NOT EXISTS` ×3 on `backup_records` + `backup_records_storage_idx`.

---

## 5. Migration Dependency Graph

### Apply order (pure lexicographic directory sort)

```
1. 20250101000000_add_pgvector      ← FAILS HERE on a fresh database
2. 20250101000000_init
3. 20260921000000_phase7_ai_i18n
4. 20260921000000_research_workflow
5. 20261001_pg_standardization      (untracked)
6. 20261002_backup_r2_fields        (untracked)
```

(`20261001…`/`20261002…` are 8-digit prefixes rather than Prisma's usual 14-digit `YYYYMMDDHHMMSS`; they still sort after `20260921…` because position 4 is `1` vs `0`. Order among them is correct: `…1001…` < `…1002…`.)

### Edge table

| Edge | Meaning | Producer | Consumer | Producer earlier? | Valid? |
|---|---|---|---|---|---|
| E1 | `document_embeddings` table → `add_pgvector` | #3 `phase7_ai_i18n` | #1 `add_pgvector` | **NO** (#3 is later) | **VIOLATED** |
| E2 | extension `vector` availability → `add_pgvector` | server prerequisite | #1 | n/a | conditional (server feature) |
| E3 | `research_articles`, `users` → `research_workflow` | #2 `init` | #4 | YES | valid |
| E4 | `download_logs`, `media_files`, `research_articles`, `document_embeddings` → `pg_standardization` | #2, #3 | #5 | YES | valid |
| E5 | `embedding` is `vector` type → HNSW index in `pg_standardization` | #1 | #5 | #1 earlier **but #1 can never succeed** | **unreachable in practice** |
| E6 | `download_logs_content_id_fkey` created then dropped | #2 creates, #5 drops | #2 → #5 | YES | valid (order-sensitive: #5 before #2 would leave the wrong FK behind) |
| E7 | `backup_records` → `backup_r2_fields` | #2 | #6 | YES | valid |

### Why `add_pgvector` before `init` fails — exact reason

Two independent failures, in statement order:

1. **First statement that can fail:** `CREATE EXTENSION IF NOT EXISTS vector;`
   - On a PostgreSQL server where the pgvector extension is **not installed/available**, this fails immediately (`extension "vector" is not available`). This is exactly the recorded Phase 16 result: `Applying migration 20250101000000_add_pgvector` → **`Error: P3018`**.
2. **If `vector` IS available:** execution continues to
   `ALTER TABLE "document_embeddings" DROP COLUMN "embedding";`
   - `document_embeddings` **does not exist yet** — it is created by migration **#3** `20260921000000_phase7_ai_i18n`, and it is **not** created by `init` either. Statement fails with *relation "document_embeddings" does not exist*. There is no `IF EXISTS` guard.

**Ordering root cause:** the duplicate timestamp `20250101000000` leaves Prisma to tie-break on the directory-name suffix; `_add_pgvector` sorts before `_init`, so the *repair* migration runs first while the *baseline* runs second. Even with `init` moved first, failure (2) persists because `init` never creates `document_embeddings`.

**Is the order a valid DAG?** **No.** Edge E1 points from an earlier consumer (#1) to a later producer (#3) — a forward dependency that no permutation of these six directories can satisfy while keeping `add_pgvector` first among the `20250101000000_*` pair. The history is **not** a valid DAG as written.

Not repaired here, per instructions.

---

## 6. Fresh PostgreSQL Reproduction

```
FRESH POSTGRES REPRODUCTION: NOT AVAILABLE
```

**What was inspected (read-only only):** a native **PostgreSQL 18.6** Windows service (`postgresql-x64-18`, PID listening on `0.0.0.0:5432`, `pg_hba.conf` = `trust` for local/loopback). No new database, table, extension, row, or any other object was created, altered, or deleted by Phase 18.

**Why a Phase-18 reproduction was not executed:**

1. The **instance is not completely disposable.** It hosts two unrelated projects' databases that were proven (by table listing) to contain non-LENS data and are **not** ours to touch:
   - `cycy_backend` — 18 tables (`partners`, `volunteer_applications`, `membership_applications`, …) + 11 rows in its own `_prisma_migrations`
   - `powerflex` — 6 tables + `alembic_version` (Python/Alembic project)
2. Only `phase16_scratch_plan` (26 tables, 4 applied migrations) and `phase16_scratch_verify` (1 table: `_prisma_migrations`) are disposable — both created by Phase 16 for diagnosis.
3. Running a *fresh* reproduction would require (a) **creating a database** (prohibited: "provision a database") and (b) **attempting `CREATE EXTENSION`** (prohibited: "create/drop PostgreSQL extensions"). It would also require installing pgvector, which is prohibited ("do not install or provision PostgreSQL").
4. **pgvector is not available on this machine at all**: `pg_available_extensions` returns `pg_trgm`, `uuid-ossp` — **no `vector`**. So the pgvector code path could not be exercised even in principle. (Only `plpgsql` is installed; `pg_trgm` is available but not installed.)

**Reproduction evidence available without any mutation (re-verified read-only this phase):**

| Evidence | Value |
|---|---|
| `_prisma_migrations` in `phase16_scratch_verify` | 1 row: `20250101000000_add_pgvector`, `started_at = 2026-10-01 15:29:36`, **`finished_at` NULL**, `applied_steps_count = 0`, `rolled_back_at` NULL → the deploy **started migration #1 and failed** |
| `_prisma_migrations` in `phase16_scratch_plan` | 4 rows applied cleanly: `init`, `phase7_ai_i18n`, `research_workflow`, `backup_r2_fields` (Phase 16 deliberately excluded the two `CREATE EXTENSION vector`-dependent migrations) → **those 4 DO apply cleanly on fresh PostgreSQL when `add_pgvector`/`pg_standardization` are removed** |
| Phase 16 recorded error (verbatim, prior phase) | `Applying migration 20250101000000_add_pgvector` → `Error: P3018` → locally `extension "vector" is not available`; on a pgvector-enabled server the next statement fails on the missing table |

**Deterministic outcome of the current history on a fresh PostgreSQL (static analysis, no execution):**

- With pgvector **absent** → fails at statement 1 of migration #1 (`P3018`).
- With pgvector **present** → fails at statement 2 of migration #1 (`relation "document_embeddings" does not exist`).
- In **both** cases `prisma migrate deploy` aborts → migrations #2–#6 never apply → **a fresh database can never be provisioned by `migrate deploy` as the history stands.**

---

## 7. Schema-vs-Migration Gap

Method: parse `prisma/schema.prisma` (models → `@@map` table, field → `@map` column, `@@index`/`@@unique`/`@unique`, `@relation(fields:…)` → FK) and parse all 6 `migration.sql` files (`CREATE TABLE`, `ADD COLUMN`, `CREATE INDEX`, `ADD CONSTRAINT`), then diff both directions. Scripts were written **outside** the repository (`C:\Users\Mypc\AppData\Local\Temp\opencode\`).

### 7.1 Tables in schema but absent from migrations — **9**

`pages`, `page_sections`, `site_settings`, `menu_items`, `programs`, `blog_posts`, `media_items`, `resources`, `careers` (§8).

### 7.2 Columns in schema but absent from migrations — **1** (excluding the 9 missing tables)

| Table | Column | Created by schema model | Migration that should create it |
|---|---|---|---|
| `author_articles` | `researcher_profile_id` | `AuthorArticle.researcherProfileId String?` | **none** — `20260921000000_research_workflow` created the table without it |

Plus the implicit column gaps inside the 9 missing tables (**158 columns** across those 9 models).

### 7.3 Column type mismatch

| Table.column | Schema expects | Migration creates | Fixed by |
|---|---|---|---|
| `document_embeddings.embedding` | `vector(1536)` (`Unsupported`) | `TEXT NOT NULL` (`20260921000000_phase7_ai_i18n`) | `20250101000000_add_pgvector` — **which cannot run** (§5) |

No columns exist in migrations that the schema no longer declares (for tables present in both).

### 7.4 Indexes in schema but absent from migrations — **35**

Basis: 113 expected index/unique objects (§3) − 78 matched against the 83 distinct index names in migrations = **35**.

- **34** belong to the 9 missing tables (they will be created together with those tables — those 9 models declare 34 index/unique objects between them).
- **1** belongs to an existing table: `author_articles_researcher_profile_id_idx`.

(84 `CREATE INDEX` statements exist across the 6 files but only **83 distinct index names**: `document_embeddings_embedding_idx` is emitted by both `add_pgvector` and `pg_standardization` — the second occurrence is wrapped in `DO $$ … EXCEPTION WHEN duplicate_table`.)

### 7.5 Indexes in migrations but not represented in schema — **5**

| Index | Migration | Note |
|---|---|---|
| `backup_records_storage_idx` | `20261002_backup_r2_fields` | schema has no `@@index([storage])` → `prisma migrate diff` would flag it as drift |
| `document_embeddings_embedding_idx` | `20261001_pg_standardization` | HNSW index on an `Unsupported` field — Prisma cannot express it; intentional |
| `research_articles_search_gin_idx` | `20261001_pg_standardization` | GIN/`to_tsvector` — Prisma cannot express it; intentional |
| `research_articles_tags_trgm_idx` | `20261001_pg_standardization` | `gin_trgm_ops` — intentional |
| `research_articles_author_trgm_idx` | `20261001_pg_standardization` | `gin_trgm_ops` — intentional |

(The first is the only *unintentional* one: it is plain schema drift.)

### 7.6 Enums in schema but absent from migrations

**None.** The schema declares **zero** `enum` types; there is nothing to compare.

### 7.7 Relations / foreign keys

| Direction | Count | Detail |
|---|---:|---|
| Schema FKs with **no** `ADD CONSTRAINT` in any migration | **2** | `author_articles_researcher_profile_id_fkey` (existing table — real gap); `page_sections_page_id_fkey` (inside a missing table — subsumed by §8) |
| Migration FKs **not** in schema | **1** | `download_logs_content_id_fkey` (created by `init`, explicitly dropped by `20261001_pg_standardization`) |

### 7.8 PostgreSQL-only features

| Where | Feature | Present |
|---|---|---|
| Schema | `Unsupported("vector(1536)")` | YES — requires pgvector |
| Migrations | `CREATE EXTENSION vector` | YES (`add_pgvector`, `pg_standardization`) |
| Migrations | `CREATE EXTENSION pg_trgm` | YES (`pg_standardization`) |
| Migrations | `USING hnsw … vector_cosine_ops` | YES (`add_pgvector`, `pg_standardization`) |
| Migrations | `USING gin (to_tsvector('english', …))`, `gin_trgm_ops` | YES (`pg_standardization`) |
| Migrations | `DO $$ … EXCEPTION` procedural blocks | YES (`phase7_ai_i18n`, `pg_standardization`) |

**Consequence:** the migration SQL is **PostgreSQL-only** and cannot be executed by the **deployed** (`sqlite`) datasource at all — `CREATE EXTENSION`/`DO $$` are not SQLite syntax. The history and the deployed provider disagree in *both* directions.

### 7.9 Migrations containing objects no longer represented by schema

- `download_logs_content_id_fkey` (dropped later — end state is correct)
- `backup_records_storage_idx` (never represented — permanent drift unless the schema gains `@@index([storage])` or the index is dropped)
- the 4 intentional PG-feature indexes (§7.5)

### 7.10 Gap summary

| Category | Gap count |
|---|---:|
| Tables missing | **9** |
| Columns missing (existing tables) | **1** |
| Column type mismatches | **1** |
| Indexes missing (existing tables) | **1** (plus 34 inside missing tables) |
| Indexes extra in migrations (unintentional) | **1** (`backup_records_storage_idx`) |
| Enums missing | 0 |
| FKs missing (existing tables) | **1** |
| FKs extra in migrations | 1 (transient; dropped by #5) |
| Orphan tables (in migrations, not in schema) | 0 |

---

## 8. Missing Table Analysis

Recalculated from the **current** repository (not copied from Phase 17).

Set A = 34 `@@map` table names parsed from `prisma/schema.prisma`.
Set B = 25 distinct `CREATE TABLE` targets parsed from all 6 `migration.sql` files.
A − B = **9**, identical to the previously reported list.

| Model | Expected table | CREATE TABLE migration found? | Evidence |
|---|---|---:|---|
| `Page` | `pages` | **NO** | no `CREATE TABLE "pages"` in any of the 6 files |
| `PageSection` | `page_sections` | **NO** | absent; its FK `page_sections_page_id_fkey` also absent |
| `SiteSetting` | `site_settings` | **NO** | absent (queried by `/api/admin/settings`) |
| `MenuItem` | `menu_items` | **NO** | absent (admin `menus` route) |
| `Program` | `programs` | **NO** | absent (admin `programs` route) |
| `BlogPost` | `blog_posts` | **NO** | absent (blog detail route) |
| `MediaItem` | `media_items` | **NO** | absent (admin `media-items` route) |
| `Resource` | `resources` | **NO** | absent (admin `resources` route) |
| `Career` | `careers` | **NO** | absent (admin `careers` route) |

**Coverage: 25 / 34 = 73.5% of model tables have a `CREATE TABLE` migration; 9 / 34 = 26.5% do not.**
No migration creates a table that is not in the schema (no orphans), so the 9 are a pure omission, not a rename.
No `ALTER TABLE` in any migration creates any of these 9 tables either.

**No migrations were created.**

---

## 9. Duplicate Timestamp Analysis

| Prefix | Directories | Ordering ambiguity | SQL dependency makes order significant? | Renaming likely required? | Renaming risk to already-applied history |
|---|---|---|---|---|---|
| `20250101000000` | `20250101000000_add_pgvector`, `20250101000000_init` | **YES — critical.** Tie-break is alphabetical suffix: `_add_pgvector` < `_init`, so the *repair* runs before the *baseline* | **YES — fatal.** `add_pgvector` needs `document_embeddings` (created by #3); `init` must be first by design | **Yes** (or the pair must be restructured) | **HIGH if any DB has applied them.** Renaming/editing a directory whose name is recorded in `_prisma_migrations` causes name/checksum mismatch on that database (`migrate deploy` reports the applied migration as missing/modified). `phase16_scratch_verify` already contains a row named `20250101000000_add_pgvector` (local scratch only). |
| `20260921000000` | `20260921000000_phase7_ai_i18n`, `20260921000000_research_workflow` | **YES — low impact.** Tie-break: `_phase7…` < `_research…` | **NO.** The two are independent of each other (`phase7` is self-contained; `research_workflow` depends only on `init`). Either order produces the same end state | No practical need | Renaming would break any DB that already recorded these names |

Also noted (not a duplicate, but a format anomaly): `20261001_pg_standardization` and `20261002_backup_r2_fields` use **8-digit** prefixes while the other four use **14-digit** `YYYYMMDDHHMMSS` timestamps — inconsistent with Prisma's generator convention; relative order is nevertheless correct (§5).

**Nothing was renamed.**

---

## 10. Migration Lock Analysis

| Check | Result |
|---|---|
| `prisma/migrations/migration_lock.toml` exists? | **NO** (`Test-Path` → `False`; recursive search → 0 hits) |
| Ever tracked in git? | **NO** (`git log --all -- <path>` empty; `git ls-files prisma/migrations/` lists only the 4 `migration.sql` files) |
| Contents expected by Prisma 6.19.3 | extracted from `node_modules/prisma/build/index.js`: Prisma writes<br>`# Please do not edit this file manually` / `# It should be added in your version-control system (e.g., Git)` / `provider = "<connectorType>"` |
| Expected value for this project | `provider = "postgresql"` |
| Behaviour without it | Prisma reads it with `.catch(() => null)` — absence is tolerated, but **the provider of the migration history is then unrecorded**, so the history is provider-ambiguous. Prisma will (re)create the file on the next `migrate dev`/`migrate new`, not on `migrate deploy`. |
| Action taken | **None** — not created, per instructions. |

---

## 11. PostgreSQL Extension Analysis

| Extension | Required by | Declared in which migration | Created before dependent objects? | Production DB must support it? |
|---|---|---|---|---|
| **`vector` (pgvector)** | schema `Unsupported("vector(1536)")`; `add_pgvector` HNSW index; `pg_standardization` HNSW index; `src/lib/ai/index.ts` raw SQL (`::vector`, `<=>`, `embedding <=> $1`) | `20250101000000_add_pgvector` (line 2) and `20261001_pg_standardization` (line 7) | **Partially — and it does not save it.** `CREATE EXTENSION` is the *first* statement of `add_pgvector`, so the extension is created before that migration's own dependent objects; but the migration still fails on the missing `document_embeddings` table (§5), and `pg_standardization`'s HNSW index additionally requires `embedding` to already be `vector` (which only `add_pgvector` can arrange) | **YES — mandatory** |
| **`pg_trgm`** | `pg_standardization` (`gin_trgm_ops` on `research_articles.tags`, `research_articles.author`); accelerates the `ILIKE '%…%'` filters in `src/lib/actions/library.ts` | `20261001_pg_standardization` (line 8) | YES — created at line 8, before the `gin_trgm_ops` indexes at lines 38–42 | **YES — mandatory** (checklist §1 names it) |
| Built-in full-text search (`to_tsvector`/`to_tsquery`/`ts_rank`/`@@`) | `src/lib/actions/library.ts:81-99` (library search) + GIN index in `pg_standardization` | index in `20261001_pg_standardization` (line 34) | YES (built-in, no extension needed; GIN is core) | built-in — no extension, but PostgreSQL-only |

**Application-code confirmation (read-only):**

- `src/lib/ai/index.ts` — raw `INSERT … ${…}::vector`, `ORDER BY "embedding" <=> $1::vector`, `1 - (… <=> "embedding") AS similarity`, plus a `db.$queryRaw` fallback that casts `"embedding"::text`. Comment at line 222: *"`embedding` is `Unsupported("vector(1536)")` — must be read via raw SQL as text."*
- `src/lib/actions/library.ts` — `ts_rank(to_tsvector('english', …))`, `to_tsquery('english', …) @@ …`, `ILIKE '%' || … || '%'`.

**No `CREATE EXTENSION` was executed.**

**Local capability note:** the only PostgreSQL reachable from this machine (18.6) does **not** have `vector` available (`pg_available_extensions`: `pg_trgm`, `uuid-ossp` only) — relevant for any future local verification run.

---

## 12. Intended Database Provider Evidence

Searched (case-insensitive) for `neon.tech|supabase|railway|render.com|aws|amazon|rds|vercel postgres|hyperdrive|turso|planetscale` across `README.md`, `PRODUCTION_CHECKLIST.md`, `.env.example`, `.github/workflows/*.yml`, and the Phase 15/16/17 reports.

| Source | What it proves |
|---|---|
| `PRODUCTION_CHECKLIST.md:3-6` | `## 1. Database (PostgreSQL + pgvector)`; *"Provision Postgres with `vector` and `pg_trgm` extensions"*; *"Set `DATABASE_URL=postgresql://...` in Vercel env (all environments)"*; *"Run `prisma migrate deploy` on staging first"*; *"Migrate data from `prisma/dev.db` if needed"* |
| `.env.example` | `# DATABASE (PostgreSQL)` / `DATABASE_URL=postgresql://user:password@localhost:5432/lens_db?schema=public` |
| `.github/workflows/ci.yml:11` | job env `DATABASE_URL: postgresql://user:password@localhost:5432/lens_db?schema=public` (file itself untracked) |
| Working-tree `prisma/schema.prisma:6` | `provider = "postgresql"` (uncommitted) |
| `src/lib/ai/index.ts`, `src/lib/actions/library.ts` | raw SQL that only PostgreSQL can execute (pgvector operators, `to_tsvector`, `ILIKE`) |
| `README.md` | **no** database section at all |

**DBMS-level determination:** **PostgreSQL — PROVEN** (documented intent, `postgresql://` URL shape, required extensions, PG-only raw SQL).

**Hosting-vendor determination:**

# `SPECIFIC PROVIDER NOT PROVEN`

No mention of Neon, Supabase, Railway, Render, AWS RDS, Vercel Postgres/Hyperdrive, Turso, PlanetScale or any other vendor exists anywhere in the repository. `PRODUCTION_CHECKLIST.md` says only *"Provision Postgres"*. The `localhost:5432` example is a generic placeholder, not a vendor. **No provider is provisioned or assumed here, and none will be invented.**

---

## 13. Vercel Environment Evidence

No secrets retrieved or printed. Vercel CLI status this phase: `npx vercel whoami` → **`Logged out.`** (no token); `.vercel/` project link **absent**; therefore no dashboard/CLI read was possible this phase.

| Variable | Production | Scheme |
|---|---|---|
| `DATABASE_URL` | **MISSING** | n/a — variable absent |

- `MISSING` is carried forward from Phase 17's **supplied production runtime log**: `PrismaClientInitializationError` / `Environment variable not found: DATABASE_URL` / `schema.prisma:7` / `provider = "sqlite"` — read-only evidence, not re-obtainable from this environment this phase.
- Preview / Development presence: **UNKNOWN** (dashboard-only).
- Local `.env`: `DATABASE_URL` present with scheme **`file:`** (local SQLite only; value never printed; not deployed).
- **Nothing was changed** — no environment variable was added, edited, or removed.

---

## 14. Production Database Existence

# `PRODUCTION POSTGRES EXISTENCE — UNKNOWN`

Evidence considered:

| Evidence | Result |
|---|---|
| Documented provider/host | none — `SPECIFIC PROVIDER NOT PROVEN` (§12) |
| Vercel Production `DATABASE_URL` | **MISSING** (§13) → no connection string exists to probe |
| Deployment configuration | Vercel build only; no DB provisioning config in the repo |
| Provider dashboard evidence | none available (CLI logged out; no operator input this phase) |
| Safe read-only connection with available credentials | **not possible** — no production credentials exist anywhere in this environment |

No guess was made in either direction. Absence of a `DATABASE_URL` proves only that the app cannot *reach* a database — **not** that a database does or does not exist.

---

## 15. Production Data State

# `PRODUCTION DATA STATE UNKNOWN`

The production database could not be accessed (§14), so its state — empty, fully populated, or partially migrated — is unobservable. **It is not assumed to be empty.**

Data that *does* exist, none of which is production:

| Data | Location | Relevance |
|---|---|---|
| Local dev dataset (SQLite) | `prisma/dev.db` (782,336 bytes) | local only; `PRODUCTION_CHECKLIST.md:8` lists migrating from it as an *optional* future step |
| Phase 16 scratch databases | local PG `phase16_scratch_plan` (26 tables, 4 migrations applied), `phase16_scratch_verify` (1 table, 1 failed migration row) | disposable diagnostic artifacts |
| Unrelated project data | local PG `cycy_backend` (18 tables, 11 applied Prisma migrations), `powerflex` (6 tables, Alembic) | **other projects — not LENS, not touched** |

**Why this is decisive:** migration strategy differs fundamentally between *empty/new*, *existing-with-data*, and *partially-migrated* databases (§16). This single unknown is what blocks strategy selection.

---

## 16. Migration Repair Strategies

### Strategy A — Repair the existing migration history in place

Edit/rename/reorder the six directories so that a fresh `migrate deploy` succeeds (e.g. move `add_pgvector` after `phase7_ai_i18n`, fix duplicate timestamps, add `migration_lock.toml`).

| Dimension | Assessment |
|---|---|
| Safety | Medium — safe **only if** no database carries this history |
| Effect on existing databases | **High risk**: renamed/edited directories no longer match names+checksums recorded in `_prisma_migrations`; Prisma then reports applied-but-missing/modified migrations and refuses to proceed until baselined/resolved |
| Effect on fresh databases | **Good** — becomes the only history, applies cleanly |
| Risk of losing data | None by itself (pure metadata edit) |
| Prisma compatibility | Good — this is Prisma's own model of history, provided `_prisma_migrations` is reconciled |
| pgvector compatibility | Good — ordering can be fixed so `vector` is created before its dependent HNSW index |
| Production-deploy compatibility | Good **iff** the production DB turns out to be new/empty; dangerous otherwise |

### Strategy B — Create a new baseline history

Squash: replace the six directories with a single new baseline migration generated from the current schema (+ `migration_lock.toml`), then `prisma migrate resolve --applied <baseline>` on any existing DB.

| Dimension | Assessment |
|---|---|
| Safety | Medium-High for a **new** database; requires explicit baselining for an existing one |
| Effect on existing databases | Safe **only** with `migrate resolve --applied` (marks baseline as applied without running it); skipping this leaves the DB unable to migrate |
| Effect on fresh databases | **Best** — one clean, provably schema-complete migration covering all 34 tables |
| Risk of losing data | **None** — baseline is never executed against an existing DB (only recorded). Data loss risk comes only from a mis-executed `migrate reset`, which is forbidden |
| Prisma compatibility | Fully supported (`migrate resolve` is the documented baselining flow) |
| pgvector compatibility | Good — extension creation and the `vector` column can be emitted in the correct order |
| Production-deploy compatibility | Good, but **destroys the audit trail** of what was applied when |

### Strategy C — Preserve existing history, add corrective forward migrations only

Leave all six directories untouched; add new, later-dated migrations for the missing pieces (9 tables, `author_articles.researcher_profile_id`, `migration_lock.toml`, schema drift).

| Dimension | Assessment |
|---|---|
| Safety | **Highest for an existing database** — never rewrites what was applied |
| Effect on existing databases | **Best** — additive only; applied rows keep matching |
| Effect on fresh databases | **INSUFFICIENT.** The first migration in the file (`add_pgvector`) still fails, so `migrate deploy` never reaches any corrective migration. A forward migration *cannot* run before migration #1. |
| Risk of losing data | None |
| Prisma compatibility | Good |
| pgvector compatibility | Correct for the extension, but **does not repair the ordering defect** |
| Production-deploy compatibility | Works only if the target DB already has `_prisma_migrations` baselined past `add_pgvector` |

### Strategy D — Preserve history + baseline the broken migrations (hybrid)

Keep every directory byte-identical; for a database that already exists, use `prisma migrate resolve --applied 20250101000000_add_pgvector …` (mark-as-applied without executing) and only then `migrate deploy` the corrective forward migrations; for a brand-new database, apply a curated order manually (or via Strategy B) and baseline.

| Dimension | Assessment |
|---|---|
| Safety | High — no file is ever edited, so no checksum can break |
| Effect on existing databases | Excellent — additive + explicit baselining |
| Effect on fresh databases | Requires a manual/baseline step (not a plain `migrate deploy`) |
| Risk of losing data | None |
| Prisma compatibility | Fully supported (`migrate resolve --applied`) |
| pgvector compatibility | Good — `pg_standardization`'s extension lines run, but its HNSW block still needs `embedding` to be `vector`, which only `add_pgvector` provides ⇒ on a fresh DB either `add_pgvector` must be executed out of band (curated order) or the HNSW statement must be handled |
| Production-deploy compatibility | Best all-round **if** an existing DB is confirmed |

### Technical constraint worth recording

A fresh database **cannot** be provisioned by a plain `prisma migrate deploy` under Strategies C or D as written — the defect sits in migration #1 itself. Therefore:

- **If no production database exists (fresh)** → Strategy **A** or **B** is *technically mandatory*.
- **If a production database exists with applied history/data** → Strategy **A** (rewriting history) is *unsafe*; Strategy **C** or **D** becomes mandatory.
- **If a production database exists but is only partially migrated** → Strategy **D** (preserve + baseline + forward) becomes mandatory.

**No strategy is selected.** The evidence required to choose between these three branches is missing (§14, §15).

---

## 17. Recommended Next-Step Strategy

**No strategy is selected or executed in Phase 18.**

Recommended *sequence* (all items outside this phase's scope):

1. **Resolve §14 and §15 first** — decide/confirm the PostgreSQL hosting vendor, obtain the production connection string, and determine by read-only inspection (`SELECT` from `_prisma_migrations`, table list, row counts) whether a production database exists and whether it holds data. *Nothing else can be chosen safely before this.*
2. Once the data state is known, pick exactly one branch from §16 (A/B for fresh, C/D for existing).
3. Only then may Phase 19 touch `prisma/schema.prisma` (commit the `postgresql` provider flip), the migration history, and `migration_lock.toml`.
4. Provisioning `DATABASE_URL` in Vercel and running `prisma migrate deploy` are operator steps that follow the history repair — never precede it (a fresh deploy is guaranteed to fail today, §5).

Conditional note for the implementer: given that **no production database is proven to exist** and `PRODUCTION_CHECKLIST.md`'s provisioning box is unticked, the *currently most probable* branch is the fresh-database one (Strategy A or B) — but "most probable" is not "proven", and this phase will not treat it as such.

---

## 18. Phase 19 Prerequisites

Every item must be **known/decided** before any mutation is permitted. Current status:

| # | Prerequisite | Status | Blocking? |
|---:|---|---|---|
| 1 | PostgreSQL hosting **provider** (vendor) | **`SPECIFIC PROVIDER NOT PROVEN`** | **YES** |
| 2 | Production database **existence** | **`UNKNOWN`** | **YES** |
| 3 | Production **data state** (empty / populated / partial) | **`UNKNOWN`** | **YES** |
| 4 | Production `DATABASE_URL` present, with scheme `postgresql://` | **`MISSING`** | **YES** |
| 5 | Prisma datasource provider committed as `postgresql` | working tree `postgresql`, **HEAD still `sqlite`**, uncommitted | **YES** |
| 6 | Migration repair **strategy** selected (A/B/C/D) | **not selectable** — depends on #2/#3 | **YES** |
| 7 | Final migration **order** (incl. `add_pgvector` placement, duplicate-timestamp resolution) | determined analytically (§5) but **not applied** | **YES** |
| 8 | Migration for the **9 missing tables** + `author_articles.researcher_profile_id` | **missing** | **YES** |
| 9 | Extension requirements confirmed on the target server (`vector`, `pg_trgm` available + installable) | **unverified on any target** (local server lacks `vector` entirely) | **YES** |
| 10 | **Backup** of any existing production database, taken and restorable | **none exists / not possible** (no DB) | **YES** if #2 = exists |
| 11 | **Rollback strategy** (how to revert a failed `migrate deploy`, how to `migrate resolve --rolled-back`) | not written | **YES** |
| 12 | `migration_lock.toml` created with `provider = "postgresql"` | **absent** | should be fixed with #6 |
| 13 | Prisma client regenerated at deploy (`db:generate`; no `postinstall` hook exists) | not configured | no |
| 14 | Vercel `DATABASE_URL` set in Production **and** Preview/Development | not done | **YES** |
| 15 | Staging-first run of `prisma migrate deploy` per `PRODUCTION_CHECKLIST.md:6` | not done | **YES** |
| 16 | Decision on `backup_records_storage_idx` drift (add `@@index([storage])` or drop index) | undecided | no |
| 17 | Decision on whether `document_embeddings.embedding` becomes `vector` before or inside the baseline | undecided | yes (pgvector) |

---

## 19. Safety / Change-Control Verification

| Check | Result |
|---|---|
| Files **modified** during Phase 18 | **NONE** — verified by `git status --porcelain` snapshot taken before and after; zero files with a modification time inside the phase window (repo, excluding `node_modules`/`.next`/`.git`) |
| Files **created** during Phase 18 | **exactly one:** `PHASE_18_POSTGRES_MIGRATION_AUDIT_REPORT.md` |
| Files **deleted** | **NONE** |
| Staged files | **0** (`git diff --cached --name-only` empty) |
| Commits created | **0** — HEAD still `965f0b65d8d3b303ae6256ac231bfcccaa842724` |
| Pushes performed | **0** — `git log origin/main..HEAD` empty |
| `prisma/schema.prisma` changed | **NO** — only *read* (`npx prisma validate`, exit 0, no writes) |
| Migrations changed | **NO** — no directory created, renamed, deleted, or edited; no `migration_lock.toml` created |
| Migration commands run | **NONE** — no `migrate dev` / `migrate deploy` / `migrate reset` / `db push` / `migrate resolve` |
| SQL DDL executed | **NONE** — no `CREATE`/`DROP`/`ALTER TABLE`, no `CREATE EXTENSION`, no `CREATE INDEX` |
| SQL DML executed | **NONE** — only `SELECT`-class read-only statements against the local PostgreSQL (database/extension/table inventory and `_prisma_migrations` reads), performed solely to determine disposability per §5 |
| Environment changed | **NONE** — no `.env*` edit; no Vercel variable added/changed; no secret printed |
| Database mutations | **NONE** — no database, schema, table, extension, index, row, or `_prisma_migrations` record was created, altered, or deleted |
| New databases provisioned | **NONE** |
| PostgreSQL installed/modified | **NONE** — the pre-existing 18.6 service was only inspected |
| Deployments | **NONE** — no Vercel/GitHub deploy triggered |
| Destructive commands | **NONE** — no clean/reset/stash/checkout/drop |
| Secrets printed or invented | **NONE** |
| Scratch artifacts | analysis scripts only, under `C:\Users\Mypc\AppData\Local\Temp\opencode\` (outside the repository); `.gitignore`d `node_modules` untouched |

---

## 20. Final Verdict

# `PHASE 18 AUDIT BLOCKED — REQUIRED PROOF MISSING`

**What is proven:** the migration history cannot provision a fresh PostgreSQL database (fails in migration #1, deterministically, two independent ways); 9 of 34 model tables and 1 column and 1 FK have no migration; duplicate timestamps, a forward dependency that makes the history a non-DAG, a missing `migration_lock.toml`, and a deployed `sqlite` provider versus a working-tree `postgresql` provider are all present in the current tree.

**What is missing:** the PostgreSQL **provider**, the **existence** of a production database, its **data state**, and its `DATABASE_URL`. Until those four are known, no repair strategy (§16) can be chosen without risking either an unrecoverable history rewrite against a live database or an unprovisionable fresh one.

**Not claimed:** this report does **not** claim production readiness, does not claim a database exists, does not claim any provider, and executes nothing.

---

**Change-control result:** only `PHASE_18_POSTGRES_MIGRATION_AUDIT_REPORT.md` was newly created. No schema changes, no migration changes, no environment changes, no database mutations, no deployment, no commit, no push.

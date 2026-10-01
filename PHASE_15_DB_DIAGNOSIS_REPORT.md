# PHASE 15 — Stage 0: Production DB Diagnosis

**Mode:** DIAGNOSIS ONLY — no application code changed in Stage 0.
**Date:** 2026-10-01
**Repository:** `D:\downloads\civic-youth-bangladesh\lens\lens_website`
**Constraint honored:** no secrets printed, no values invented, no credentials used.

---

## 1. Observed production symptoms

All probes performed live against `https://www.lensbd.org` during this phase (Googlebot UA; no credentials sent):

| # | Probe | Result | Latency (connect / total) |
|---|-------|--------|---------------------------|
| 1 | `GET /api/researchers` (run 1) | **500**, body 39 bytes (`{"error":"Failed to fetch researchers"}`) | 0.317s / **3.248s** |
| 2 | `GET /api/researchers` (run 2) | **500**, same body | 0.126s / **0.733s** |
| 3 | `GET /api/researchers` (run 3) | **500**, same body | 0.022s / **0.927s** |
| 4 | `GET /api/admin/settings` (unauthenticated) | **500** | **0.508s** |
| 5 | `GET /api/admin/search?q=a` (unauthenticated) | 401 `{"error":"Unauthorized"}` | 0.614s |
| 6 | `GET /blog/<slug>`, `/careers/research-analyst`, `/programs/media-literacy-academy` | **200** but **empty `<title>`**, body = loading skeleton (67 visible chars) | ~2s |
| 7 | `GET /sitemap.xml` | 200, contains the **4 hardcoded fallback research slugs** | — |
| 8 | `GET /api/health` | **404** (route file exists locally but is **untracked**, so it is not in the deployed build) | — |
| 9 | `GET /api/health` → also confirmed route source exists: `src/app/api/health/route.ts` (`git status` = `??`) | — | — |

Response headers of note (probe 1): `Server: Vercel`, `X-Vercel-Id: bom1::iad1::…`, `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`, `Content-Type: application/json`.

**Timing signature:** failures complete in **0.5–1.0s warm (3.2s cold)** with connect times of 0.02–0.32s. This is *not* a database connect-timeout signature (Prisma's default connect timeout is several seconds; an unreachable host would stall near that ceiling). The failure is happening **early** — during client construction/datasource validation, during authentication, or immediately on the first statement.

**Uniformity:** every DB-touching endpoint fails identically (500, empty payload, or fallback), while non-DB paths behave correctly (401 auth path works; static pages render). One additional discriminator from probe 4/5: in the **deployed** commit, `src/app/api/admin/settings/route.ts` has **no auth check at all** and queries `db.siteSetting.findMany` directly — so the unauthenticated 500 of probe 4 is a *pure DB-query failure*, independent of authentication.

---

## 2. Relevant source paths

| Path | What it shows |
|------|---------------|
| `src/lib/db.ts` | `new PrismaClient({ log: … })`; `globalThis` caching only when `NODE_ENV !== "production"` (line 13) → new client per serverless invocation; **no** `requireDatabaseUrl()` call; no pooler/`connection_limit` settings. Working tree differs from the deployed commit (Unicode `slugify`). |
| `src/lib/env.ts` | Defines `requireDatabaseUrl()` (throws if `DATABASE_URL` unset outside build). **Untracked (`??`)** → not present in the deployed build. |
| `prisma/schema.prisma` (working tree) | `provider = "postgresql"`; `DocumentEmbedding.embedding = Unsupported("vector(1536)")`; `DownloadLog.mediaFileId` polymorphic fix; `BackupRecord` R2 fields. **Modified, uncommitted** (` M prisma/schema.prisma`, +17/−4). |
| `prisma/schema.prisma` **at commit `e4d24b5`** (what production builds from) | `provider = "sqlite"`, `url = env("DATABASE_URL")`, `embedding String`, no R2 fields — verified via `git show e4d24b5:prisma/schema.prisma`. |
| `prisma/migrations/**` | 6 dirs; only **4 are tracked at `e4d24b5`** (`init`, `add_pgvector`, `phase7_ai_i18n`, `research_workflow`). `20261001_pg_standardization` and `20261002_backup_r2_fields` are **untracked (`??`)** → not deployed. `migration_lock.toml` is **absent**. |
| `src/app/api/researchers/route.ts` | Identical to the deployed commit (no diff vs `e4d24b5`); generic `catch` → `500 {"error":"Failed to fetch researchers"}`. |
| `src/app/blog/[slug]/page.tsx` | `generateMetadata` → `db.blogPost.findUnique` (line 11-21) with **no try/catch**; page → `db.blogPost.findUnique`; `if (!post)` → `notFound()` (404) and metadata `{ title: "Post Not Found" }`. Production returns **neither** 404 nor a fallback title → the query throws (or hangs then errors) before the null check. |
| `src/app/api/admin/settings/route.ts` (deployed version) | `await db.siteSetting.findMany(...)` with **no auth** (working tree adds auth) → explains probe 4. |
| `package.json` | **No `postinstall`/`prisma generate` hook** (build relies on platform auto-generation); scripts include `db:push`, `db:migrate`, `db:migrate:prod` (`prisma migrate deploy`) — two competing provisioning paths exist. |
| `vercel.json` | `$schema` + `"crons": []` only — no build/command overrides, so Prisma generation follows platform defaults. |
| `PRODUCTION_CHECKLIST.md` §1 | Mandates `DATABASE_URL=postgresql://...` in Vercel env (all environments) and `prisma migrate deploy` — i.e. the **intended** production datasource is **PostgreSQL**. |
| `.env.example` | `DATABASE_URL=postgresql://user:password@localhost:5432/lens_db?schema=public`; `NEXT_PUBLIC_SITE_URL=https://lens.org.bd` (legacy host). |
| `.env` (local, values not printed) | Contains exactly three keys: `DATABASE_URL`, `JWT_SECRET`, `NEXT_PUBLIC_SITE_URL`. The `DATABASE_URL` **scheme is `file:`** (SQLite, 15 chars) — i.e. local dev is SQLite against `prisma/dev.db`. |
| `.gitignore` | Ignores `.env*` and `*.db` → neither env values nor `dev.db` are ever in the deployment. |
| `node_modules/.prisma/client/schema.prisma` | Local generated client = `provider = "postgresql"` (generated from the **working-tree** schema, not from the deployed commit). |

---

## 3. Confirmed findings (repo-verified) — root cause candidates

`ROOT CAUSE NOT VERIFIABLE WITHOUT PRODUCTION LOGS / DATABASE ACCESS`

The following are **confirmed facts about the repository/deployment state**, ranked by how well they explain the symptoms. None can be *proven* to be the production failure without production logs/DB access:

**C1 — Provider/protocol mismatch in the deployed code (strongest candidate).**
The deployed commit (`e4d24b5`) carries `provider = "sqlite"` in `prisma/schema.prisma`, while the documented production datasource is `postgresql://…` (`PRODUCTION_CHECKLIST.md` §1, `.env.example`). A Prisma Client generated from a `sqlite` datasource rejects a `postgresql://` URL immediately at query time — producing exactly the observed uniform, fast, generic failures across `/api/researchers`, `/api/admin/settings`, `sitemap` DB reads, and `generateMetadata` on every detail route (with the route's own `catch`/stream behavior turning that into a 500, an empty payload, or a loading skeleton).

**C2 — Schema↔migration drift: 9 models have no `CREATE TABLE` anywhere (confirmed defect, independent of C1).**
Checked against the *committed* schema and the *tracked* migrations: `blog_posts` (BlogPost), `careers`, `media_items`, `menu_items`, `pages`, `page_sections`, `programs`, `resources`, `site_settings` — **9 of 34 models** have no `CREATE TABLE` in any migration (25 tables exist across migrations; 34 models declared). This alone guarantees `/blog/[slug]` (`blog_posts`) and `/api/admin/settings` (`site_settings`) fail on a database provisioned by `prisma migrate deploy`.
*Counter-evidence that C2 cannot be the whole story:* `researcher_profiles` **does** have a migration (`20260921000000_phase7_ai_i18n`), yet `/api/researchers` also fails → either migrations were never applied at all, or the failure is not table-availability (i.e. C1/C4/C5).

**C3 — Production is running the pre-migration codebase.**
Uncommitted/untracked in the working tree: the postgres provider flip, `20261001_pg_standardization`, `20261002_backup_r2_fields`, `src/lib/env.ts`, `src/app/api/health/`, and auth hardening on admin routes. `/api/health` → 404 live corroborates that the deployed tree equals committed state (`e4d24b5`), not the working tree.

**C4 — `DATABASE_URL` may be a `file:` (SQLite) value.**
The local `.env` uses a `file:` scheme; `prisma/dev.db` exists locally but `*.db` is gitignored, so it is absent from any deployment. If a `file:` value was copied into Vercel, the client fails immediately (file missing / read-only filesystem). This hypothesis is equally consistent with the fast-failure timing.

**C5 — Provisioning/hygiene gaps (contributing, not sufficient alone).**
No `migration_lock.toml`; duplicate migration timestamps (`20260921000000_phase7_ai_i18n` and `20260921000000_research_workflow`); non-standard migration directory names lacking `HHMMSS` (`20261001_pg_standardization`, `20261002_backup_r2_fields`); competing `db:push` vs `migrate deploy` paths; no `postinstall: prisma generate`; `src/lib/db.ts` does not cache the client in production and does not validate `DATABASE_URL`.

**C6 — Evidence-relevant security observation (deployed commit).**
Deployed `GET /api/admin/settings` performs **no authentication** before querying the DB. This is what made probe 4 possible and what proves the DB failure occurs pre-auth. The working-tree version already adds `requireAuth` — it is simply not deployed. (Flagged only; no code changed in Stage 0.)

**Ruled out by evidence:**
- *Gateway/robots blocking:* `Server: Vercel`, 500 (not 403/429); static pages fine.
- *Slow/unreachable network:* connect 0.02–0.32s, total <1s warm (would be ≈connect-timeout for `P1001`).
- *Auth-only failure:* probe 4 is unauthenticated and still 500; probe 5 shows auth itself works (401).

---

## 4. What remains unverifiable (without production logs / DB access)

1. The **value/scheme of production `DATABASE_URL`** (secret; never printed, never guessed): does it exist, is it `postgresql:` or `file:`?
2. Whether **migrations were ever applied** to the production database, and which ones.
3. The **exact Prisma error code** being thrown (`P1012` / `P1001` / `P2021` / `P1017` / protocol mismatch / `ECONNREFUSED`) — routes swallow it (`catch` → generic message, or Next's error boundary).
4. The **deployed commit SHA** (strong evidence points to `e4d24b5`, but this must be read from Vercel).
5. Whether the deployment generated the Prisma Client from the **committed `sqlite`** schema or from something else (no `postinstall` hook → platform default behavior must be confirmed).
6. Whether Sentry/runtime logs captured the original exception (Sentry env vars are commented out in `.env.example` and absent from local `.env`; production state unknown).
7. Whether `NEXT_PUBLIC_SITE_URL` in production is the legacy `https://lens.org.bd` (would corrupt every absolute URL emitted after Stage 1) — its **host only** needs checking, not its full value.

**Therefore, per the phase brief: `ROOT CAUSE NOT VERIFIABLE WITHOUT PRODUCTION LOGS / DATABASE ACCESS`.** No single cause is asserted; C1 and C4/C2 are the leading, evidence-backed candidates.

---

## 5. Exact production logs/commands needed

Run by an operator with Vercel + database access (no secrets to be shared back; scheme/host/error-code only):

1. **Vercel → Deployments → production deployment → Source Commit** — confirm it equals `e4d24b5` (or identify the real SHA). Corroborates C3.
2. **Vercel → Logs (Runtime)** — filter the production deployment for:
   - `api/researchers`
   - `api/admin/settings`
   - `/blog/[slug]` (function serving the page)
   Capture the raw Prisma/Node exception. Expected signatures and what each would prove:
   - `Environment variable not found: DATABASE_URL` → missing env (C1/C4 family)
   - `The provided protocol … is not supported` / `Expected … to start with 'file'` or `'postgres'` → **C1 confirmed**
   - `Can't reach database server at <host>:5432` / `ECONNREFUSED` / `ETIMEDOUT` → network/DB down
   - `Authentication failed` → wrong credentials
   - `The table `public.blog_posts` does not exist` (P2021) → **C2 confirmed** (then repeat for `researcher_profiles` to explain probe 1)
3. **Vercel → Settings → Environment Variables → Production** — record only: does `DATABASE_URL` exist, and what is its **scheme** (`postgresql:` vs `file:`)? Same for `NEXT_PUBLIC_SITE_URL` **host** (must be `lensbd.org`/`www.lensbd.org`, not `lens.org.bd`).
4. **From a shell with production env (or a one-off Vercel Function), never committing output:**
   - `npx prisma validate` → reports datasource/provider health for the schema actually deployed
   - `npx prisma migrate status` → applied vs pending migrations (expect: pending/never-applied if C2/C3)
   - `SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY 1;` (Postgres) — check `blog_posts`, `researcher_profiles`, `site_settings`; if the URL is `file:`, use `sqlite3 <file> ".tables"` instead
   - `npx prisma generate` on the **deployed commit**, then confirm generated `provider` (should be `postgresql` for a Postgres URL)
5. **Re-probe after any fix:** `GET /api/researchers` → expect `200` with a `researchers` array; `GET /blog/<slug>` → expect a real `<title>` and body; sitemap DB branch should return DB slugs instead of the 4 hardcoded ones.

---

## 6. Whether implementation can safely continue

**Yes — Stage 1 (metadata foundation) can safely proceed, with limits.**

- `src/app/layout.tsx` has **no database dependency** (no `db` import, no API calls); metadata resolution runs at render time without touching Prisma.
- The build/test/lint verification set does not require a live DB: the sitemap's DB read is wrapped in `try/catch` (working tree), and no static-generation path queries the DB.
- Stage 1 introduces **no** error-swallowing, no fallback masking, and no changes to `src/lib/db.ts`, Prisma, routes, or env handling — i.e. the DB failure is **not** hidden.
- **Prohibited in this phase (unchanged):** fixing or "papering over" the DB, touching `src/proxy.ts`, sitemap edits, structured-data implementation, homepage SSR conversion, i18n changes, DNS/hosting changes.
- **Stage 1 must not** state or imply that the production DB is fixed — it is not, and it cannot be verified from this environment.

---

## 7. Credentials and secrets

- **No credentials, tokens, passwords, connection strings, or secret values were read, printed, logged, or invented** in this diagnosis.
- Only **key names** (`DATABASE_URL`, `JWT_SECRET`, `NEXT_PUBLIC_SITE_URL`) and **non-secret structural facts** (URL *scheme* `file:` / documented `postgresql://` template from `.env.example`) were inspected.
- Production environment variables were **not** accessed; their state is listed as unverifiable in §4.

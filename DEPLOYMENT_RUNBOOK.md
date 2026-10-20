# LENS Platform — Production Deployment Runbook

Operational, PR-safe runbook for deploying and operating the LENS platform on **Vercel + Supabase** (Render phase documented but not active). Companion: `DEPLOYMENT_ARCHITECTURE.md`.

Golden rules:

1. No secret values in logs, reports, commits, tickets or screenshots.
2. **Read-only SQL is fine against production at any time.** No `migrate reset`, no `db push`, no `TRUNCATE`, no seed re-runs without explicit operator authorization.
3. Never force-push, never delete branches/migrations/backups.
4. Single owner per scheduled job (currently: GitHub Actions backup workflow only).
5. Verify before declaring success: use each service’s own deployment output.

---

## 1. Preconditions (do once, before first stable deploy)

| # | Step | Where | Verification |
|---|---|---|---|
| 1 | Vercel project connected to `kamalforhad-glitch/LENS-platform`, production branch `main`, **Root Directory: `/`** (repo root IS the app) | Vercel → Project Settings → Git | commit shown on deployments matches `main` HEAD |
| 2 | Domains `lensbd.org` + `www.lensbd.org` attached to Production | Vercel → Project Settings → Domains | apex 308-redirects to `www` (verified live); TLS auto (Vercel) |
| 3 | Supabase project created; connection strings obtained | Supabase → Project Settings → Database | connection info dialog shows pooled + direct URLs and URI credentials |
| 4 | Vercel environment variables set (§6 matrix) for **Production**, Preview, Development as appropriate | Vercel → Settings → Environment Variables | `pnpm/vercel env pull` or dashboard presence — names only in any record |
| 5 | `npx prisma validate` locally passes (needs only schema) | local | exit 0 |
| 6 | GitHub repo secrets for backup workflow exist (§ listed in `.github/workflows/backup.yml` header) | GitHub → Settings → Secrets → Actions | workflow preflight step is green |

---

## 2. Standard deploy pipeline (zero-touch)

```
git push heroku→  (read: git push origin main)
   → GitHub Actions CI (ci.yml): npm ci → prisma validate → lint → tsc → vitest → next build
   → Vercel production build from main (npm ci → prisma generate (postinstall) → next build)
   → Vercel promotes to production domain
```

* Build is reproducible without a database (`env.ts` supplies build-phase placeholders; DB-reading routes are dynamic and validated at runtime).
* Every deployment carries fresh Server Action IDs — expected; see rollback/recovery notes (§8).
* CI note (pre-existing): repository `npm run lint` currently reports 69 pre-existing errors unrelated to deployment (state rules, `any` types, legacy `<a href>` links). CI red on lint is tracked separately; **tsc/tests/build are green** and are the deployment gate. Do not “fix” lint in a deployment PR.

## 3. Local development builds/verification before pushing

```powershell
npm ci                 # generates Prisma client (postinstall)
npx prisma validate    # schema-only
npm test               # vitest — 79 tests
npm run build          # production build
```

---

## 4. Database (Supabase) operations

### 4.1 Connection rules

| Task | Connection | Variable |
|---|---|---|
| App runtime (Vercel functions, server actions) | Supabase **transaction pooler** port 6543 + `?pgbouncer=true&connection_limit=1` | `DATABASE_URL` |
| `prisma migrate deploy` | Supabase **direct** 5432 (schema `directUrl`) | `DIRECT_URL` |
| `pg_dump` / `psql` (backup, audits) | direct 5432 | `DIRECT_URL` (GitHub secrets for scheduled dumps) |
| everything else | — | never expose values |

`prisma migrate deploy` automatically resolves `directUrl` from `schema.prisma` — just set both env vars (values come from the Supabase dashboard; the direct URL is the one supabase shows for the direct connection, without `pgbouncer` parameters).

### 4.2 Read-only health audit (run any time)

Using `psql "$DIRECT_URL"` (or Supabase SQL editor, read-only):

```sql
-- 1) Postgres version (Supabase current major version)
SELECT version();

-- 2) Required extensions are installed on this project
SELECT extname, extversion FROM pg_extension WHERE extname IN ('vector','pg_trgm');

-- 3) Migration ledger — all 9 migrations applied, none failed
SELECT migration_name, finished_at, failed
  FROM _prisma_migrations
 ORDER BY started_at;
-- expect: 20250101000000_init … 20261020000001_page_parent_fk, failed=false

-- 4) Table census — public tables count & coverage
SELECT count(*) AS tables FROM information_schema.tables WHERE table_schema='public';
-- expected: 37 app tables + _prisma_migrations + (pgtrgm/pgvector-managed)

-- 5) Admin account census — prefixes only, NEVER the hash itself
SELECT email, role, active, left(password_hash,4) AS bcrypt_prefix, length(password_hash) AS len
  FROM users WHERE email = 'admin@lens.org.bd';
-- healthy: role=super_admin, active=true, prefix $2a$/$2b$/$2y$, len=60
```

If (5) shows a *different* prefix or wrong length → that account’s hash is malformed and must be **recovered** (§7.3) with explicit operator authorization. If (4) < 37 tables → migrations incomplete; run §4.3 (additive only).

### 4.3 Apply pending migrations (additive; run `migrate deploy`, never `push`)

```bash
export DIRECT_URL="postgresql://…"    # direct connection from Supabase dashboard
npx prisma migrate deploy             # reads directUrl automatically
```

Review output: it must list only `applying` records; a failure aborts before changing production. If a step fails with code matters — copy the error into a ticket; **do not** attempt `resolve`/manual SQL without operator sign-off.

### 4.4 Data migration from a previous database (only if needed)

1. Take a fresh dump: `pg_dump "$OLD_DIRECT_URL" --no-owner --no-acl --format=plain --file=old.sql` (store locally; never commit).
2. Compare table census (§4.2 query 4) between old and new DB.
3. Restore: `psql "$DIRECT_URL" --no-owner --quiet --file=old.sql` — **this writes to production**; requires explicit operator authorization and a post-restore row-count diff (`SELECT relname, n_live_tup FROM pg_stat_user_tables ORDER BY relname` on both DBs).
4. Rollback: re-point `DATABASE_URL`/`DIRECT_URL` at the previous database in Vercel env, then rebuild. Keep the old DB project until verification is complete.

### 4.5 Forbidden operations on production

`prisma db push`, `migrate reset`, `db migrate dev` (against prod URL), `db seed` without authorization (`db:seed` is idempotent but NOT run without permission), `TRUNCATE`/`DROP`/`DELETE` outside ticketed review.

---

## 5. Scheduled backups

* Schedule owner: **GitHub Actions** workflow `Scheduled database backup` (02:00 UTC daily + manual `workflow_dispatch`).
* Repository secrets required: `DIRECT_URL`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` (values live only in GH secrets).
* Artifact path: `s3://$R2_BUCKET/backups/<YYYY>/lens-backup-<ts>.sql.gz` — verify via workflow log step; the runner fails loudly if the object size is 0.
* Retention: Cloudflare R2 dashboard → bucket lifecycle rule **30 days** (do NOT script deletions).
* Manual/admin backup: admin UI → `/api/backup` (Bearer CRON_SECRET protected). On Vercel this reports “pg_dump is not available on this runtime…” — this is expected until backups run natively on a pg_dump-capable host (Render phase; see ARCHITECTURE §4.3).
* **Duplicate-schedule rule:** never enable Vercel/Render cron for backups while the GH workflow is enabled; disable one before enabling the other.

### Restore drill (staging only; never against production without authorization)

```bash
gunzip -c <backup>.sql.gz > restore.sql
psql "$STAGING_DIRECT_URL" --no-owner --quiet --file=restore.sql
```

---

## 6. Environment-variable matrix (actual repo usage)

Legend: **R**=required for production, **O**=optional feature flag, `NEXT_PUBLIC_*` (browser-visible, no secrets!),.

| Variable | Vercel (runtime) | Render phase | GitHub Actions secrets | Notes |
|---|---|---|---|---|
| `DATABASE_URL` | **R** (Supabase pooler 6543, `?pgbouncer=true&connection_limit=1`) | R | — | pooled |
| `DIRECT_URL` | **R** (only needed by migrations/dumps) | R | **R** | direct 5432 |
| `JWT_SECRET` | **R** (≥32 chars, else login fails closed) | R | — | server-side |
| `CRON_SECRET` | **R** (req. for /api/backup, /api/cron/backup) | R | — | server-side |
| `ADMIN_SEED_PASSWORD` | — (seed bootstrap only; see §7) | — | — | never a runtime dependency |
| `NEXT_PUBLIC_SITE_URL` | **R** — `https://www.lensbd.org` | R | — | canonical URL for metadata/sitemap |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | O | — | — | analytics |
| `NEXT_PUBLIC_META_PIXEL_ID` | O | — | — | analytics |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`, `NEXT_PUBLIC_BING_VERIFICATION` | O | — | — | SEO validation |
| `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `CDN_URL` | O (**R before relying on media uploads**) | R if media stays | — | S3-compatible store (R2 OK) |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT`, `R2_PUBLIC_URL` | O (durable backups) | O | **R** | Cloudflare R2 |
| `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_EMAIL` | O | O | — | dev-logs without key |
| `OPENAI_API_KEY` | O | O | — | AI assistant answers |
| `ORCID_ACCESS_TOKEN`, `CROSSREF_POLITE_EMAIL` | O | O | — | academic integration |
| `API_SECRET_KEY` | O | O | — | repository-declared key |
| `SENTRY_ORG`, `SENTRY_PROJECT`, `NEXT_PUBLIC_SENTRY_DSN` | O | O | — | error tracking |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | — (only when self-hosting multi-instance) | **R (P3+)** | — | prevents `Failed to find Server Action` across instances |

Do not invent variables not in this table (and `.env.example`).

---

## 7. Administrator bootstrap & recovery (`admin@lens.org.bd`)

### 7.1 Check whether the account exists first (read-only)

SQL §4.2 step 5. The seed **never** overwrites an existing admin — `ADMIN_SEED_PASSWORD` is only an input to `prisma/seed.ts`.

### 7.2 Create the first administrator (idempotent seed, authorized operation)

```bash
export DATABASE_URL="<direct-url>"      # direct connection in this shell only; never commit
export ADMIN_SEED_PASSWORD="<strong password>"   # shell-local; never print/commit
npx tsx prisma/seed.ts
# → “Default admin user created: admin@lens.org.bd (super_admin)” (or skips when present)
unset ADMIN_SEED_PASSWORD DATABASE_URL
```

Then sign in at the real route `https://www.lensbd.org/admin/login` (not `/login`, not `/signin` — the guard redirects `/admin → /admin/login`).

### 7.3 Recover access to an existing account (reset password)

Approved method, server-side and audited:

1. Operator (with DB read) confirms account row exists and is `active=true`.
2. Generate the new hash and update **in one local Node script that prints nothing** (bcryptjs and Prisma are project dependencies). Read both secrets from environment variables; never echo them:

   ```powershell
   # shells never print the password or hash; the script exits silently on success
   $env:NEW_ADMIN_PASSWORD='…'      # intended replacement password
   $env:DIRECT_URL='…'              # Supabase direct connection
   node -e "const {PrismaClient}=require('@prisma/client');const b=require('bcryptjs');const p=new PrismaClient();(async()=>{const hash=b.hashSync(process.env.NEW_ADMIN_PASSWORD,12);const u=await p.user.update({where:{email:'admin@lens.org.bd'},data:{passwordHash:hash},select:{id:true}});console.log('password updated for user', u.id);await p.$disconnect();})().catch(e=>{console.error('update failed:',e.message);process.exit(1);})"
   ```

   This is the ONLY sanctioned account-credential write. Preferably, when **any** super_admin can still sign in, use the Admin UI → Users → **Reset password** (`initiatePasswordReset` → single-use token → `/admin/invite/accept?token=…`) — it leaves a full audit trail and touches no SQL.
3. Rotate `JWT_SECRET` only if compromise is suspected — all sessions invalidate (users must re-login).

Never weaken password checks, never reset via “UPDATE … role” or deactivate accounts silently: use `setAdminActive`/`updateAdminRole` from the admin UI (super_admin only, fully audited).

### 7.4 If login returns `An internal error occurred. Please try again.`

Look up the exact server log line `[AUTH] Login error: …` in Vercel → Project → Runtime Logs (private server-side output). Map to ARCHITECTURE §3.2 table:

* `users`/`sessions` relation missing → run §4.3 migrations;
* `JWT_SECRET environment variable is required` / length warning → set env var (restart) §6;
* `Invalid salt version` → malformed hash → §7.3 recovery;
* `P1001/P1010/P2024` → Supabase connectivity/pooler fatigue — retest; verify DNS region/IP allowlist (Supabase network restrictions).

---

## 8. Rollback procedures

### 8.1 Application deployment

Vercel → Project → Deployments → previous stable production deployment → **Promote to Production** (no force push, no branch change). Domain re-points within seconds; Server Action mismatch on open tabs is self-healing via login-page reload UX (and harmless for read-only visitors).

If rolling forwards after an env change caused outage: revert env value in Vercel → project → environment → Redeploy (do not edit `next.config` reactively).

### 8.2 Database migrations

Only `migrate deploy` (additive) is used, so rollback = the previous application deployment (it keeps working against the newer schema). If a migration must truly be reverted:

1. Never drop data/tables manually on production.
2. Write a new **additive** migration that restores previous SQL semantics (study the migration file being reverted) — requires operator-approved review and does not purge data.
3. If data corruption risk is real → restore from §5 backup into a fresh Supabase staging project, reconcile, then authorized cutover.

### 8.3 Environment variables

Each Vercel env var panel retains history → previous value → Redeploy. Database URLs constitute an exception (see §4.4 rollback step). **Never** paste values anywhere outside the dashboard; store only names in tickets.

### 8.4 Scheduled backups

Restore the previous GitHub workflow file (git revert of the workflow commit), keep no partial dump objects uploaded; the R2 bucket is additive-only, so no rollback is needed for R2 side effects.

---

## 9. Render phase quickstart (NOT ACTIVE — template only, revisit when P3 begins)

Do not create this service yet — ARCHITECTURE §4.2 explains why. When P2/P3 is authorized:

```yaml
# render.yaml draft — revisit at P3 (validated once against a throwaway branch env)
services:
  - type: web
    name: lens-backend
    runtime: node
    plan: starter
    rootDir: .
    buildCommand: npm ci && npx prisma generate && npm run build
    startCommand: npm run start            # next start — full Next.js server
    healthCheckPath: /api/health
    autoDeploy: true
    envVars:
      - key: NEXT_PUBLIC_SITE_URL
        value: https://www.lensbd.org
      - key: DATABASE_URL
        sync: false
      - key: DIRECT_URL
        sync: false
      - key: JWT_SECRET
        generateValue: true
      - key: NEXT_SERVER_ACTIONS_ENCRYPTION_KEY
        generateValue: true     # copy the same value to every replica of this service
```

Deliberately absent: cron duplication, separate public static hosting, service-worker deploys. Render Cron for backups **replaces** (not duplicates) the GitHub workflow by disabling the GH schedule first. CORS for a future REST adapter: allow only `https://www.lensbd.org`.

---

## 10. Final verification checklist (post-deploy)

> **Probe-visible bot wall (by design, unchanged since before `c4bd9e1`):** curl's
> default User-Agent (`curl/…`) matches the `BLOCKED_BOTS` list and receives
> `403 Forbidden` (9-byte `text/plain` body, literal from `src/proxy.ts`) on any
> **HTML** route. This is `src/proxy.ts` bot detection (lines ~20–101), not a
> deployment or auth failure — API routes are exempt. Probe HTML routes with a
> browser-like `-A "Mozilla/5.0 … Safari/537.36"` UA; use `/api/health` for
> curl-based monitoring. The early-returned 403 carries platform-default
> `Cache-Control: public, max-age=0, must-revalidate` — the proxy's caching
> section is simply not reached on that path. A proxy 403 emits no runtime log
> (it short-circuits); 403-request visibility comes from Vercel request logs.

| # | Check | Method | Pass criteria |
|---|---|---|---|
| 1 | Deployment build succeeded | Vercel deployment page | Ready, source commit = expected |
| 2 | DB reachable from runtime | `GET /api/health` | `"database":"ok"` |
| 3 | Migrations applied | §4.2 ledger query | 9/9 applied, failed=false |
| 4 | Admin login works | browser: `/admin/login` | redirects to `/admin` dashboard |
| 5 | CMS CRUD | create/edit/publish a draft in /admin → pages | saves; audit_logs row appears |
| 6 | Media upload (if S3 configured) | admin → media → upload | object at `CDN_URL` |
| 7 | Public API | `GET /api/researchers` | 200, no secrets in body |
| 8 | SEO routes | `/robots.txt`, `/sitemap.xml`, `/rss.xml` | 200 |
| 9 | Cache sentinel | `curl -D - -A "Mozilla/5.0 … Safari/537.36" /admin/login` (browser-like UA) | HTTP 200 and `Cache-Control: no-store, must-revalidate` |
| 10 | CORS/session | admin session cookie has `HttpOnly; Secure; SameSite=Lax` | browser devtools |
| 11 | Sentry (if configured) | view a tagged error | event appears (or skip if not configured) |
| 12 | Backup workflow | `workflow_dispatch` run | verification step logs object size>0 |

---

## 11. Outstanding operator actions (not possible from this repo)

1. **Vercel:** confirm `JWT_SECRET` exists per environment (36+ chars) and equals a persistent value (rotation invalidates sessions silently).
2. **Supabase:** read-only audit steps §4.2 — attach outputs (names/statuses only) to the deployment ticket.
3. **Admin account:** run §4.2 step 5; choose §7.2 (create) or §7.3 (recovery) path per result.
4. **GH repo secrets** for the backup workflow (§5) + R2 lifecycle rule 30 days.
5. **Optional integrations** (S3/R2 media storage, Resend email, OpenAI, Sentry): set when features are activated — the health endpoint reports degraded until then.
6. **Lint debt:** 69 pre-existing errors independent of deployment (tracked; do not fold into deployment PRs).

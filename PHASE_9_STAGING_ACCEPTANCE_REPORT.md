# Phase 9 — Staging Acceptance Report

> No live PostgreSQL staging DATABASE_URL exists in this environment
> (local `DATABASE_URL` scheme is `file:`, sqlite; only `.env` + `.env.example`
> present; no staging env file, no staging credentials). Per RULE 1, all
> database-execution and HTTP-acceptance steps are BLOCKED, not fabricated.
> A bare local postgres server process is reachable on 127.0.0.1:5432 but no
> credentials or staging database designation exist for it — it was NOT
> touched (connecting to an unknown server without authorization would risk
> foreign data). No secrets printed. Step 1 env-key check: only key names
> inspected (SET/MISSING below).

## 1. Environment
**BLOCKED.** Local keys present: `DATABASE_URL` (SET, scheme `file:` — NOT
postgresql), `JWT_SECRET` (SET), `NEXT_PUBLIC_SITE_URL` (SET). Missing:
`CRON_SECRET`, `ADMIN_SEED_PASSWORD`, `RESEND_API_KEY`, `OPENAI_API_KEY`,
`S3_*` (MISSING — dev fallbacks apply). Staging env: NOT VERIFIED (does not
exist here). Production env vars NOT modified.

## 2. Prisma Generate
**BLOCKED (PRISMA_GENERATE_BLOCKED).** Single retry attempted with pg URL
override → same Windows EPERM rename failure on
`query_engine-windows.dll.node` (node processes hold the file; unrelated
IDE/agent processes NOT killed per safety rules, no repeated retries).
`npx tsc --noEmit` still passes against the last generated client. Must
succeed (with node processes stopped) before any staging deploy.

## 3. Migration
**BLOCKED — REAL POSTGRESQL STAGING DATABASE REQUIRED.** `prisma validate`
(pg override): valid. `migrate status`: P1010 denied, no reachable staging
database. `migrate deploy` NOT run. No reset, no `db push`, no drops, no
data touched. Migration history/files unverified against a live database.

## 4. PostgreSQL
**BLOCKED.** Extensions, live schema, index state: NOT VERIFIED (no
database). Nothing queried, nothing created.

## 5. pgvector
**BLOCKED.** `vector(1536)` column, HNSW/GIN/trigram indexes, similarity
queries: NOT VERIFIED live. Migration SQL remains code-reviewed only.

## 6. Full-text Search
**BLOCKED.** Real-record search, ranking, category/author/year/date filters,
Bengali search: NOT VERIFIED live. SQLi probes (`' OR 1=1 --`, `"`,
`' UNION SELECT`, malformed filters) NOT executed (no server; nothing
destructive attempted by policy). Code state (bound parameters + sanitized
tsQuery + whitelisted ORDER BY): CODE VERIFIED — LIVE EXECUTION NOT VERIFIED.

## 7. AI Retrieval
**BLOCKED.** Embedding insert, vector storage/dimensions, similarity query,
indexing/retrieval routes: NOT VERIFIED live. Database-vector vs OpenAI-
provider tests NOT separated by execution (no provider key here either:
`OPENAI_API_KEY` MISSING). No fake embeddings used; nothing claimed.

## 8. Transactions
**BLOCKED.** trackDownload, saveVersion/restoreVersion, author link/unlink,
review assignment/status transitions, partial-write checks against real DB
state: NOT VERIFIED live. `$transaction` wrappers remain CODE VERIFIED —
LIVE EXECUTION NOT VERIFIED.

## 9. Authentication HTTP Matrix
**BLOCKED.** Anonymous/viewer/editor/admin matrices over HTTP (401/403/200
per endpoint): NOT VERIFIED — no running application against staging.
Role predicates remain unit-tested (4/4 in `auth.test.ts`).

## 10. Upload Security
**BLOCKED (HTTP).** Viewer-403, editor allow (jpg/jpeg/png/webp/pdf),
svg/html/js/exe rejection, oversize/MIME/traversal probes, cleanup:
NOT VERIFIED live. Allowlist + quota + editor gate: unit-tested
(`storage.test.ts` 3/3) and code-read; no files uploaded or deleted.

## 11. SQL Injection
**BLOCKED (live).** See §6. No 500/SQL-error/leakage evidence obtainable
without a server. No destructive SQL executed.

## 12. AI IDOR
**BLOCKED (HTTP) / CODE VERIFIED.** Two-user GET/POST matrix (403/404),
own-conversation access, anonymous IP-bound behavior: NOT VERIFIED live.
Phase 8 `getOwnerKey`/`ownsConversation` implementation + unit tests (4/4)
unchanged and passing. Anonymous ownership remains IP-bound by design —
documented limitation, unchanged.

## 13. Cron
**BLOCKED (live).** No/wrong/correct `Authorization` matrix: NOT VERIFIED
over HTTP (no server). Fail-closed logic re-verified by reading
`src/app/api/cron/backup/route.ts` (503 unset / 401 mismatch). Secrets NOT
printed; backup contents NOT accessed.

## 14. Backup
**BLOCKED.** `pg_dump`/`psql` absent here and on Vercel; no backup executed,
none deleted. `backup.yml` inspection (Step 15): schedule `0 2 * * *` ✓,
manual dispatch ✓, `BACKUP_APP_URL` + `CRON_SECRET` via repo secrets only
(never hardcoded) ✓, Bearer header ✓, non-2xx → exit 1 ✓, no secret logging
(response body printed is the endpoint's own status JSON, contains no
secret) ✓. Workflow execution: **OPS REQUIRED — WORKFLOW EXECUTION NOT
VERIFIED** (secrets + remote repo run unavailable here). No success
fabricated.

## 15. S3 Persistence
**BLOCKED / NOT IMPLEMENTED.** `createBackup` does NOT persist to S3:
verified by grep (zero S3/PutObject/CDN references in `src/lib/backup/`) and
reading `createBackup` (local `filePath` → stat → DB update → cleanup →
email). **BACKUP ARTIFACT PERSISTENCE — BLOCKED.** Exact seam: after
`const fileStat = await stat(filePath);` (`src/lib/backup/index.ts:51`) —
read file bytes and `PutObjectCommand` via the already-installed
`@aws-sdk/client-s3`, keyed by `filename`, bucket/region/endpoint from the
existing `S3_*` env convention (`src/lib/storage/index.ts`, upload route);
then record the S3 key/URL on `backupRecord`. NOT implemented in this phase
(new persistence behavior needs staging to verify; no large architecture
introduced).

## 16. Tests
**PASS.** `npm test`: 5 files / **19 pass** (Phase 8 baseline 19/19).
`npx tsc --noEmit`: clean (exit 0, baseline clean).

## 17. Build
**PASS.** `npm run build` (pg URL override, `next@16.3.8`): success, 77
routes (baseline 77), incl. `/og`, `/api/health`, `/api/cron/backup`,
middleware; sitemap DB-fallback exercised in log, green.

## 18. New Regressions
**None.** Tests 19/19 (same), tsc clean (same), lint **76 problems (33
errors, 43 warnings)** — identical to Phase 8 closing counts; all 33 errors
pre-existing and documented, 0 introduced. Build 77 routes (same).

## 19. Remaining Production Blockers
1. No real PostgreSQL staging DATABASE_URL (gates §§3–14 live halves).
2. `prisma generate` EPERM (regen with node stopped; pre-deploy must).
3. S3 backup persistence NOT IMPLEMENTED (seam identified in §15).
4. Backup/cron workflow never executed (OPS secrets + remote run).
5. High/moderate audit items need majors (sharp/vitest/prisma line).
6. Required env unset outside local dev trio (hosting project env).
7. Anonymous AI ownership still IP-bound (product decision for signed-only).

## 20. Exact Next Actions
```bash
# 1. Provision staging Postgres; export a REAL staging URL (never commit it),
#    then ONLY against staging:
npx prisma validate && npx prisma migrate status && npx prisma migrate deploy
# 2. Stop ALL node processes, then: npx prisma generate && npx tsc --noEmit
# 3. Implement S3 upload at src/lib/backup/index.ts:51 seam; verify on staging
# 4. Set repo secrets BACKUP_APP_URL + CRON_SECRET; run backup.yml manually;
#    expect 2xx, then keep the schedule
# 5. Start app on staging URL; execute checklists: /api/health→200,
#    library search + SQLi probes, transactions, auth/upload/IDOR/cron matrices
# 6. Set hosting env (DATABASE_URL, JWT_SECRET≥32ch, CRON_SECRET,
#    ADMIN_SEED_PASSWORD, RESEND_*, OPENAI_*, S3_*/CDN_URL, SITE_URL, Sentry)
# 7. Staging-branch majors with E2E: sharp@0.35.5, vitest@5 (+types), prisma line
```

**NOT VERIFIED — REAL STAGING REQUIRED.** (No "production ready" claim:
critical acceptance tests have no live evidence.)

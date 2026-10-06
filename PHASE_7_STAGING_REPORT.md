# Phase 7 — Staging Verification Report

> Detail: `PHASE_7_STAGING_AUDIT.md`. No code changed in Phase 7 (only these two
> docs were created). No live PostgreSQL, no running server, no Vercel access —
> HTTP/runtime claims below are marked accordingly. No secrets are printed.

## 1. Environment
**BLOCKED** — Local `.env` keys: `DATABASE_URL` (scheme `file:`, sqlite),
`JWT_SECRET`, `NEXT_PUBLIC_SITE_URL` only. `CRON_SECRET`,
`ADMIN_SEED_PASSWORD`, `RESEND_API_KEY`, `OPENAI_API_KEY`, `S3_*` all MISSING
locally (expected for dev; fail-closed paths cover runtime). No staging env
exists to verify against.

## 2. PostgreSQL
**BLOCKED — REAL POSTGRESQL REQUIRED.** `prisma validate` (pg URL override):
valid. `prisma migrate status`: P1010 denied, no server at localhost:5432.
`migrate deploy`, extension creation, index builds, `SELECT 1` health branch:
NOT VERIFIED. Do NOT reset/delete anything — nothing was touched.

## 3. pgvector
**BLOCKED — REAL POSTGRESQL REQUIRED.** Schema declares
`Unsupported("vector(1536)")`; migration enables `vector` + `pg_trgm` and
builds HNSW/GIN indexes (idempotent SQL, reviewed only). Vector column,
`<=>` search, `to_tsvector`/`ts_rank`, trigram search, `GET
/library?search=<real term>`, AI retrieval on real data: NOT VERIFIED.

## 4. Authentication & Authorization
**PASS (code + unit) / NOT VERIFIED (HTTP).** 13 admin route files read:
GET→auth, POST/PUT→editor, DELETE→admin, 401/403 mapping. `backup/*`
admin-only (unchanged). Unit tests prove the role predicates
(anon/viewer/editor/admin matrix, 4/4 pass). Live HTTP matrix (anon 401,
viewer 403, editor 200, admin delete): NOT VERIFIED — no server started.

## 5. SQL Injection
**PASS (code) / NOT VERIFIED (live probe).** `$queryRawUnsafe` eliminated;
`$queryRaw` parameters + sanitized tsQuery + whitelisted ORDER BY via
`Prisma.raw()` verified by reading `src/lib/actions/library.ts`. Harmless
probes (`' OR 1=1 --`, `"`, `' UNION SELECT`) were NOT executed (no server);
no destructive SQL attempted. No SQL errors possible from filters by
construction (all values bound, sort strict-whitelisted).

## 6. Upload Security
**PASS (code + unit) / NOT VERIFIED (HTTP).** SVG removed from allowlist,
editor gate on `POST /api/upload`, size quotas — all unit-tested
(jpg/png/webp/pdf allow; svg/sh/exe reject; quota enforced; 3/3 pass).
Extension-vs-MIME cross-check, filename/path traversal over HTTP, and the
viewer-403 matrix: NOT VERIFIED live. Note: `validateFileType` trusts client
MIME (standard limitation; server-side sniffing is follow-up).

## 7. AI IDOR
**PARTIAL.** POST + GET ownership checks (IP-prefix `session-<ip>-`) and GET
rate-limit verified by reading `src/app/api/ai/chat/route.ts`; ownership rule
unit-tested (3/3 incl. chunking). Two-session HTTP test: NOT VERIFIED.
**Documented limitation:** IP-prefix binding over-shares behind NAT/shared
IPs and breaks under IP rotation (mobile/IPv6). Durable fix (signedIBR
session cookie → conversation ownership) is follow-up work, NOT applied here
per Phase 7 rules. Security was NOT weakened to pass anything.

## 8. Cron
**PASS (code) / BLOCKED (execution).** No-auth → 503 (secret unset) / 401
(wrong secret) / executes (correct Bearer) verified by reading
`src/app/api/cron/backup/route.ts`. Live 3-case matrix: NOT VERIFIED.
**Vercel limitation (verified from `vercel.json`):** cron entries support
path+schedule only — Vercel cannot attach the `Authorization` header, so the
scheduled job would 401 permanently. Fix = trigger from a scheduler that can
send headers (e.g. GitHub Actions workflow with `CRON_SECRET`) or redesign
cron auth; NOT changed here (new-infra decision belongs to ops).

## 9. Backup
**BLOCKED — PRODUCTION BLOCKER / ARCHITECTURE LIMITATION.** Code verified by
reading: `execFile` argv (no shell), `mkdir -p`, plain-SQL `.sql` format,
`basename()` traversal guard. But: `pg_dump`/`psql`/`pg_restore` are
**absent** on this machine AND unavailable on Vercel serverless; `backups/`
is ephemeral (`git-ignored`, lost on redeploy). The backup strategy is
correct code with no executable host. No backups created/deleted. Required:
external Postgres host or container with pg tools + S3-persisted artifacts
before any production cutover.

## 10. Health Check
**PASS.** `GET /api/health` source verified: `SELECT 1` DB probe, 200 when
healthy, 503 when DB down or cron unconfigured; response contains only
`ok/degraded/down` flags + version — **no passwords, JWT_SECRET,
DATABASE_URL, API keys, or tokens**. Live 200/503 branches: NOT VERIFIED
(no server); logic is branch-trivial and reviewed.

## 11. Tests
**PASS with noted backlog.**
- `npm test`: 5 files / 18 pass.
- `npx tsc --noEmit`: clean (exit 0).
- `npm run build` (pg URL override): success, 77 routes incl. `/api/health`;
  sitemap DB-fallback exercised live in build log (denied-access → static
  slugs, build green).
- `npm run lint`: 77 problems (34 errors, 43 warnings) — ALL pre-existing
  patterns (admin `set-state-in-effect`, GlobeNetwork refs, AssistantContent
  purity, `seed.js` require-imports); every Phase 1–6 touched file is 0-error
  (scoped run: 0 errors, 4 pre-existing warnings). One new instance of the
  pre-existing `set-state-in-effect` pattern exists in Phase 5
  `ImpactContent.tsx:64` (same idiom as 20+ siblings) — left as-is per
  "do NOT modify unrelated lint errors".
- `prisma generate`: BLOCKED by Windows EPERM file-lock (retry with node
  processes stopped); schema itself validates.

## 12. npm Audit
**LIST FINDINGS (none fixed — per instructions, no `audit fix` run):**
1. `next@16.3.5` — **critical**, RCE in next/og `ImageResponse`
   (GHSA-vcvr-r3jv-pc5j, range ≥16.2.0 <16.3.6). Affects code path: project
   ships `src/app/og/route.tsx`. Fix: `next@16.3.8` (non-major, outside
   pinned range). Breaking risk: low-medium (patch line, but framework is
   pinned exact + `eslint-config-next@16.3.5` + AGENTS.md breaking-change
   warning). **Safest: upgrade to 16.3.8 on a staging branch and run full
   E2E (esp. `/og`, middleware, build) before merging.**
2. `sharp` — **high** (libvips CVEs + libheif heap over-reads). Affects:
   image optimization pipeline. Fix: `sharp@0.35.5` (**major**). Risk:
   medium (native module, Node 26). Upgrade with staging image tests.
3. `prisma` / `@prisma/config` via `deepmerge-ts` — **high** (stack
   exhaustion on recursive graphs). Affects: build-time config merge only,
   not request path. Fix available (`npm audit fix`, non-breaking).
   **Safest to apply first** among the set.
4. `vitest` + `@vitest/mocker` — **moderate** (path traversal via redirect
   mock, dev-only, test-time). Fix: `vitest@5.0.3` (**major**, needs
   `@types/node` ≥22; project pins v20). Risk: dev-only; defer to a
   dedicated dev-deps upgrade (Node 22+/types bump).

## 13. Vercel Compatibility
**BLOCKED (backup/cron) / PASS (rest).** Verified from
`vercel.json`+`next.config.ts`+`proxy.ts`: app build, middleware, env-flag
behavior, and `remotePatterns` are Vercel-compatible. Incompatible as
designed: (a) cron Bearer gate unreachable from Vercel cron (no headers);
(b) `pg_dump`/`psql` absent; (c) `backups/` + `public/uploads` ephemeral —
uploads silently land locally when `S3_*` unset and vanish on redeploy.
Assumption check: nothing in config provisions Postgres/pgvector/S3 — all
must be external project env + services. Do NOT assume Vercel provides any
of them.

## 14. Remaining Production Blockers
1. No real PostgreSQL staging: migrations, pgvector, search, transactions
   unverified live. (Needs: provisioned PG + `migrate deploy` + seed.)
2. `next` critical RCE unpatched (needs: 16.3.8 staging E2E).
3. Backup/cron not executable on Vercel (needs: external scheduler with
   secret + pg-tools host + S3 artifact persistence).
4. HTTP security matrices never executed (needs: staging deploy + checklist
   §3 probes).
5. Required env unset everywhere except local dev trio (needs: Vercel project
   env per checklist §2).
6. `prisma generate` EPERM on Windows (needs: regen with node stopped).
7. AI ownership is IP-prefix interim control (needs: signed-session model).

## 15. Safe Next Steps
```bash
# 1. Provision staging Postgres (with vector+pg_trgm privileges), then:
DATABASE_URL="postgresql://USER:PASS@HOST:5432/lens_db?schema=public" npx prisma migrate status
DATABASE_URL="postgresql://USER:PASS@HOST:5432/lens_db?schema=public" npx prisma migrate deploy
# stop all node processes first, then:
npx prisma generate
# 2. Set Vercel env: DATABASE_URL, JWT_SECRET (≥32ch), CRON_SECRET,
#    ADMIN_SEED_PASSWORD, RESEND_API_KEY/EMAIL_FROM/ADMIN_EMAIL,
#    OPENAI_API_KEY, S3_BUCKET/S3_REGION/S3_ENDPOINT/S3_ACCESS_KEY_ID/
#    S3_SECRET_ACCESS_KEY/CDN_URL, NEXT_PUBLIC_SITE_URL, Sentry DSN/org/project
# 3. Lowest-risk audit fix first: npm audit fix  (covers deepmerge-ts chain)
# 4. Staging branch: npm install next@16.3.8  + full E2E (esp. /og + middleware)
# 5. External backup trigger (example): GitHub Actions cron →
#    curl -H "Authorization: Bearer $CRON_SECRET" https://<domain>/api/cron/backup
# 6. Deploy staging → run PRODUCTION_CHECKLIST.md §3 probes →
#    /api/health → promote to production → monitor 48h
```

**NOT production ready.** (Per the gate: no live-PG staging, unpatched
critical, unverified backup strategy, unconfigured env, unexecuted HTTP
security matrices.)

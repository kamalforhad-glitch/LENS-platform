# Production Readiness Checklist — LENS Website

## 1. Database (PostgreSQL + pgvector)
- [ ] Provision Postgres with `vector` and `pg_trgm` extensions (`CREATE EXTENSION` needs privileges).
- [ ] Set `DATABASE_URL=postgresql://...` in Vercel env (all environments).
- [ ] Run `prisma migrate deploy` on staging first; verify `20261001_pg_standardization` applies cleanly.
- [ ] Verify full-text search (`/library?search=...`) and AI vector search on staging data.
- [ ] Migrate data from `prisma/dev.db` if needed (do NOT commit `dev.db`).
- [ ] Regenerate Prisma client after deploy (`prisma generate` — retry if Windows EPERM file-lock).

## 2. Secrets & Env
- [ ] `JWT_SECRET` ≥ 32 chars (all envs). App fails closed if missing.
- [ ] `CRON_SECRET` set in app + Vercel Cron `Authorization: Bearer` header (`vercel.json` path `/api/cron/backup`).
- [ ] `ADMIN_SEED_PASSWORD` set for first seed; rotate immediately; never use `admin123`.
- [ ] `RESEND_API_KEY` + `EMAIL_FROM` + `ADMIN_EMAIL` (else contact/newsletter log dev-mode only).
- [ ] `OPENAI_API_KEY` (else AI returns retrieval fallback, no LLM answers).
- [ ] `S3_*` + `CDN_URL` (else uploads go to ephemeral `public/uploads`).
- [ ] `NEXT_PUBLIC_SITE_URL` matches production domain (OG/sitemap/canonical).
- [ ] Sentry DSN + org/project if error tracking required.

## 3. Security verification (staging)
- [ ] Admin APIs return 401 anon / 403 viewer-on-write / 403 viewer-on-delete.
- [ ] `POST /api/upload` as viewer → 403; `.svg` upload → 400.
- [ ] AI chat cross-IP `conversationId` → 403 (POST + GET).
- [ ] `GET /api/cron/backup` without/with wrong secret → 401/503 (never 200).
- [ ] SQLi probe on `/library` filters (`' OR 1=1 --`) returns normal results, no 500.
- [ ] Login hint shows no default credentials.

## 4. Data integrity
- [ ] Concurrent download tracking increments correctly (no lost counts).
- [ ] Version save/restore round-trip preserves content.
- [ ] Review status transitions (`pending → under_review / revision_requested`) correct.
- [ ] Bengali titles produce non-empty unique slugs.
- [ ] Invalid event dates rejected with 400/`Invalid ...` (no `Invalid Date` in DB).

## 5. Frontend / SEO
- [ ] `/api/health` returns 200 with `database: ok`.
- [ ] `/sitemap.xml` lists DB research slugs (not just the 4 static fallbacks).
- [ ] Impact page shows Retry on API failure (block analytics endpoints to test).
- [ ] Researcher/admin avatars load via `next/image` (no 404).
- [ ] `npm test` (18 tests) + `npx tsc --noEmit` + `npm run lint` clean (0 new errors).

## 6. Cutover
- [ ] Backup production DB (`pg_dump` plain format) before first deploy.
- [ ] Deploy to staging → run checklist → promote to production.
- [ ] Confirm Vercel cron `0 2 * * *` succeeds (check `backup_records` + admin email report).
- [ ] Monitor Sentry + `/api/health` for 48h.

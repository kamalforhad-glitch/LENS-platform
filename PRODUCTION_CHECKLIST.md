# Production Readiness Checklist — LENS Website

> Refreshed after the CMS hardening session. CMS-specific smoke evidence lives in
> `CMS_IMPLEMENTATION_PLAN.md` §8; this file is the deploy-day runbook.

## 1. Database (PostgreSQL + pgvector)
- [ ] Provision Postgres with `vector` and `pg_trgm` extensions (`CREATE EXTENSION` needs privileges).
- [ ] Set `DATABASE_URL=postgresql://...` in Vercel env (all environments).
- [ ] Run `prisma migrate deploy` on staging first; verify `20261020000000_cms_admin_security` applies cleanly (additive only).
- [ ] Verify full-text search (`/library?search=...`) and AI vector search on staging data.
- [ ] Confirm the seeded CMS baseline: ≤1 minute later `prisma seed_cms` is idempotent (20 settings, 47 menu items, home page + 5 sections) and does not duplicate.
- [ ] Regenerate Prisma client after deploy (`prisma generate` — retry if Windows EPERM file-lock).

## 2. Secrets & Env
- [ ] `JWT_SECRET` ≥ 32 chars (all envs). App fails closed if missing.
- [ ] `CRON_SECRET` set in app + Vercel Cron `Authorization: Bearer` header (`vercel.json` path `/api/cron/backup`).
- [ ] `ADMIN_SEED_PASSWORD` set for first seed; rotate immediately; never use `admin123`.
- [ ] `RESEND_API_KEY` + `EMAIL_FROM` + `ADMIN_EMAIL` (else contact/newsletter log dev-mode only).
- [ ] `OPENAI_API_KEY` (else AI returns retrieval fallback, no LLM answers).
- [ ] `S3_*` + `CDN_URL` set — **required for CMS media**: without it uploads land on ephemeral `public/uploads` and are lost on redeploy.
- [ ] `NEXT_PUBLIC_SITE_URL` matches production domain (OG/canonical; sitemap+RSS normalize the apex to `www.lensbd.org`).
- [ ] Sentry DSN + org/project if error tracking required.

## 3. Security verification (staging)
- [ ] Admin APIs return 401 anon / 403 viewer-on-write / 403 viewer-on-delete.
- [ ] `POST /api/upload` as viewer → 403; `.svg` upload → 400; a renamed-HTML `.jpg` → 400 via
      magic-byte sniff (files reach `logMediaUpload` only after `verifyUploadContent`).
- [ ] AI chat cross-IP `conversationId` → 403 (POST + GET).
- [ ] `GET /api/cron/backup` without/with wrong secret → 401/503 (never 200).
- [ ] SQLi probe on `/library` filters (`' OR 1=1 --`) returns normal results, no 500.
- [ ] Login hint shows no default credentials.
- [ ] Login limiter: 5 wrong logins from one IP+email → 429/locked hint, then success resets the counter.
- [ ] Reserved-slug guard: `PUT /api/admin/pages` with slug `admin`/`research` → 400 human-readable error.
- [ ] Media delete on a referenced file → `{ blocked: true, references: [...] }`, not a 500; audit rows
      `media_delete_blocked` and later `media_deleted` visible in `/admin` audit trail.

## 4. Data integrity
- [ ] Concurrent download tracking increments correctly (no lost counts).
- [ ] Version save/restore round-trip preserves content.
- [ ] Review status transitions (`pending → under_review / revision_requested`) correct.
- [ ] Bengali titles produce non-empty unique slugs.
- [ ] Invalid event dates rejected with 400/`Invalid ...` (no `Invalid Date` in DB).
- [ ] Page delete cascades its sections; audit keeps `section_created/updated/deleted`,
      `page_created/updated/published/unpublished/duplicated/deleted` trail rows.

## 5. Frontend / SEO
- [ ] `/api/health` returns 200 with `database: ok`.
- [ ] `/sitemap.xml` is dynamic: publish a test page → it appears; delete it →
      it disappears with **no rebuild** (`force-dynamic` metadata route).
- [ ] `/sitemap.xml` lists published CMS pages + published blog posts (drafts excluded).
- [ ] `/rss.xml` returns `application/rss+xml` with published blog + research items;
      the footer RSS icon links there without 404.
- [ ] Impact page shows Retry on API failure (block analytics endpoints to test).
- [ ] Researcher/admin avatars load via `next/image` (no 404).
- [ ] `npx vitest run` + `npx tsc --noEmit` + `npm run lint` clean (0 new errors).
- [ ] **Caveat re-check:** a request for a missing/unpublished page streams the branded 404 shell
      (correct `noindex`) while Next 16 logs status 200 — confirm crawlers treat it as soft-404 removal.

## 6. Cutover
- [ ] Backup production DB (`pg_dump` plain format) before first deploy.
- [ ] Deploy to staging → run checklist → promote to production.
- [ ] Confirm Vercel cron `0 2 * * *` succeeds (check `backup_records` + admin email report).
- [ ] Monitor Sentry + `/api/health` for 48h.

## 7. Repository hygiene (before/during cutover)
- [ ] Commit the CMS working tree (all new modules below are untracked until committed):
      `src/lib/actions/media.ts`, `src/components/admin/MediaPickerModal.tsx`,
      `src/app/admin/media/`, `src/app/admin/media-items/[id]/`, `src/app/rss.xml/`,
      `src/app/[slug]/`, `src/app/admin/preview/`, `src/app/sitemap.ts` (+ `src/lib/site-url.ts`),
      migrations, tests, and both docs.
- [ ] Remove local-only artifacts from the deployment payload: `tmp_*.cjs` probe scripts
      and any leftover `public/uploads/` tree (local storage only).
- [ ] Tag the release (e.g. `v0.3.0-cms`) so the additive migration is pinned.

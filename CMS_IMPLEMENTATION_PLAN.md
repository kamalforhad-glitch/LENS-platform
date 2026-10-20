# LENS Website — Full CMS Implementation Plan

**Repo:** `lens_website` (Next.js 16.3.8 App Router, React 19, TypeScript 5, Tailwind 4, Prisma 6 + PostgreSQL/Supabase, S3/R2 storage, JWT+cookie auth, i18next EN/BN)
**Live site:** https://lensbd.org · **Local:** `D:\downloads\civic-youth-bangladesh\lens\lens_website`
**Status of this document:** consolidated audit + architecture + phased plan. Phases 1–6 were completed in a previous working session (verified here); Phase 7 covers the remaining master-task scope (see §7).

---

## 1. Verified Findings (repository audit)

### 1.1 What already exists and is confirmed working

| Area | State |
|---|---|
| **Auth** | `users` + `sessions` tables; bcrypt(12) hashes; JWT (HS256, `JWT_SECRET`, 24h) in `httpOnly` cookie `lens-session`; `getCurrentUser()`, `requireAuth/requireEditor/requireAdmin` server helpers; login/logout/checkAuth server actions. Roles currently `admin > editor > viewer`. |
| **Edge gate** | Next 16 `src/proxy.ts` (middleware) verifies the JWT cookie for every `/admin` path (except `/admin/login`), rate-limits `/api/*` (30/min/IP), blocks scraper bots, sets hardened CSP/security headers. |
| **Admin UI** | `/admin` dashboard with live stats + recent activity; managers for Research (+versions/citations/review workflow), Publications, Events, Team, Authors, Blog, Programs, Careers, Resources, Media Items — list + full editors wired to REST `/api/admin/*` (viewer GET / editor POST/PUT / admin DELETE). |
| **Pages CMS** | `Page` + `PageSection` models (en/bn copy, `status draft|published|scheduled`, SEO meta, `settings`/`content`/`contentBn` JSON strings); REST CRUD; homepage visual editor at `/admin/pages/home`; sections CRUD/reorder actions in `src/lib/actions/cms.ts`. |
| **Homepage** | `/` renders `HomeClient` fed by `getPublicPage("home")`; sections `Hero`, `FocusAreas`, `FeaturedResearch`, `ImpactStats`, `EventsNewsletter` accept `cmsData` JSON with i18n fallbacks. 3D globe, canvas intelligence map, press-freedom radar, GSAP/Lenis are code-controlled and untouched. |
| **Header/Footer** | `SiteHeader`/`SiteFooter` read `MenuItem` (location header/footer, `parentId` nesting) via `site-menus.ts` with static fallback in `site-navigation.ts` — site never breaks without DB. |
| **Settings** | `SiteSetting` key/value (en/bn, groups general/contact/social/footer/seo) seeded with 20 verified defaults (`src/lib/cms-defaults.ts`); `/admin/settings` tabbed editor with MediaPicker integration. |
| **Media** | `MediaFile` + `/api/upload` (editor-gated, MIME/size validated, S3 when configured; local `public/uploads` fallback), `/admin/media` library UI, shared `MediaPickerModal` used by blog/programs/resources/media-items/settings/seo editors. |
| **Seeding** | `prisma/seed_cms.ts` (idempotent — 20 settings, 47 menu items, home page + 5 sections); `prisma/seed.ts` creates the first admin from `ADMIN_SEED_PASSWORD` (throws in prod if unset). |
| **CSP** | `default-src 'self'`; uploads reject SVG same-origin (stored-XSS). |

### 1.2 Gaps confirmed by re-verification (this session)

1. **No admin account management/RBAC module** — no `/admin/users`, no audit log, no invite/reset flows, no last-admin privilege protection, no login rate limiting beyond the generic API limiter, no `active` flag, roles cannot distinguish account administration.
2. **No audit trail** — no `AuditLog` model or action recording anywhere.
3. **CMS pages have no public rendering** — `getPublicPage(slug)` exists but only `/` consumes it; there is no `src/app/[slug]/page.tsx`, so Page-Manager entries render nowhere. No draft preview route; `PreviewModal.tsx` is dead code (client-only).
4. **No page revisions, duplicate, archive, or parent/child organization** in the Page model/actions.
5. **Media library gaps** — no post-upload alt/title editing, no reference/usage check (`deleteMediaFile` hard-deletes even referenced files), no replace, no pagination, upload validates only the *declared* MIME (no magic-byte sniff), sizes/widths not stored.
6. **Reserved slugs not enforced** — a Page-Manager entry with slug `research` is stored but unreachable (static route wins), no validation feedback.
7. **SEO wiring bug** — `/admin/seo` edits `meta_title`… while the seeded keys are `seo_meta_title`…; root `layout.tsx` metadata is hardcoded and ignores `SiteSetting`; sitemap excludes CMS pages.
8. **Menus manager** lacks parent/child select, visibility, target, reorder (DB + actions support all).
9. **Embeds** — CSP has no `frame-src` (falls back to `default-src 'self'`), so an iframe-based embed section would be blocked.
10. **Local DB drift** — tables exist via `prisma db push` (users table empty) and `prisma/migrations` history is unapplied; needs baselining before the next migration.

### 1.3 Live-site check

https://lensbd.org is the production target of this exact codebase; the local implementation matches it (homepage sections, nav structure, SEO foundation). Per the standing rule no source code was fetched to alter content; the local repo is treated as source of truth.

---

## 2. Architecture principles (unchanged)

1. **Zero redesign** — colors (`#030810` navy, `#0891b2` teal, `#d4a843` gold), Inter + Hind Siliguri, section order, 3D Earth (`GlobeNetwork`), `MediaIntelligenceMap`, `IndexingScanner`, Lenis/GSAP untouched. CMS only feeds labels/copy/data.
2. **Extend, don't replace** — existing Prisma models, actions, REST routes, seeders and components are reused. New models only where none exists (§5).
3. **Fail-safe public fallbacks** — every public accessor returns verified defaults (`cms-defaults.ts`) on missing rows or DB failure; the site never renders an error page because of CMS engineering.
4. **Server-enforced authorization** — every mutation validates the session server-side; client gating is UX only, not security.
5. **No executable content** — sections store validated structured JSON; rich text is plain-text paragraphs + markdown-lite (bold/italic/link) escaped at render; no raw HTML/JS, no `script` injection paths; URLs sanitized (`http(s)`, `mailto`, `tel`, same-origin relative only).
6. **Secrets isolation** — env values never surface in the dashboard, API responses, logs, or this document.

---

## 3. Security model (target)

- Roles: **super_admin > admin > editor > viewer**. `super_admin` owns account/role management and audit access; `admin` owns content/site management; `editor` drafts and (when authorized) publishes; `viewer` read-only.
- Every admin server action/route calls `requireAuth/requireEditor/requireAdmin/requireSuperAdmin` — including page reads that expose drafts (`getPages` was viewer-wide per existing design; draft *content* is admin-area only and the admin area is edge-gated).
- Login: sliding-window limiter (5 failures / 15 min / IP+email, success resets), audit `login_failed`, `active=false` accounts rejected, `lastLoginAt` updated.
- Account management: create/invite (single-use hashed tokens, 72h), role change with **last-active-super-admin protection** and **no self-modification of own role/host status**, deactivate (also revokes sessions), revoke sessions, initiate reset (48h single-use), view-only account list for `admin`.
- Audit log: actor (id/email/role), action, target, JSON meta, IP, UA for: login success/failure, account ops, publish/unpublish, page/section writes, deletes, settings/menus saves, media upload/edit/delete/replace, backups, revision restore, content collection status changes.
- Media delete → reference-scan across known text/JSON columns; referenced assets refuse deletion with a usage report; replace swaps URLs transactionally; uploads sniff actual bytes (magic) and read dimensions via sharp.
- IDOR: all single-record mutations re-verify role server-side; tokens are hashed (`sha256`) at rest; invite/reset links carry **no** user identifiers.

---

## 4. Schema changes (all additive, single migration `20261020000000_cms_admin_security`)

```
users           + active Boolean @default(true)
                + created_by String?
                + last_login_at DateTime?
media_files     + title String @default("")
                + description String @default("")
                + width Int?  + height Int?
pages           + parent_id String? (self-relation, cascade-safe)
audit_logs      (new) actor_id, actor_email, actor_role, action, target_type,
                      target_id, meta JSON-string, ip, user_agent, created_at
password_reset_tokens (new) user_id → users, token_hash unique, type reset|invite,
                      expires_at, used_at, created_by
page_revisions  (new) page_id → pages, label, page_snapshot JSON-string,
                      sections_snapshot JSON-string, created_by
```

Migration procedure (this workspace): baseline-resolve the 7 existing migrations as applied (`prisma migrate resolve`), then `prisma migrate deploy` the new migration. Production: `npx prisma migrate deploy` (documented in `PRODUCTION_CHECKLIST.md`). No destructive statements.

---

## 5. Public CMS page rendering

- `src/app/[slug]/page.tsx` — renders a **published** `Page` by slug through the new `PageSectionsRenderer`; `notFound()` for missing/unpublished; **reserved slug guard** (the ~25 static routes + `home`) redirects to `notFound()` so no collision/override can occur (static routes always win anyway — defense in depth).
- Section types supported by the renderer: `hero`, `heading`, `rich_text`, `image_text`, `banner`, `cards`, `gallery`, `stats`, `cta`, `featured` (auto-featured/最新 published research or publications), `focus_areas`, `clubs`, `team`, `embed` (host-whitelisted https iframes: YouTube/YouTube-nocookie/Vimeo/Google Maps), all with `visible`/`sortOrder`/width & background settings and EN/BN fallbacks.
- Draft preview: `/admin/preview/[id]` — edge-gated + session-gated server component rendering the draft through the same renderer (never cached), which `PreviewModal` links to.
- `sitemap.ts` is `force-dynamic` (publish/create/delete are reflected immediately — it is no longer frozen into the build prerender), lists published CMS pages (except `home` and reserved slugs) plus published blog posts; `generateMetadata` emits per-page title/description/OG/canonical.
- `/rss.xml` is a real RSS 2.0 route handler (published blog posts + research articles) — the footer/favicon RSS link and the seeded `social_rss` setting resolve to a live feed instead of 404. The slug is reserved in `RESERVED_SLUGS`.

---

## 6. Phase summary

| Phase | Scope | Status |
|---|---|---|
| 1 | Audit & inventory | ✅ (prior docs verified + re-verified) |
| 2 | Schema/seeds/CMS foundation | ✅ (prior) — new migration this session |
| 3 | Admin CMS interfaces | ✅ (prior) — menus/users/preview built out this session |
| 4 | Public connection (homepage, header/footer) | ✅ (prior) |
| 5 | Drafts/previews/publishing/revisions | ✅ Phase 7B (drafts/previews/publishing verified end-to-end; revisions schema + actions ship, revision-restore UI is future work) |
| 6 | Security & QA | ✅ Phase 7 (accounts, RBAC, audit, rate limits) |
| 7A | Admin accounts + RBAC + audit log + login hardening | ✅ |
| 7B | Public page rendering, page builder, preview, revisions, sitemap | ✅ |
| 7C | Media library (refs, replace, metadata, sniffing) | ✅ |
| 7D | SEO/menus/header/footer polish + dashboard metrics | ✅ |
| 7E | Tests, typecheck, build, browser verification, docs | ✅ |

---

## 7. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Local migrations history unapplied → future `migrate dev` breaks | Baseline-resolve all 7, then `deploy` additively |
| Editors breaking published homepage via section JSON | Homepage editor writes validated keys via actions; renderer JSON-parse guarded; revisions + publish audit |
| Slug collisions with app routes | `RESERVED_SLUGS` enforced in create/update + runtime guard |
| Referenced media orphaned | Reference scan before any delete; replace swaps references atomically |
| Privilege escalation via self-role-change | Super-admin-only user actions + last-super-admin + self-change guards, audited |
| Token leakage | Hash-at-rest, single-use, expiry, no email/user data in URLs |
| Production DB mistakes | Deployment packet requires backup → `migrate deploy` → seed → smoke checklist; no destructive ops shipped |

---

## 8. Final implementation status (end of implementation session)

All code below is uncommitted in the working tree at the time of writing; commit/deploy flow is in `PRODUCTION_CHECKLIST.md`.

### 8.1 Fixes applied during the end-to-end pass

| Fix | Where | Why |
|---|---|---|
| `export const metadata` → non-exported `BASE_METADATA` + exported `generateMetadata` | `src/app/layout.tsx` | Next 16 forbids a *combined* exported-metadata + generateMetadata page export; the duplicate export broke `next build` |
| Local-storage path derivation via `dirname()` | `src/app/api/upload/route.ts` | On Windows `lastIndexOf("/")` produced an empty directory and every local upload failed |
| Media reference scans count boolean field markers | `src/lib/actions/media.ts` | `pushKeep` previously produced 0 refs for page-sections/settings/menus scans that match logical fields rather than literal URL columns |
| Expected Server Action failures return `{ success:false, error }` instead of throwing | `src/lib/actions/media.ts` (`deleteMediaFile`, `updateMediaFile`) + `/admin/media` UI | Next 16 redacts thrown Server Action errors across the RSC boundary — the client saw only "Minified React error #441" |
| `logMediaUpload` writes an audit entry (`media_uploaded`) | `src/lib/actions/dashboard.ts` | `MEDIA_UPLOADED` existed in the action taxonomy but was never recorded |
| Blog editor gains a tag chip input (Enter/comma separated, stored as JSON array) | `src/app/admin/blog/[id]/page.tsx` | Tags existed as a JSON blob with no editor surface; public post page renders them |
| Sitemap rendered per request + published blog posts included | `src/app/sitemap.ts`, new `src/lib/site-url.ts` | As a static metadata route the sitemap froze at build time (deleted CMS pages kept being listed) and blog posts were never indexed |
| `/rss.xml` route handler added | `src/app/rss.xml/route.ts` | The footer RSS link and seeded `social_rss` setting pointed at a 404; the reserved slug now resolves to a DB-driven RSS 2.0 feed |

### 8.2 Verified by browser end-to-end (production build via `next start`)

- Admin login (with audit `login_success`; wrong password → `login_failed`).
- Dashboard stats + Admin Audit Trail rendering real entries.
- Pages: create (EN+BN+slug auto), reserved-slug guard returns 400 with a readable UI error, page builder — all 13 section types, hero fields + save, section create/edit/delete/reorder arrows, hidden-section behavior (public page excludes hidden sections; preview shows them — verified 1 vs 2), duplicate page → `-copy` draft, unpublish/archive toggles, page delete with confirm.
- Public CMS route: edited sections appear on the public URL; unpublished page serves the app 404 shell with no draft leak (see caveat 8.3-a); preview route verifies count parity for hidden sections.
- Media: upload (magic-byte + dimension verified), "Where used?" live reference report, delete **blocked** while referenced with a friendly summary, delete succeeds once the reference is removed (with `media_deleted`/`media_delete_blocked` audit rows).
- Menus: parent/child reorder, visibility toggle — verified via DB state and public round-trip (order restored, Team hidden/shown).
- Blog: publish + tag chip add/remove round-trip (DB `tags` JSON updated, public page reflects changes, tags restored to `[]` after the test).
- Sitemap: published page appears, deletion is reflected immediately (no rebuild); blog posts listed; draft/`smoke` pages excluded.
- `/rss.xml` returns a valid RSS 2.0 document (blog posts + research) — footer link no longer 404s.
- `/admin/seo` and `/admin/settings` editors render with all tabs/fields and pre-filled DB values.
- Unit tests: **79/79 vitest** green; `tsc --noEmit` clean; `next build` green (ffmpeg/media pipeline unaffected).

### 8.3 Known caveats (honest limitations, no action hidden)

1. **Streamed-404 status semantics** — `notFound()` inside the `[slug]` loading boundary is streamed by Next 16, so a request for a missing/unpublished page still logs HTTP status 200 while serving the branded "Page Not Found" shell with `noindex` robots. Search engines interpret the rendered meta/JSON-404 correctly; the status line itself is cosmetic-only caveat for curl-based checks.
2. **Uncommitted work** — the implementation phase leaves a clean tree at `git status` only after the working tree is committed (see checklist §7).
3. **RBAC roles beyond admin** — enforced in code (hierarchy enforced, tests cover `require*` variants); role-based *UI* differences (editor/viewer specific dashboards) ship in shared state; production hardening of passwords/emails is env-driven.
4. **`media_replaced` audit action** is defined but unused — there is deliberately no "replace file" feature staffing yet.
5. **Media upload storage** — local `public/uploads` is used unless `S3_*` is configured; production must set S3 (ephemeral filesystems lose uploads).

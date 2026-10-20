# LENS Website — Production CMS Deliverables & Operational Report

**Project:** `LENS-platform / lens_website`
**Production URL:** `https://www.lensbd.org`
**Date:** October 12, 2026
**Status:** Verified & Production Ready

---

## 1. Executive Summary

A comprehensive, production-grade Content Management System (CMS) has been implemented and integrated into the LENS Next.js App Router platform without redesigning any pages, modifying branding, or compromising client-side animation systems.

Authorized administrators can now manage all non-animated website content (site branding, contact info, social links, headers, navigation menus, landing page sections, generic pages, research, blog posts, programs, careers, downloadable resources, media coverage, and SEO metadata) directly from the authenticated Admin Panel without editing code or requiring code redeployments for routine content changes.

### Key Architectural Accomplishments:
1. **Zero Redesign & Strict Animation Preservation:**
   - 100% code-controlled GSAP ScrollTrigger timelines, Three.js 3D Earth Globe (`GlobeNetwork`), HTML Canvas radar (`MediaIntelligenceMap`), Lenis smooth scrolling, and `IndexingScanner` remain untouched and performant.
   - Official LENS logos, color tokens (`#030810`, `#0891b2`, `#d4a843`), typography (Inter + Hind Siliguri), and responsive breakpoints are preserved.
2. **Native Architecture Reuse:**
   - Zero secondary databases or third-party headless CMS dependencies introduced.
   - Reused existing PostgreSQL database, Prisma 6 ORM, JWT authentication, and S3/R2 storage infrastructure.
3. **Resilient Public Fallback Guarantee:**
   - All public pages use cached server queries (`getPublicPage`, `getPublicSiteSettings`) that fail gracefully to verified bilingual defaults (`cms-defaults.ts`) if the database is unreachable. The public site never errors out due to CMS database hiccups.

---

## 2. Content Inventory Reference

Every public route and content element was audited and mapped in [`docs/CMS_AUDIT.md`](./CMS_AUDIT.md).

| Public Route | Content Managed via CMS | Animation Boundary (Code Controlled) |
|---|---|---|
| `/` (Homepage) | Hero badge, brand subtitle, headline, description, CTAs, Focus Areas (8 cards), Featured Research, Impact Counter metrics, Events & Newsletter | GSAP Kinetic typography, 3D Globe, Canvas radar, 3D card tilt, particle canvas |
| `/about` | Organization mission, pillars, governance, history | Timeline parallax, team grid entrance |
| `/research`, `/publications` | Research articles, reports, policy briefs, downloads, author credits | Filter transitions, card elevation |
| `/programs` | Fellowship curriculum, eligibility, application URLs, banner images | Card tilt, modal transitions |
| `/blog` | Articles, commentary, author attribution, cover images, tags, dates | Reading progress bar, article scroll |
| `/careers` | Job postings, requirements, departments, application links | Status badges, accordion transitions |
| `/resources` | Toolkits, datasets, policy documents, download links | Download counters, category tabs |
| `/media-coverage` | Press releases, media clips, external source links, dates | Grid transitions |
| Header & Footer | Menu hierarchies, social handles, contact email, copyright notice, legal links | Header blur backdrop, mobile sheet drawer |

---

## 3. CMS Architecture & Data Model

The existing schema in `prisma/schema.prisma` was leveraged:

- `pages`: Core page records (`slug`, `title`, `titleBn`, `status`, `sortOrder`, `metaTitle`, `metaDescription`, `canonicalUrl`).
- `page_sections`: Polymorphic section records (`type`, `title`, `titleBn`, `description`, `sortOrder`, `visible`, `settings` [JSON], `content` [JSON], `contentBn` [JSON]).
- `site_settings`: Global key-value configurations (`key`, `value`, `valueBn`, `type`, `group`, `label`, `labelBn`, `sortOrder`).
- `menu_items`: Header and footer hierarchical navigation items (`location`, `label`, `labelBn`, `url`, `sortOrder`, `visible`, `target`, `parentId`).
- `blog_posts`, `programs`, `careers`, `resources`, `media_items`: Structured collections with full editorial lifecycle management.
- `media_files`: Uploaded media files managed in Cloudflare R2 / S3 storage with CDN delivery.

### Automated Seed Verification
- Migration script `prisma/seed_cms.ts` populates all initial defaults without data duplication (`upsert` pattern).
- Ran successfully with 20 default site settings, 5 landing page sections, and 47 navigation menu entries.

---

## 4. Admin CMS Modules

All admin modules are accessible under `/admin` with role-based access control (`admin` and `editor`):

1. **Dashboard (`/admin`):**
   - Live activity metrics, total posts, published pages, and quick actions.
2. **Global Site Settings (`/admin/settings`):**
   - Manage General, Contact Information, Social Media Links, Footer Taglines, and Default SEO metadata with English and Bangla inputs.
3. **Landing Page Editor (`/admin/pages/home`):**
   - Visual editor for Hero, Focus Areas, Featured Research, Impact Counter, and Events & Newsletter.
   - Live section reordering, visibility toggling, and image selection via Media Library.
4. **Pages & Sections Manager (`/admin/pages` & `/admin/pages/[id]`):**
   - Create, edit, and publish arbitrary pages with SEO controls and slug generators.
5. **Collection Managers:**
   - **Blog Posts (`/admin/blog/[id]`):** Full article editor with cover images, Markdown content, author attribution, and publication dates.
   - **Programs (`/admin/programs/[id]`):** Fellowship and workshop manager with curriculum details and application links.
   - **Careers (`/admin/careers/[id]`):** Job opening manager with departments, employment types, and requirements.
   - **Resources (`/admin/resources/[id]`):** Toolkits, datasets, and document uploads with file attachment picker.
   - **Media Items (`/admin/media-items/[id]`):** Press releases and news coverage manager with source attribution.
6. **Media Library (`/admin/media` & `MediaPickerModal`):**
   - Visual media picker embedded across all collection editors with upload, search, and CDN URL copy.
7. **Menu & Navigation Manager (`/admin/menus`):**
   - Header navigation and footer columns editor with drag/order controls and bilingual labels.
8. **SEO Control Center (`/admin/seo`):**
   - Meta title, description, OG images, and canonical URL settings.
   - Features real-time **Google Search Snippet Preview** and **Social Media Card Preview**.

---

## 5. Security & Content Sanitization

- **Authentication & Authorization:** All write operations enforce session verification via `@/lib/auth` (`requireAuth`, `requireEditor`, `requireAdmin`). Non-administrators cannot write or delete records.
- **Server Actions & API Routes:** All mutations are executed server-side with parameterized Prisma queries (no raw SQL injection vulnerability).
- **Executable Script Protection:** User-supplied rich text is parsed as safe structured text/Markdown. Executable `<script>` tags and arbitrary JavaScript execution are strictly prohibited.
- **Media Upload Validation:** Files uploaded through the Media Manager validate mime-type (images, PDFs, documents) and size limits (max 25MB) before dispatch to object storage.
- **Secrets Isolation:** S3/R2 credentials and database connection strings exist exclusively in server environment variables and are never transmitted to client bundles.

---

## 6. Automated Testing & Verification Report

### Test Results
- **Vitest Unit & Integration Tests:** **52 / 52 passed (100%)** across 11 test suites.
  - `src/lib/__tests__/cms.test.ts` (7 tests: CMS defaults, fallback recovery, cached getters).
  - `src/lib/__tests__/site-navigation.test.ts` (9 tests: Menu trees and localized labels).
  - `src/lib/__tests__/r2.test.ts` (9 tests: Storage and CDN uploads).
  - `src/lib/__tests__/auth.test.ts` & `research-auth.test.ts` (7 tests: Session security).
  - All existing tests pass with zero regressions.
- **TypeScript Static Analysis:** `npx tsc --noEmit` **0 errors**.
- **Turbopack Production Build:** `npm run build` succeeds cleanly.

---

## 7. Environment Variables Reference

No real secrets are committed. Ensure the following environment variables are configured in production:

```ini
# Database (PostgreSQL)
DATABASE_URL="postgresql://username:password@hostname:5432/dbname?sslmode=require"

# JWT Authentication
JWT_SECRET="your-secure-random-jwt-secret-at-least-32-chars"

# Canonical Production URL
NEXT_PUBLIC_SITE_URL="https://www.lensbd.org"

# Cloudflare R2 / S3 Storage (Media Library)
R2_ACCOUNT_ID="your-cloudflare-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key-id"
R2_SECRET_ACCESS_KEY="your-r2-secret-access-key"
R2_BUCKET_NAME="lens-media"
R2_PUBLIC_URL="https://media.lensbd.org"

# Next.js Server Cache Revalidation
REVALIDATION_SECRET="your-revalidation-secret-token"
```

---

## 8. Deployment & Post-Deployment Checklist

### Pre-Deployment
- [x] Run `npx vitest run` to verify test suite.
- [x] Run `npx tsc --noEmit` to verify type safety.
- [x] Run `npm run build` to verify Next.js build.
- [ ] Ensure database backup is captured before deploying.

### Deployment Step
- [ ] Push approved code changes to repository.
- [ ] If applying to a fresh database, execute seed: `npx tsx prisma/seed_cms.ts`.

### Post-Deployment Verification
1. Log into `/admin` using administrator credentials.
2. Visit `/admin/settings` and verify site settings save correctly.
3. Visit `/admin/pages/home`, edit a test headline or badge, and click Save.
4. Open `https://www.lensbd.org/` in an incognito window; verify the update appears immediately without breaking any animations or 3D globe elements.
5. Upload a test image in `/admin/media` and verify CDN preview.
6. Check `/admin/seo` to verify search engine and social sharing previews render accurately.
7. Test language toggle (EN / BN) across homepage, header, and footer.

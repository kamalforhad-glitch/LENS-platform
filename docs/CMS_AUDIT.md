# LENS Website — Comprehensive CMS Read-Only Audit

**Date:** October 2026
**Repository:** `https://github.com/kamalforhad-glitch/LENS-platform.git`
**Production URL:** `https://www.lensbd.org`
**Stack:** Next.js 16.3.8 (App Router), React 19.2.8, TypeScript 5, Tailwind CSS 4, Prisma 6.0.0, PostgreSQL (Supabase / Local PG 5432)

---

## 1. Executive Summary

This audit evaluates the entire LENS platform codebase and database to prepare for a production-grade, secure Content Management System (CMS). The website is a multilingual (English and Bengali) research intelligence platform for media studies, press freedom, narrative analysis, and civic engagement.

### Current State
1. **Database Schema:** Prisma schema defines 34 tables including CMS models (`Page`, `PageSection`, `SiteSetting`, `MenuItem`), Content Collections (`ResearchArticle`, `Publication`, `Event`, `TeamMember`, `Program`, `BlogPost`, `MediaItem`, `Resource`, `Career`, `ResearcherProfile`), Academic Workflow (`AuthorProfile`, `ResearchVersion`, `ReviewAssignment`, `CitationRecord`), and Media (`MediaFile`, `DownloadLog`).
2. **Database Status:** PostgreSQL is active on port 5432 with all 34 tables present. Tables `pages`, `page_sections`, `site_settings`, and `menu_items` currently contain 0 records.
3. **Public Website Integration:**
   - Public listing and detail pages for Research, Publications, Blog, Programs/Courses, Media, Resources, Careers, Events, and Researchers already query PostgreSQL via `src/lib/public-content.ts`.
   - The Homepage (`src/app/page.tsx` / `src/app/HomeClient.tsx`), About page (`src/app/about`), Partnerships page (`src/app/about/partnerships`), Donate page (`src/app/donate`), Indexing pages (`src/app/indexing/*`), Privacy page (`src/app/privacy`), and Terms page (`src/app/terms`) currently rely on hardcoded text, static translation files (`locales/*/common.json`), and inline data arrays.
   - Header navigation and footer links query `menu_items` via `src/lib/site-menus.ts` but fall back to hardcoded navigation in `src/lib/site-navigation.ts` because `menu_items` has 0 rows.
4. **Existing Admin Panel:**
   - Admin routes exist under `src/app/admin` with authentication (`JWT_SECRET`, cookie-based sessions, role-based authorization: `admin`, `editor`, `viewer`).
   - Admin modules for Research, Publications, Events, Team, Authors, Backups, Analytics, and Media files have functional editors.
   - Admin modules for Blog, Programs, Careers, Resources, and Media Items are **list-only stubs**: their "New" and "Edit" links target non-existent subroutes (`/admin/blog/new`, `/admin/blog/[id]`, etc.) causing 404 errors.
   - Pages Admin (`/admin/pages`) targets `/admin/pages/[id]` which does not exist.
   - Homepage Editor (`/admin/pages/home`) has a raw JSON editor for page sections that does not update public components.
   - SEO Admin (`/admin/seo`) manages `site_settings` where `group="seo"`, but settings are unseeded and disconnected from route metadata.
   - Global Site Settings (branding, contact info, social links) lack a dedicated editor module.

---

## 2. Inventory of Public Routes & Content Elements

| Route | Content Type | Current Data Source | Hardcoded Elements | Animations / Interactive Logic (Must Preserve) |
|---|---|---|---|---|
| `/` (Homepage) | Landing Page | Static i18n + hardcoded components | Hero badge, brand subtitle, headline, description, CTAs; Focus Areas (8 cards with descriptions and details); Featured Research (featured paper + 3 latest cards); Impact stats (12+, 500+, 50k+, 25+); Events & Newsletter (3 events + copy) | 3D `GlobeNetwork` (Three.js/R3F), `MediaIntelligenceMap` (Canvas/rAF), `IndexingScanner` (radar scan loop), GSAP ScrollTrigger kinetic typography & card flips, Lenis smooth scroll |
| `/about` | Static Informational | `AboutContent.tsx` hardcoded | Hero copy, Mission statement (2 paragraphs), Journey/Timeline (4 milestones), Values (4 cards), Team blurb | GSAP stagger animations, orb parallax |
| `/about/partnerships` (and `/partnerships`) | Partner Directory | Hardcoded array in page | 6 partner organizations (name, type, description), 5 partnership type counts, contact CTA | Standard responsive grid |
| `/research` | Collection Listing | DB (`getPublicResearch()`) | Filter labels, search placeholder, hero title/description | Dynamic search & filter pills |
| `/research/[slug]` | Collection Detail | DB (`getPublicResearchArticle()`) | Breadcrumbs labels, citation buttons, fallback copy | PDF viewer modal, citation modal, BibTeX generator |
| `/publications` | Collection Listing | DB (`getPublicPublications()`) | Hero title/description | Type filter tabs, download counter |
| `/publications/[slug]` | Collection Detail | DB (`getPublicPublication()`) | Breadcrumbs, metadata labels | PDF download tracking |
| `/courses` (and `/programs`) | Collection Listing | DB (`getPublicPrograms()`) | Hero title/description | Category filter |
| `/programs/[slug]` | Collection Detail | DB (`getPublicProgram()`) | Breadcrumbs, fallback copy | Interactive content viewer |
| `/courses/[subject]` | Filtered Listing | DB (`getPublicPrograms()`) | Subject metadata (`course-subjects.ts`) | Filtered card grid |
| `/blog` | Collection Listing | DB (`getPublicBlogPosts()`) | Hero title/description | Category filter |
| `/blog/[slug]` | Collection Detail | DB (`getPublicBlogPost()`) | Breadcrumbs, author card | Rich text viewer |
| `/media` | Collection Listing | DB (`getPublicMediaItems()`) | Hero title/description | Press/Interview tabs |
| `/media/[slug]` | Collection Detail | DB (`getPublicMediaItem()`) | Breadcrumbs, source link | Source attribution banner |
| `/events` | Collection Listing | DB (`getPublicEvents()`) | Hero title/description | Upcoming/Past tabs |
| `/events/[slug]` | Collection Detail | DB (`getPublicEvent()`) | Breadcrumbs, registration button | Map link, calendar action |
| `/resources` | Collection Listing | DB (`getPublicResources()`) | Hero title/description | Category tabs |
| `/resources/[slug]` | Collection Detail | DB (`getPublicResource()`) | Breadcrumbs, download/external button | Download tracking |
| `/resources/election` | Category Listing | DB (`getPublicResources()`) | Category header & fallback | Taxonomy filter |
| `/resources/media` | Category Listing | DB (`getPublicResources()`) | Category header & fallback | Taxonomy filter |
| `/resources/other` | Category Listing | DB (`getPublicResources()`) | Category header & fallback | Taxonomy filter |
| `/resources/publications` | Category Listing | DB (`getPublicResources()`) | Category header & fallback | Taxonomy filter |
| `/careers` | Collection Listing | DB (`getPublicCareerOpenings()`) | Hero title/description | Department filter |
| `/careers/[slug]` | Collection Detail | DB (`getPublicCareer()`) | Requirements header, apply link | Application URL redirect |
| `/contact` | Form & Info Page | `ContactContent.tsx` hardcoded | Contact emails (`info@lensbd.org`, `media@lensbd.org`), address (`Dhaka, Bangladesh`), hero copy | Client validation, CSRF/spam protection, Resend API integration |
| `/donate` | Informational Notice | `donate/page.tsx` hardcoded | 3 work area cards, transparency commitment, coming soon notice | Responsive notice cards |
| `/impact` | Analytics & Charts | `ImpactContent.tsx` + `/api/analytics` | Hero copy, methodology notes | Recharts visualizations, dynamic counter |
| `/clubs` | Hub Page | `lib/clubs.ts` static | 5 club cards (names only) | Navigation links |
| `/clubs/[slug]` | Placeholder Page | `clubs/[slug]/page.tsx` hardcoded | Placeholder message, back link | Empty state |
| `/indexing` | Hub Page | `indexing/page.tsx` + DB | 3 practice area cards, hero copy | Dynamic research feed |
| `/indexing/bpfi` | Index Detail | `indexing/bpfi/page.tsx` hardcoded | Methodology & concept copy | Editorial placeholder |
| `/indexing/press-freedom-index`| Index Detail | `press-freedom-index/page.tsx` hardcoded | 3 advocacy areas, mission text | Editorial placeholder |
| `/library` | Search Archive | `LibraryContent.tsx` + API | Filter labels, empty messages | Full-text search, pgvector semantic search |
| `/researchers` | Directory | `ResearchersContent.tsx` + API | Hero title/description | Client search & filter |
| `/researchers/[slug]` | Detail | `api/researchers` | Profile layout, citation metrics | Citation & download statistics |
| `/theme` | Hub Page | `theme/page.tsx` hardcoded | 3 theme cards (Research, Literature, Library) | Navigation cards |
| `/theme/research` | Thematic Hub | `theme/research/page.tsx` + DB | Overview copy | Research card feed |
| `/theme/literature` | Thematic Hub | `theme/literature/page.tsx` + DB | Reading list intro | Filtered resource feed |
| `/privacy` | Legal Page | `privacy/page.tsx` hardcoded | 7 policy sections, contact emails | Pure typography |
| `/terms` | Legal Page | `terms/page.tsx` hardcoded | 7 terms sections, contact emails | Pure typography |

---

## 3. Site Chrome (Header, Navigation & Footer) Audit

### 3.1 Header (`SiteHeader.tsx`, `SiteHeaderClient.tsx`)
- **Logo:** Image (`/images/logo/lens-logo.png`), priority loading, links to `/`. Must remain working.
- **Site Subtitle:** "Lighthouse for Evolving Narrative Systems" (EN) / "লাইটহাউস ফর ইভলভিং ন্যারেটিভ সিস্টেমস" (BN).
- **Navigation Items:** Dropdown menus (Theme, Courses, Indexing, Clubs, About) and standalone links. Currently fetched via `getHeaderNavigation()` in `src/lib/site-menus.ts` which falls back to `src/lib/site-navigation.ts` when `menu_items` is empty.
- **Call-to-Action:** "Donate" button currently pointing to `/contact` (or `/donate`).
- **Language Switcher:** EN / BN switcher toggling i18next language client-side.
- **Mobile Menu:** Full-screen sheet with expandable accordion sections.

### 3.2 Footer (`SiteFooter.tsx`, `SiteFooterClient.tsx`)
- **Logo & Brand Description:** LENS logo and organization description.
- **Columns (4):** Focus Areas / Theme, Knowledge / Resources, About / Organization, Discover.
- **Social Media Links:** Facebook, Twitter/X, LinkedIn, YouTube, RSS feed.
- **Legal & Utility Links:** Privacy Policy, Terms & Conditions, Admin Login (`/admin`).
- **Copyright:** "© 2026 LENS — Lighthouse for Evolving Narrative Systems. All rights reserved."

---

## 4. Admin Panel & CMS Module Audit

| Module | Route | Status | Missing Functionality |
|---|---|---|---|
| **Dashboard** | `/admin` | Functional | Stats reflect DB collections; needs CMS pages count and site settings shortcut |
| **Site Settings** | *None* | **Missing** | No dedicated UI for editing global site settings (branding, logo, contact, footer, socials) |
| **Header & Nav** | `/admin/menus` | Partially Functional | UI exists for creating/editing menu items, but lacks nested dropdown hierarchy builder and live preview |
| **Landing Page** | `/admin/pages/home` | Stub / Broken | Raw JSON editor only; no visual structure; doesn't propagate to homepage components |
| **Pages & Sections**| `/admin/pages` | Partially Functional | Lists pages, but `/admin/pages/new` and `/admin/pages/[id]` throw 404s! |
| **Media Library** | `/admin/media` | Functional | Uploads work; missing alt text editor, image dimensions, and picker dialog for embedding in content forms |
| **Blog Manager** | `/admin/blog` | Incomplete | List page works, but `/admin/blog/new` and `/admin/blog/[id]` throw 404s! |
| **Programs Manager**| `/admin/programs` | Incomplete | List page works, but `/admin/programs/new` and `/admin/programs/[id]` throw 404s! |
| **Media Items** | `/admin/media-items` | Incomplete | List page works, but `/admin/media-items/new` and `/admin/media-items/[id]` throw 404s! |
| **Resources** | `/admin/resources` | Incomplete | List page works, but `/admin/resources/new` and `/admin/resources/[id]` throw 404s! |
| **Careers** | `/admin/careers` | Incomplete | List page works, but `/admin/careers/new` and `/admin/careers/[id]` throw 404s! |
| **Research** | `/admin/research` | Functional | Comprehensive editor with versions, citations, and reviews |
| **Publications** | `/admin/publications` | Functional | Functional editor at `[id]/page.tsx` |
| **Events** | `/admin/events` | Functional | Functional editor at `[id]/page.tsx` |
| **Team Members** | `/admin/team` | Functional | Functional editor at `[id]/page.tsx` |
| **SEO Manager** | `/admin/seo` | Incomplete | Key/value editor for `group="seo"`, unseeded, lacks page-by-page metadata manager and social preview |
| **Drafts & Publishing** | Distributed | Incomplete | Publication toggle exists in some editors, but lacks unpublish safeguards, preview modal integration, and revision diffing |

---

## 5. Security & Reliability Audit

1. **Authentication & Authorization:**
   - Server Actions and API routes enforce `getCurrentUser()` with role checks (`admin`, `editor`, `viewer`).
   - Mutations strictly require `editor` or `admin` role.
   - Unauthorized attempts return 401 or 403.
2. **Input Validation:**
   - Zod schemas exist in `src/lib/validation.ts` for authentication and contact forms.
   - CMS update payloads require thorough validation for XSS prevention, URL safety, and JSON integrity.
3. **Media Upload Security:**
   - Allowed MIME types: images (`image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/avif`) and documents (`application/pdf`, `.doc`, `.docx`). SVG is intentionally blocked to prevent XSS.
   - Max file size: 10 MB for images, 50 MB for documents.
4. **Data Protection:**
   - Database operations use Prisma ORM parameterized queries, preventing SQL injection.
   - No secrets or credentials are sent to browser clients.

---

## 6. Audit Conclusions & Readiness

1. **Architecture Recommendation:** The existing architecture (Next.js App Router + Prisma + PostgreSQL + Cloudflare R2 / S3 storage) is 100% capable of supporting the full CMS requirements without introducing a second database or external headless CMS provider.
2. **Database Status:** Schema is complete and all tables exist in PostgreSQL. No destructive schema migrations are required.
3. **Primary Action Items:**
   - Seed default Site Settings, Menu Items, and Page Sections so the database mirrors existing production content.
   - Complete missing admin editor modules (`[id]/page.tsx`) for Pages, Blog, Programs, Careers, Resources, and Media Items.
   - Build a comprehensive Global Site Settings editor and Landing Page Section editor with intuitive form controls.
   - Wire public pages and components to consume CMS data with robust static fallbacks.
   - Provide integrated image selection from the Media Library into all content forms.

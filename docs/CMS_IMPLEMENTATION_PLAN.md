# LENS Website — Full CMS Implementation Plan

**Date:** October 2026
**Target:** Production-ready CMS integration preserving all branding, design, animations, and performance.

---

## 1. Architecture Overview

### 1.1 Guiding Principles
- **Zero Redesign:** Pixel-perfect preservation of existing Tailwind styling, colors (Deep Navy `#030810`, Teal `#0891b2`, Gold `#d4a843`), typography (Inter + Hind Siliguri), and responsive layout.
- **Code-Controlled Animations:** GSAP timelines, Three.js 3D canvas (`GlobeNetwork`), Canvas rendering (`MediaIntelligenceMap`), Lenis smooth scrolling, and interactive scanning tools (`IndexingScanner`) remain 100% in code. Only their labels, copy, and data feeds become CMS-driven.
- **Architecture Reuse:** Utilize the existing Prisma schema, PostgreSQL database, JWT authentication, and S3/R2 storage integration. No secondary database or external CMS provider is needed.
- **Fail-Safe Fallbacks:** Every public component must render gracefully using verified fallback content if the database is unreachable or records are unpopulated.

---

## 2. Content Modeling & Data Seeding

### 2.1 Global Site Settings (`site_settings`)
Manage non-content website parameters grouped logically:
- `group="general"`: Site Name, Tagline, Subtitle, Announcement Bar (text, link, active state), Default Language.
- `group="contact"`: Email, Support Email, Media Queries Email, Phone, Office Address, Map URL.
- `group="social"`: Facebook URL, X/Twitter URL, LinkedIn URL, YouTube URL, GitHub URL.
- `group="footer"`: Copyright Notice, Footer Description, Mission Statement blurb.
- `group="seo"`: Default Meta Title, Meta Description, Keywords, Default OG Image URL.

### 2.2 Navigation Menu Items (`menu_items`)
- Header navigation items (Label EN/BN, URL, sort order, visibility, dropdown parent ID).
- Footer link columns (Label EN/BN, URL, column index, sort order, visibility).

### 2.3 Landing Page Sections (`pages` slug="home", `page_sections`)
Structured section records on `pages` where `slug="home"`:
1. `hero`: Badge, Title/Headline words, Subtitle/Brand statement, Description, CTA primary label/link, CTA secondary label/link, vertical tagline lines.
2. `focus`: Section label, Section title, Section description, About link text/url, and 8 Focus Area Cards (Key, Title, Description, Detail, Icon name, Accent color).
3. `featured_research`: Section label, Title, Featured article override (or auto-fetch latest), 3 publication highlight card overrides.
4. `impact`: Section label, Title, Description, 4 metric cards (Value, Suffix, Label EN/BN).
5. `events_newsletter`: Section label, Title, Event highlight cards (or auto-fetch upcoming), Newsletter heading, description, button label, privacy text.
6. `indexing_scanner`: Scanner kicker, lead description, live status text, action button label/link.

### 2.4 Page Content (`pages` & `page_sections`)
- `/about`: Mission statement, 4 Value cards, 4 Milestone timeline items.
- `/about/partnerships`: Partner directory cards, partnership category counts.
- `/donate`: Informational work area cards, transparency statement, coming soon notice.
- `/privacy` and `/terms`: Structured policy sections with revision dates.

### 2.5 Repeating Content Collections
Existing Prisma models with complete CRUD interfaces:
- `BlogPost`: Blog posts and articles.
- `Program`: Training courses and academy programs.
- `Career`: Job openings with requirements and application links.
- `Resource`: Tools, datasets, guides, and curriculum materials.
- `MediaItem`: Press releases, interviews, and public statements.
- `ResearchArticle`: Academic papers, DOIs, abstracts, versions.
- `Publication`: Policy briefs, reports, and working papers.
- `Event`: Summits, workshops, and webinars.
- `TeamMember`: Core leadership and researchers.

---

## 3. Implementation Phases

```
┌────────────────────────────────────────────────────────┐
│ Phase 1: Read-Only Audit & Inventory                   │  ✓ COMPLETED
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ Phase 2: CMS Architecture & Seed Foundations          │  Target: Step 2.1 - 2.3
│ - Seeder for default site_settings, menu_items,       │
│   and home page_sections mirroring current copy.       │
│ - Safe Server Actions for CMS read/write operations.   │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ Phase 3: Admin CMS Interface Expansion                 │  Target: Step 3.1 - 3.7
│ - Add missing editor routes: [id]/page.tsx for        │
│   pages, blog, programs, careers, resources, media.   │
│ - Dedicated Global Site Settings manager.              │
│ - Structured Landing Page Section editor.             │
│ - Enhanced Menu & Navigation Manager.                 │
│ - Media Picker modal for content forms.                │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ Phase 4: Public Site Connection                        │  Target: Step 4.1 - 4.5
│ - Connect Homepage sections (Hero, Focus, Featured,   │
│   Impact, Events/Newsletter) to CMS with fallbacks.   │
│ - Connect About & Partnerships to CMS.                 │
│ - Connect SiteHeader and SiteFooter to DB menu_items. │
│ - Connect dynamic SEO metadata across routes.          │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ Phase 5: Drafts, Previews, Publishing & Revisions      │  Target: Step 5.1 - 5.3
│ - Live preview modal across all content models.        │
│ - Publish/Unpublish toggle with safety confirmation.   │
│ - Version history for pages and articles.              │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ Phase 6: Security, Verification & Quality Assurance   │  Target: Step 6.1 - 6.5
│ - Role enforcement (admin vs editor vs viewer).        │
│ - Payload sanitization and XSS prevention.             │
│ - Vitest tests for all CMS actions and routes.         │
│ - TypeScript typecheck & production build.             │
└────────────────────────────────────────────────────────┘
```

---

## 4. Detailed Step-by-Step Execution Plan

### Step 2: Content Seeding & Server Actions
1. **Seed Script (`prisma/seed_cms.ts`):** Populate `site_settings`, `menu_items`, `pages`, and `page_sections` with verified production data matching current English and Bengali translations and layouts.
2. **CMS Server Actions (`src/lib/actions/cms.ts`):**
   - Extend `getSiteSettings()`, `updateSiteSettingsGroup()`.
   - Extend `getPageWithSections()`, `updatePageSection()`, `reorderSections()`.
   - Extend `getMenuItems()`, `saveMenuItem()`, `reorderMenuItems()`.
   - Implement `savePageRevision()`, `getPageRevisions()`, `restorePageRevision()`.

### Step 3: Admin CMS Interface
1. **Global Site Settings (`src/app/admin/settings/page.tsx`):**
   - Tabbed interface: General, Contact, Social, Footer, SEO.
   - Structured forms with save indicators, validation, and bilingual inputs.
2. **Landing Page Editor (`src/app/admin/pages/home/page.tsx`):**
   - Replace raw JSON textarea with dedicated accordion forms for Hero, Focus Areas, Featured Research, Impact Numbers, and Events/Newsletter.
   - Support reordering and toggle visibility.
3. **Pages & Sections Manager (`src/app/admin/pages/[id]/page.tsx`):**
   - Create generic page editor supporting title, slug, status, template, SEO metadata, and dynamic sections.
   - Add new page creator at `/admin/pages/new`.
4. **Content Collection Editors:**
   - Implement `/admin/blog/[id]/page.tsx` (and `new`).
   - Implement `/admin/programs/[id]/page.tsx` (and `new`).
   - Implement `/admin/careers/[id]/page.tsx` (and `new`).
   - Implement `/admin/resources/[id]/page.tsx` (and `new`).
   - Implement `/admin/media-items/[id]/page.tsx` (and `new`).
5. **Media Picker Modal (`src/components/admin/MediaPickerModal.tsx`):**
   - Reusable dialog enabling admins to browse existing uploaded media or upload new files directly into image input fields.
6. **Navigation Manager Improvements (`src/app/admin/menus/page.tsx`):**
   - Add nested parent/child dropdown hierarchy support and visual order reordering.
7. **SEO Manager (`src/app/admin/seo/page.tsx`):**
   - Integrate page-by-page SEO title, description, keywords, and Open Graph social preview card.

### Step 4: Public Site Connection
1. **Public Site Settings Provider/Helper (`src/lib/site-settings.ts`):**
   - Server-side cached query with automatic in-memory fallback.
2. **Homepage Integration:**
   - Update `Hero.tsx` to read CMS hero copy with i18n fallback.
   - Update `FocusAreas.tsx` to read CMS focus cards with fallback.
   - Update `FeaturedResearch.tsx` to display published research or CMS overrides.
   - Update `ImpactStats.tsx` to display CMS statistics with fallback.
   - Update `EventsNewsletter.tsx` to display CMS event highlights and newsletter copy.
3. **About & Partnerships Integration:**
   - Update `AboutContent.tsx` to consume CMS mission, values, and journey milestones.
   - Update `about/partnerships/page.tsx` to consume CMS partner list.
4. **Header & Footer Live Connection:**
   - Verify `SiteHeader` and `SiteFooter` seamlessly render database menu items.
5. **SEO & Metadata:**
   - Connect `src/app/layout.tsx` and child route `generateMetadata` functions to read page SEO metadata from the database.

### Step 5: Drafts, Preview & Publishing
1. Extend `PreviewModal.tsx` across all content editors.
2. Provide explicit status badges (`draft`, `published`, `archived`) and publishing action buttons.
3. Add unpublish confirmation and draft preview URL routing.

### Step 6: Security, Verification & Testing
1. Add automated unit and integration tests (`src/lib/__tests__/cms.test.ts`).
2. Run `npm test`, `npx tsc --noEmit`, and `npm run build`.
3. Verify zero regressions in animations, responsive behavior, or existing public functionality.

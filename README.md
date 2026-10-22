# LENS — Lighthouse for Evolving Narrative Systems
## Full-Stack Bilingual Content Management System (CMS)

A production-grade, database-driven Content Management System (CMS) custom-engineered for **LENS (Lighthouse for Evolving Narrative Systems)**. The platform features an authorized admin dashboard, dynamic visual page builder, full bilingual localization (English and বাংলা), dynamic navigation and footer management, media library with Cloudflare R2/S3 integration, and granular publishing workflows.

---

## 1. Tech Stack & Architecture

- **Frontend & App Framework**: Next.js 16 (App Router & Turbopack), React 19, TypeScript 5
- **Styling & Design System**: Tailwind CSS 4, Lucide Icons, responsive light/dark theme tokens preserving LENS visual identity (navy backgrounds, cyan accents, gold badges)
- **Database & ORM**: PostgreSQL via Prisma ORM 6 with connection pooling (`DIRECT_URL` and `DATABASE_URL`)
- **Authentication & Authorization**: Server Actions + HTTP-only JWT sessions, bcrypt password hashing, sliding-window rate limiting, and role-based access control (Super Admin, Admin, Editor, Translator)
- **Storage Layer**: Cloudflare R2 / AWS S3 object storage abstraction with fallback to local uploads for development, magic byte MIME inspection, and relational reference-tracked delete guards
- **Localization**: English (`en`) and Bengali (`bn`) bilingual models across all content entities, `Accept-Language` detection, client-side persistence, and fallback resolution
- **Testing & Verification**: Vitest unit test suite (170 tests across 20 suites) and Playwright E2E browser automation

---

## 2. Getting Started & Setup

### Prerequisites

- **Node.js**: v20 or v22 LTS (v20+ recommended)
- **PostgreSQL**: v15+ database instance (local or hosted e.g. Supabase, Neon, AWS RDS)
- **Package Manager**: npm (v10+)

### Installation

1. Clone the repository and navigate into the workspace:
   ```bash
   git clone <repository-url>
   cd lens_website
   ```

2. Install dependencies (Prisma client will auto-generate via `postinstall`):
   ```bash
   npm install
   ```

3. Configure your local environment:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` to configure your database connection string and authentication secrets.

4. Push database schema or apply migrations:
   ```bash
   npm run db:push
   # or for migrations:
   npm run db:migrate
   ```

5. Seed default admin credentials and content defaults:
   ```bash
   npm run db:seed
   ```

6. Start the local development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) for the public website or [http://localhost:3000/admin](http://localhost:3000/admin) for the secure CMS dashboard.

---

## 3. Environment Variables

Create a `.env` file in the project root with the following configuration:

```env
# Database Connections
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/lens?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/lens?schema=public"

# Authentication & Security
JWT_SECRET="generate-a-secure-random-string-at-least-32-chars-long"
ADMIN_SEED_PASSWORD="strong-password-for-default-admin-bootstrap"
NODE_ENV="development"

# Cloudflare R2 / S3 Object Storage (Optional in dev, required in production)
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET="lens-media"
R2_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
R2_PUBLIC_URL="https://media.lensbd.org"
MAX_VIDEO_SIZE_MB="100"

# Sentry Monitoring (Optional)
NEXT_PUBLIC_SENTRY_DSN=""
SENTRY_AUTH_TOKEN=""
```

---

## 4. Admin Bootstrap & Credentials

The seed script (`prisma/seed.ts`) bootstraps the initial super administrator safely and idempotently:

- **Email**: `admin@lens.org.bd`
- **Password**: Defined by `ADMIN_SEED_PASSWORD` in `.env` (default local development fallback: `testpassword123`)
- **Role**: `super_admin`

To trigger admin bootstrap manually:
```bash
npm run db:seed
```

> **Security Note**: In production (`NODE_ENV=production`), `ADMIN_SEED_PASSWORD` is strictly required. The script never overwrites an existing user record.

---

## 5. CMS Features & Capabilities

### 5.1 Website Navigation Management (`/admin/menus`)
- Add, edit, delete, rename, reorder navigation items across header and footer.
- Unlimited nested dropdowns and submenus.
- Configurable "Coming Soon" badges in English and Bengali.
- Target settings (`_self`, `_blank`), external/internal routing, and desktop/mobile visibility flags.
- Instant live updates across public pages without frontend redeployment.

### 5.2 Dynamic Visual Page Builder (`/admin/pages`, `/admin/pages/home`, `/admin/pages/new`)
- Reusable modular section system supporting 22+ section types:
  - Hero / Large Banner (with background video, poster, overlay opacity, layout variants)
  - Rich Text & Formatted Content
  - Image + Text (left/right split)
  - Image Galleries & Video Embeds
  - Interactive Tabs & Nested Multi-Level Sub-Tabs (`/admin/tabs`)
  - Statistics & Impact Metrics
  - Reusable Collection Listings (Research, Publications, Events, Blog, Media, Resources, Programs, Careers, Researchers)
  - Clubs Listing & Team Member Grids
  - Contact Forms & Newsletter Subscriptions
  - Custom Embeds & FAQs
- Drag-and-drop section reordering, duplicate, edit, hide, and delete.
- Revision history (`/admin/revisions`) with full page and section JSON snapshots and instant restore.
- Responsive live preview and draft/publish controls (`/admin/publishing`).

### 5.3 Complete Bilingual System (English + বাংলা)
- Native bilingual columns across all database models (`title` / `titleBn`, `content` / `contentBn`, `description` / `descriptionBn`).
- Global language switcher with cookie and localStorage persistence.
- Intelligent fallback to English when a Bengali translation is pending.
- Dedicated translation management module (`/admin/translations`).

### 5.4 Content Modules
- **Clubs**: Tuesday Club, Language Club, Data Journalism Club, Photography Club, Multimedia & New Media Club with dynamic detail pages (`/clubs/[slug]`).
- **Events**: Statuses (Upcoming, Ongoing, Completed), banners, registration deadlines, and detail routes (`/events/[slug]`).
- **Research & Publications**: DOI integration, citations, downloadable PDFs, authors, and abstract tabs.
- **Blog & Press**: Categories, tags, author association, reading time, and related posts.
- **Theme & Courses**: Curriculum outlines, delivery mode, modules, and enrollment links.
- **Global Settings & Footer (`/admin/settings`)**: Site name, logos, favicon, contact details, social profiles, copyright notice, announcement bar, and global SEO metadata.

### 5.5 Media Library (`/admin/media`)
- Drag-and-drop file uploads for images (JPEG, PNG, WebP, AVIF, GIF), documents (PDF, DOCX), and video (MP4, WebM).
- Strict magic byte signature verification to block disguised files and SVG script-execution vectors.
- Reference-tracking safeguard: prevents accidental deletion of files actively in use across pages or sections.
- Cloudflare R2 / AWS S3 cloud storage with presigned URLs.

---

## 6. Development & Quality Assurance

Run unit tests:
```bash
npm run test
```

Run TypeScript compilation check:
```bash
npx tsc --noEmit
```

Run ESLint verification:
```bash
npm run lint
```

Execute production build:
```bash
npm run build
```

Run Playwright browser E2E workflows:
```bash
npx playwright test
```

---

## 7. Production Deployment

### Vercel / Cloud Container Deployment

1. Set all environment variables in your deployment dashboard:
   - `DATABASE_URL` (connection pooler / PgBouncer)
   - `DIRECT_URL` (direct port 5432 for migrations)
   - `JWT_SECRET`
   - `ADMIN_SEED_PASSWORD`
   - `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT`, `R2_PUBLIC_URL`

2. Run production migrations before deployment:
   ```bash
   npm run db:migrate:prod
   ```

3. Build and launch:
   ```bash
   npm run build
   npm run start
   ```

---

## 8. License & Attribution

Designed and maintained for **LENS — Lighthouse for Evolving Narrative Systems**. All rights reserved.

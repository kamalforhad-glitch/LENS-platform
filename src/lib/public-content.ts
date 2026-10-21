// Public (unauthenticated) content queries for the CMS → website surface.
//
// Every function here enforces the same visibility rules so the rules live in
// one place instead of being re-implemented per page:
//   * only `status: "published"` records (careers: open/closed, never draft)
//   * explicit field selection so drafts, reviewer/submitter data, e-mail
//     addresses and other internal columns never reach a public page
//
// Listing queries are wrapped so a database failure renders an empty/error
// state instead of crashing the page, and `items`/`error` lets pages tell
// "nothing published yet" apart from "could not load".

import { db } from "@/lib/db";

export type PublicList<T> = { items: T[]; error: boolean };

async function query<T>(run: () => Promise<T[]>): Promise<PublicList<T>> {
  try {
    return { items: await run(), error: false };
  } catch {
    return { items: [], error: true };
  }
}

/**
 * Careers publish as draft | open | closed:
 *  * the "openings" listing only advertises positions that are open
 *  * a detail page stays reachable for open *and* closed roles (so links that
 *    were already shared keep working) but never for drafts
 */
const PUBLIC_CAREER_STATUS = { not: "draft" } as const;

// ============================================================
// Card shapes (plain serialisable data for server and client views)
// ============================================================

export interface BlogCard {
  slug: string;
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  author: string;
  category: string;
  datePublished: Date | null;
}

export interface ProgramCard {
  slug: string;
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  category: string;
}

export interface MediaCard {
  slug: string;
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  type: string;
  source: string;
  datePublished: Date | null;
}

export interface ResourceCard {
  slug: string;
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  category: string;
}

export interface CareerCard {
  slug: string;
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  department: string;
  location: string;
  type: string;
  status: string;
}

export interface EventCard {
  slug: string;
  name: string;
  nameBn: string;
  description: string;
  descriptionBn: string;
  location: string;
  time: string;
  category: string;
  startDate: Date;
  dateLabel: string;
}

export interface ResearchCard {
  slug: string;
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  category: string;
  datePublished: Date | null;
  dateLabel: string;
}

export interface PublicationCard {
  slug: string;
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  type: string;
  datePublished: Date | null;
  dateLabel: string;
}

export interface TeamCard {
  slug: string;
  name: string;
  nameBn: string;
  role: string;
  roleBn: string;
  department: string;
  bio: string;
  bioBn: string;
  image: string | null;
}

export interface ResearcherCard {
  slug: string;
  name: string;
  nameBn: string;
  affiliation: string;
  affiliationBn: string;
  position: string;
  positionBn: string;
  bio: string;
  bioBn: string;
  image: string | null;
  orcid: string | null;
  researchAreas: string;
  researchAreasBn: string;
  expertise: string;
  expertiseBn: string;
  totalDownloads: number;
  totalCitations: number;
  featured: boolean;
}

// ============================================================
// Date helpers (public pages render stable, locale-fixed labels)
// ============================================================

export function formatMonthYear(date: Date | null | undefined): string {
  if (!date) return "";
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function formatMonthLabel(date: Date | null | undefined): string {
  if (!date) return "";
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function formatFullDate(date: Date | null | undefined): string {
  if (!date) return "";
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

// ============================================================
// Listings
// ============================================================

export function getPublicBlogPosts(): Promise<PublicList<BlogCard>> {
  return query(() =>
    db.blogPost.findMany({
      where: { status: "published" },
      orderBy: { datePublished: "desc" },
      take: 60,
      select: {
        slug: true,
        title: true,
        titleBn: true,
        description: true,
        descriptionBn: true,
        author: true,
        category: true,
        datePublished: true,
      },
    })
  );
}

export function getPublicPrograms(): Promise<PublicList<ProgramCard>> {
  return query(() =>
    db.program.findMany({
      where: { status: "published" },
      orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
      take: 60,
      select: { slug: true, title: true, titleBn: true, description: true, descriptionBn: true, category: true },
    })
  );
}

export function getPublicMediaItems(): Promise<PublicList<MediaCard>> {
  return query(() =>
    db.mediaItem.findMany({
      where: { status: "published" },
      orderBy: { datePublished: "desc" },
      take: 60,
      select: {
        slug: true,
        title: true,
        titleBn: true,
        description: true,
        descriptionBn: true,
        type: true,
        source: true,
        datePublished: true,
      },
    })
  );
}

export function getPublicResources(): Promise<PublicList<ResourceCard>> {
  return query(() =>
    db.resource.findMany({
      where: { status: "published" },
      orderBy: [{ category: "asc" }, { dateModified: "desc" }],
      take: 120,
      select: { slug: true, title: true, titleBn: true, description: true, descriptionBn: true, category: true },
    })
  );
}

export function getPublicCareerOpenings(): Promise<PublicList<CareerCard>> {
  return query(() =>
    db.career.findMany({
      where: { status: "open" },
      orderBy: { dateModified: "desc" },
      take: 60,
      select: {
        slug: true,
        title: true,
        titleBn: true,
        description: true,
        descriptionBn: true,
        department: true,
        location: true,
        type: true,
        status: true,
      },
    })
  );
}

export async function getPublicEvents(): Promise<PublicList<EventCard>> {
  const result = await query(() =>
    db.event.findMany({
      where: { status: "published" },
      orderBy: { startDate: "asc" },
      take: 60,
      select: {
        slug: true,
        name: true,
        nameBn: true,
        description: true,
        descriptionBn: true,
        location: true,
        time: true,
        category: true,
        startDate: true,
      },
    })
  );
  return {
    ...result,
    items: result.items.map((event) => ({ ...event, dateLabel: formatFullDate(event.startDate) })),
  };
}

export async function getPublicResearch(): Promise<PublicList<ResearchCard>> {
  const result = await query(() =>
    db.researchArticle.findMany({
      where: { status: "published" },
      orderBy: { datePublished: "desc" },
      take: 60,
      select: {
        slug: true,
        title: true,
        titleBn: true,
        description: true,
        descriptionBn: true,
        category: true,
        datePublished: true,
      },
    })
  );
  return {
    ...result,
    items: result.items.map((item) => ({ ...item, dateLabel: formatMonthYear(item.datePublished) })),
  };
}

export async function getPublicPublications(): Promise<PublicList<PublicationCard>> {
  const result = await query(() =>
    db.publication.findMany({
      where: { status: "published" },
      orderBy: { datePublished: "desc" },
      take: 60,
      select: { slug: true, title: true, titleBn: true, description: true, descriptionBn: true, type: true, datePublished: true },
    })
  );
  return {
    ...result,
    items: result.items.map((item) => ({ ...item, dateLabel: formatMonthYear(item.datePublished) })),
  };
}

// ============================================================
// Detail records (published only — drafts must stay unreachable by URL)
// ============================================================

export function getPublicResearchArticle(slug: string) {
  return db.researchArticle.findFirst({
    where: { slug, status: "published" },
    select: {
      slug: true,
      title: true,
      titleBn: true,
      description: true,
      descriptionBn: true,
      content: true,
      contentBn: true,
      abstract: true,
      abstractBn: true,
      methodology: true,
      methodologyBn: true,
      category: true,
      author: true,
      tags: true,
      image: true,
      pdfUrl: true,
      doi: true,
      datePublished: true,
    },
  });
}

export async function getPublicTeamMembers(): Promise<PublicList<TeamCard>> {
  return query(() =>
    db.teamMember.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        slug: true,
        name: true,
        nameBn: true,
        role: true,
        roleBn: true,
        department: true,
        bio: true,
        bioBn: true,
        image: true,
      },
    })
  );
}

export async function getPublicResearchers(): Promise<PublicList<ResearcherCard>> {
  return query(() =>
    db.researcherProfile.findMany({
      where: { status: "active" },
      orderBy: [{ featured: "desc" }, { totalDownloads: "desc" }],
      select: {
        slug: true,
        name: true,
        nameBn: true,
        affiliation: true,
        affiliationBn: true,
        position: true,
        positionBn: true,
        bio: true,
        bioBn: true,
        image: true,
        orcid: true,
        researchAreas: true,
        researchAreasBn: true,
        expertise: true,
        expertiseBn: true,
        totalDownloads: true,
        totalCitations: true,
        featured: true,
      },
    })
  );
}

export function getPublicResearcher(slug: string) {
  return db.researcherProfile.findFirst({
    where: { slug, status: "active" },
    include: {
      articleLinks: {
        where: { article: { status: "published" } },
        orderBy: { authorOrder: "asc" },
        include: {
          article: {
            select: {
              id: true,
              slug: true,
              title: true,
              category: true,
              downloads: true,
              datePublished: true,
            },
          },
        },
      },
    },
  });
}

export function getPublicBlogPost(slug: string) {
  return db.blogPost.findFirst({
    where: { slug, status: "published" },
    select: {
      slug: true,
      title: true,
      titleBn: true,
      description: true,
      descriptionBn: true,
      content: true,
      contentBn: true,
      author: true,
      category: true,
      tags: true,
      image: true,
      metaTitle: true,
      metaDescription: true,
      datePublished: true,
    },
  });
}

export function getPublicProgram(slug: string) {
  return db.program.findFirst({
    where: { slug, status: "published" },
    select: {
      slug: true,
      title: true,
      titleBn: true,
      description: true,
      descriptionBn: true,
      content: true,
      contentBn: true,
      category: true,
      image: true,
      metaTitle: true,
      metaDescription: true,
      dateModified: true,
    },
  });
}

export function getPublicMediaItem(slug: string) {
  return db.mediaItem.findFirst({
    where: { slug, status: "published" },
    select: {
      slug: true,
      title: true,
      titleBn: true,
      description: true,
      descriptionBn: true,
      content: true,
      contentBn: true,
      type: true,
      source: true,
      sourceUrl: true,
      image: true,
      metaTitle: true,
      metaDescription: true,
      datePublished: true,
    },
  });
}

export function getPublicResource(slug: string) {
  return db.resource.findFirst({
    where: { slug, status: "published" },
    select: {
      slug: true,
      title: true,
      titleBn: true,
      description: true,
      descriptionBn: true,
      content: true,
      contentBn: true,
      category: true,
      type: true,
      tags: true,
      fileUrl: true,
      externalUrl: true,
      image: true,
      metaTitle: true,
      metaDescription: true,
      dateModified: true,
    },
  });
}

export function getPublicCareer(slug: string) {
  return db.career.findFirst({
    where: { slug, status: PUBLIC_CAREER_STATUS },
    select: {
      slug: true,
      title: true,
      titleBn: true,
      description: true,
      descriptionBn: true,
      requirements: true,
      requirementsBn: true,
      department: true,
      location: true,
      type: true,
      salary: true,
      applicationUrl: true,
      status: true,
      metaTitle: true,
      metaDescription: true,
      dateModified: true,
    },
  });
}

export function getPublicEvent(slug: string) {
  return db.event.findFirst({
    where: { slug, status: "published" },
    select: {
      slug: true,
      name: true,
      nameBn: true,
      description: true,
      descriptionBn: true,
      startDate: true,
      endDate: true,
      time: true,
      location: true,
      locationUrl: true,
      registrationUrl: true,
      category: true,
      capacity: true,
      registered: true,
    },
  });
}

export function getPublicPublication(slug: string) {
  return db.publication.findFirst({
    where: { slug, status: "published" },
    select: {
      slug: true,
      title: true,
      titleBn: true,
      description: true,
      descriptionBn: true,
      type: true,
      author: true,
      tags: true,
      pdfUrl: true,
      pages: true,
      downloads: true,
      datePublished: true,
      dateModified: true,
    },
  });
}

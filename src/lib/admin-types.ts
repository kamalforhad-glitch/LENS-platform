// ============================================================
// Admin Dashboard Types — Aligned with Prisma camelCase output
// ============================================================

export type ContentStatus = "draft" | "published" | "archived" | "cancelled";
export type UserRole = "admin" | "editor" | "viewer";
export type ReviewStatus = "none" | "pending" | "under_review" | "revision_requested" | "approved" | "rejected";
export type ReviewAssignmentStatus = "pending" | "in_progress" | "completed" | "declined";
export type CommentSeverity = "suggestion" | "issue" | "critical" | "praise";
export type CitationType = "journal" | "book" | "conference" | "report" | "web" | "other";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface AdminResearchArticle {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  category: string;
  author: string;
  tags: string;
  image: string | null;
  pdfUrl: string | null;
  status: ContentStatus;
  featured: boolean;
  downloads: number;
  citations: string;
  datePublished: Date | null;
  dateCreated: Date;
  dateModified: Date;
  createdBy: string | null;
  abstract: string;
  methodology: string;
  doi: string | null;
  version: number;
  submitterName: string | null;
  submitterEmail: string | null;
  submitterAffiliation: string | null;
  reviewStatus: ReviewStatus;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  approvedAt: Date | null;
  publishedVersion: number | null;
}

export interface AdminPublication {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: string;
  author: string;
  tags: string;
  pdfUrl: string | null;
  pages: number | null;
  status: ContentStatus;
  downloads: number;
  datePublished: Date | null;
  dateCreated: Date;
  dateModified: Date;
  createdBy: string | null;
}

export interface AdminEvent {
  id: string;
  slug: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  time: string;
  location: string;
  locationUrl: string | null;
  registrationUrl: string | null;
  category: string;
  capacity: number | null;
  registered: number;
  status: ContentStatus;
  dateCreated: Date;
  dateModified: Date;
  createdBy: string | null;
}

export interface AdminTeamMember {
  id: string;
  slug: string;
  name: string;
  role: string;
  department: string;
  bio: string;
  image: string | null;
  email: string | null;
  social: string;
  sortOrder: number;
  active: boolean;
  dateCreated: Date;
  dateModified: Date;
  createdBy: string | null;
}

export interface AdminMediaFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  alt: string;
  uploadedBy: string | null;
  dateCreated: Date;
}

export interface DashboardStats {
  totalResearch: number;
  publishedResearch: number;
  draftResearch: number;
  totalPublications: number;
  totalEvents: number;
  upcomingEvents: number;
  totalTeam: number;
  totalMedia: number;
  totalDownloads: number;
  pendingReviews: number;
  totalAuthors: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// ============================================================
// Newsletter Types
// ============================================================

export interface AdminNewsletterSubscriber {
  id: string;
  email: string;
  status: string;
  token: string | null;
  createdAt: Date;
  updatedAt: Date;
  confirmedAt: Date | null;
}

// ============================================================
// Contact Form Types
// ============================================================

export interface AdminContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  createdAt: Date;
}

// ============================================================
// Email Log Types
// ============================================================

export interface AdminEmailLog {
  id: string;
  to: string;
  subject: string;
  type: string;
  status: string;
  messageId: string | null;
  error: string | null;
  createdAt: Date;
}

// ============================================================
// Backup Types
// ============================================================

export interface AdminBackupRecord {
  id: string;
  filename: string;
  size: number;
  status: string;
  type: string;
  error: string | null;
  createdAt: Date;
}

export interface BackupStats {
  total: number;
  completed: number;
  failed: number;
  latest: AdminBackupRecord | null;
}

// ============================================================
// Academic Workflow Types
// ============================================================

export interface AdminAuthorProfile {
  id: string;
  slug: string;
  name: string;
  email: string | null;
  affiliation: string;
  orcid: string | null;
  bio: string;
  expertise: string;
  image: string | null;
  website: string | null;
  social: string;
  articleCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminReviewAssignment {
  id: string;
  articleId: string;
  reviewerId: string | null;
  status: ReviewAssignmentStatus;
  deadline: Date | null;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  reviewer?: AdminUser;
  article?: { id: string; slug: string; title: string; category: string; author: string; reviewStatus: string; version: number };
  comments?: AdminReviewComment[];
  _count?: { comments: number };
}

export interface AdminReviewComment {
  id: string;
  assignmentId: string;
  section: string;
  lineRef: string | null;
  comment: string;
  severity: CommentSeverity;
  resolved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminCitationRecord {
  id: string;
  articleId: string;
  type: CitationType;
  authors: string;
  title: string;
  journal: string | null;
  year: number | null;
  volume: string | null;
  issue: string | null;
  pages: string | null;
  doi: string | null;
  url: string | null;
  isbn: string | null;
  citationKey: string | null;
  createdAt: Date;
}

export interface AdminResearchVersion {
  id: string;
  articleId: string;
  version: number;
  title: string;
  description: string;
  content: string;
  tags: string;
  changelog: string;
  createdBy: string | null;
  createdAt: Date;
}

// ============================================================
// Search Types
// ============================================================

export interface SearchResult {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  author: string;
  tags: string;
  datePublished: Date | null;
  downloads: number;
  rank: number;
  headline: string;
}

export interface AutocompleteResult {
  type: "article" | "category" | "topic" | "author";
  text: string;
  slug?: string;
  count?: number;
}

export interface RelatedContent {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  datePublished: Date | null;
  score: number;
}

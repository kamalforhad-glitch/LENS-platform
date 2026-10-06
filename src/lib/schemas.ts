// ============================================================
// Shared zod validation schemas — whitelist-only inputs for
// APIs and server actions (prevents mass assignment).
// Phase 4: extend per-content-type as CMS fields are migrated.
// ============================================================
import { z } from "zod";
import { isValidUrl } from "@/lib/validation";

export const slugSchema = z
  .string()
  .min(1)
  .max(140)
  .regex(/^[a-z0-9\u0980-\u09FF]+(?:-[a-z0-9\u0980-\u09FF]+)*$/i);

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().max(254).email(),
  subject: z.string().trim().min(3).max(200),
  message: z.string().trim().min(10).max(5000),
});

export const newsletterSubscribeSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).email(),
});

export const uuidSchema = z.string().uuid();

// Empty string is treated as "not provided" so clients that post "" keep working.
const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

export const optionalEmailSchema = z.preprocess(
  emptyToUndefined,
  z.string().trim().toLowerCase().max(254).email().nullish()
);

export const optionalUrlSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  z
    .string()
    .trim()
    .max(500)
    .refine(isValidUrl, { message: "must be a valid http(s) URL" })
    .nullish()
);

const stringList = (maxItemLength: number) =>
  z.array(z.string().trim().min(1).max(maxItemLength)).max(50);

// Whitelist-only: unknown keys are stripped (prevents mass assignment of
// status/totalDownloads/slug/… on the researcher_profiles table).
export const researcherCreateSchema = z.object({
  name: z.string().trim().min(2).max(150),
  email: optionalEmailSchema,
  affiliation: z.string().trim().max(200).default(""),
  position: z.string().trim().max(200).default(""),
  bio: z.string().trim().max(5000).default(""),
  image: optionalUrlSchema,
  orcid: z.string().trim().max(100).optional().nullable(),
  website: optionalUrlSchema,
  social: z.record(z.string().trim().max(50), z.string().trim().max(500)).optional(),
  researchAreas: stringList(120).default([]),
  expertise: stringList(120).default([]),
  education: stringList(300).default([]),
  languages: stringList(60).default([]),
  featured: z.boolean().default(false),
});

export type ResearcherCreateInput = z.infer<typeof researcherCreateSchema>;

export const blogPostCreateSchema = z.object({
  title: z.string().trim().min(1).max(300),
  slug: z.string().trim().max(140).optional(),
  description: z.string().trim().max(2000).default(""),
  content: z.string().max(200000).default(""),
  author: z.string().trim().max(150).default("LENS Team"),
  category: z.string().trim().max(100).default("Analysis"),
  tags: z.array(z.string().trim().max(60)).max(30).default([]),
  status: z.enum(["draft", "published", "scheduled"]).default("draft"),
  featured: z.boolean().default(false),
});

export const blogPostUpdateSchema = blogPostCreateSchema.partial().extend({
  id: uuidSchema,
});

export function parseDateOrNull(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value !== "string" || value.trim() === "") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

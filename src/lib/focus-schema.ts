import { z } from "zod";
import { isSafeFocusUrl } from "./focus-url";

export const focusSlugSchema = z
  .string()
  .trim()
  .min(1, "Slug is required")
  .max(120, "Slug must be 120 characters or fewer")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens");

export const focusUpdateSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(160),
  description: z.string().trim().min(1, "Description is required").max(600),
  icon: z.string().trim().max(64).nullable().optional(),
  slug: focusSlugSchema,
  content: z.string().max(50_000).nullable().optional(),
  imageUrl: z
    .string()
    .trim()
    .max(500)
    .nullable()
    .optional()
    .refine((value) => isSafeFocusUrl(value), "Unsafe image URL"),
  order: z.number().int().min(-1000).max(1000).optional(),
});

export const focusIdSchema = z.coerce.number().int().positive();

export type FocusUpdateInput = z.infer<typeof focusUpdateSchema>;

import { z } from "zod";

export const listingStatus = z.enum(["active", "pending", "hidden"]);
export type ListingStatus = z.infer<typeof listingStatus>;

export const gradeLevel = z.enum(["middle_school", "high_school", "college"]);
export type GradeLevel = z.infer<typeof gradeLevel>;

export const postType = z.enum(["post", "question"]);
export type PostType = z.infer<typeof postType>;

export const contentStatus = z.enum([
  "active",
  "hidden",
  "deleted",
  "under_review",
]);
export type ContentStatus = z.infer<typeof contentStatus>;

/** coerce ?limit=20 with sane bounds */
export const limitParam = z.coerce.number().int().min(1).max(50).default(20);

export const apiErrorShape = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});
export type ApiErrorShape = z.infer<typeof apiErrorShape>;

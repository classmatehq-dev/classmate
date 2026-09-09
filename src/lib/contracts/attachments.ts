import { z } from "zod";

/**
 * Shared attachment contracts. Used by messages, posts and comments.
 * Files live in Vercel Blob; the DB only stores metadata + the public URL.
 */

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15 MB
export const MAX_ATTACHMENTS_PER_ITEM = 4;

export const IMAGE_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
] as const;

export const DOC_CONTENT_TYPES = [
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
] as const;

export const ALLOWED_CONTENT_TYPES: string[] = [
  ...IMAGE_CONTENT_TYPES,
  ...DOC_CONTENT_TYPES,
];

/** file-picker `accept` string */
export const UPLOAD_ACCEPT = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".heic",
  ".pdf",
  ".txt",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".xls",
  ".xlsx",
].join(",");

export const attachmentKind = z.enum(["image", "file"]);
export type AttachmentKind = z.infer<typeof attachmentKind>;

/** what the client sends after uploading a blob, before it's attached to a row */
export const attachmentInput = z.object({
  url: z.string().url().max(2000),
  pathname: z.string().min(1).max(1024),
  name: z.string().trim().min(1).max(255),
  width: z.number().int().positive().max(50000).optional(),
  height: z.number().int().positive().max(50000).optional(),
});
export type AttachmentInput = z.infer<typeof attachmentInput>;

export const attachmentsInput = z
  .array(attachmentInput)
  .max(MAX_ATTACHMENTS_PER_ITEM)
  .optional();

/** what the API returns */
export const attachmentDto = z.object({
  id: z.string().uuid(),
  kind: attachmentKind,
  url: z.string(),
  name: z.string(),
  contentType: z.string(),
  size: z.number().int().nonnegative(),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
});
export type AttachmentDto = z.infer<typeof attachmentDto>;

export function isImageContentType(ct: string): boolean {
  return (IMAGE_CONTENT_TYPES as readonly string[]).includes(ct);
}

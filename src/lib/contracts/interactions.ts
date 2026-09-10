import { z } from "zod";

import { attachmentDto, attachmentsInput } from "./attachments";
import { contentStatus, postType } from "./common";

// ---------------------------------------------------------------------------
// Helpful votes
// ---------------------------------------------------------------------------

export const helpfulBody = z.object({
  targetType: z.enum(["post", "comment"]),
  targetId: z.string().uuid(),
});
export type HelpfulBody = z.infer<typeof helpfulBody>;

export const helpfulResponse = z.object({
  marked: z.boolean(),
  count: z.number().int().nonnegative(),
});
export type HelpfulResponse = z.infer<typeof helpfulResponse>;

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

export const createPostBody = z
  .object({
    body: z.string().trim().max(5000).default(""),
    type: postType.default("post"),
    visibility: z.enum(["class", "public"]).default("class"),
    attachments: attachmentsInput,
  })
  .refine((d) => d.body.length > 0 || (d.attachments?.length ?? 0) > 0, {
    message: "Write something or attach a file.",
    path: ["body"],
  });
export type CreatePostBody = z.infer<typeof createPostBody>;

export const updatePostBody = z.object({
  body: z.string().trim().min(1).max(5000).optional(),
  type: postType.optional(),
});

export const listPostsQuery = z.object({
  limit: z.coerce.number().int().min(1).max(30).default(15),
  cursor: z.string().max(500).optional(),
});

export const postAuthorDto = z.object({
  id: z.string().uuid(),
  username: z.string(),
  avatarUrl: z.string().nullable(),
});

export const postDto = z.object({
  id: z.string().uuid(),
  classId: z.string().uuid(),
  type: postType,
  body: z.string(),
  status: contentStatus,
  visibility: z.enum(["class", "public"]),
  createdAt: z.string(),
  updatedAt: z.string(),
  helpfulCount: z.number().int().nonnegative(),
  commentCount: z.number().int().nonnegative(),
  viewerHasMarkedHelpful: z.boolean(),
  viewerHasSaved: z.boolean(),
  isAuthor: z.boolean(),
  author: postAuthorDto,
  attachments: z.array(attachmentDto),
  mentions: z.array(z.string()),
});
export type PostDto = z.infer<typeof postDto>;

export const listPostsResponse = z.object({
  items: z.array(postDto),
  nextCursor: z.string().nullable(),
});
export type ListPostsResponse = z.infer<typeof listPostsResponse>;

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

export const createCommentBody = z
  .object({
    body: z.string().trim().max(3000).default(""),
    parentCommentId: z.string().uuid().optional(),
    attachments: attachmentsInput,
  })
  .refine((d) => d.body.length > 0 || (d.attachments?.length ?? 0) > 0, {
    message: "Write a comment or attach a file.",
    path: ["body"],
  });
export type CreateCommentBody = z.infer<typeof createCommentBody>;

export const updateCommentBody = z.object({
  body: z.string().trim().min(1).max(3000),
});

export const commentDto = z.object({
  id: z.string().uuid(),
  postId: z.string().uuid(),
  parentCommentId: z.string().uuid().nullable(),
  body: z.string(),
  status: contentStatus,
  createdAt: z.string(),
  helpfulCount: z.number().int().nonnegative(),
  viewerHasMarkedHelpful: z.boolean(),
  isAuthor: z.boolean(),
  author: postAuthorDto,
  attachments: z.array(attachmentDto),
  mentions: z.array(z.string()),
});
export type CommentDto = z.infer<typeof commentDto>;

export const listCommentsResponse = z.array(commentDto);

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export const reportBody = z.object({
  targetType: z.enum(["post", "comment", "profile"]),
  targetId: z.string().uuid(),
  category: z.enum([
    "inappropriate",
    "bullying",
    "cheating",
    "spam",
    "privacy",
    "copyright",
    "other",
  ]),
  details: z.string().trim().max(1000).optional(),
});
export type ReportBody = z.infer<typeof reportBody>;

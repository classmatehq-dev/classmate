import { z } from "zod";

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

export const createPostBody = z.object({
  body: z.string().trim().min(1, "Write something first.").max(5000),
  type: postType.default("post"),
  visibility: z.enum(["class", "public"]).default("class"),
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
  isAuthor: z.boolean(),
  author: postAuthorDto,
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

export const createCommentBody = z.object({
  body: z.string().trim().min(1, "Write a comment first.").max(3000),
  parentCommentId: z.string().uuid().optional(),
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

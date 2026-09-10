import { z } from "zod";

import { attachmentDto } from "./attachments";
import { contentStatus, postType } from "./common";

export const feedQuery = z.object({
  limit: z.coerce.number().int().min(1).max(30).default(10),
  cursor: z.string().max(500).optional(),
});
export type FeedQuery = z.infer<typeof feedQuery>;

export const feedAuthorDto = z.object({
  id: z.string().uuid(),
  username: z.string(),
  avatarUrl: z.string().nullable(),
});

export const feedClassDto = z.object({
  id: z.string().uuid(),
  name: z.string(),
  teacherName: z.string().nullable(),
});

export const feedItemDto = z.object({
  id: z.string().uuid(),
  type: postType,
  body: z.string(),
  status: contentStatus,
  createdAt: z.string(),
  helpfulCount: z.number().int().nonnegative(),
  commentCount: z.number().int().nonnegative(),
  viewerHasMarkedHelpful: z.boolean(),
  viewerHasSaved: z.boolean(),
  isAuthor: z.boolean(),
  author: feedAuthorDto,
  class: feedClassDto,
  attachments: z.array(attachmentDto),
  /** canonical usernames mentioned in the body, for linkifying */
  mentions: z.array(z.string()),
});
export type FeedItemDto = z.infer<typeof feedItemDto>;

export const feedResponse = z.object({
  items: z.array(feedItemDto),
  nextCursor: z.string().nullable(),
});
export type FeedResponse = z.infer<typeof feedResponse>;

import { z } from "zod";

import { gradeLevel } from "./common";
import { feedItemDto } from "./feed";

export const publicProfileDto = z.object({
  id: z.string().uuid(),
  username: z.string(),
  gradeLevel: gradeLevel.nullable(),
  bio: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  helpfulReceived: z.number().int().nonnegative(),
  followersCount: z.number().int().nonnegative(),
  followingCount: z.number().int().nonnegative(),
  postCount: z.number().int().nonnegative(),
  isSelf: z.boolean(),
  viewerIsFollowing: z.boolean(),
  joinedAt: z.string(),
});
export type PublicProfileDto = z.infer<typeof publicProfileDto>;

export const profilePostsResponse = z.array(feedItemDto);

export const followResponse = z.object({
  following: z.boolean(),
  followersCount: z.number().int().nonnegative(),
});
export type FollowResponse = z.infer<typeof followResponse>;

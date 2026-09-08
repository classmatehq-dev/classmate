import { z } from "zod";

export const leaderboardEntry = z.object({
  rank: z.number().int().positive(),
  userId: z.string().uuid(),
  username: z.string(),
  avatarUrl: z.string().nullable(),
  value: z.number().int().nonnegative(),
  isViewer: z.boolean(),
});
export type LeaderboardEntry = z.infer<typeof leaderboardEntry>;

export const leaderboardResponse = z.object({
  mostHelpful: z.array(leaderboardEntry),
  mostFollowed: z.array(leaderboardEntry),
});
export type LeaderboardResponse = z.infer<typeof leaderboardResponse>;

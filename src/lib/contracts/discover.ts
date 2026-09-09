import { z } from "zod";

import { gradeLevel } from "./common";

export const discoverQuery = z.object({
  q: z.string().trim().max(120).optional(),
});

export const discoverClass = z.object({
  id: z.string().uuid(),
  name: z.string(),
  teacherName: z.string().nullable(),
  schoolName: z.string(),
  state: z.string(),
  memberCount: z.number().int().nonnegative(),
});
export type DiscoverClass = z.infer<typeof discoverClass>;

export const discoverStudent = z.object({
  id: z.string().uuid(),
  username: z.string(),
  avatarUrl: z.string().nullable(),
  gradeLevel: gradeLevel.nullable(),
  helpfulReceived: z.number().int().nonnegative(),
});
export type DiscoverStudent = z.infer<typeof discoverStudent>;

export const discoverResponse = z.object({
  query: z.string(),
  classes: z.array(discoverClass),
  students: z.array(discoverStudent),
});
export type DiscoverResponse = z.infer<typeof discoverResponse>;

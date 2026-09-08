import { z } from "zod";

import { gradeLevel } from "./common";

export const usernameField = z
  .string()
  .trim()
  .min(3, "Usernames need at least 3 characters.")
  .max(20, "Usernames can be at most 20 characters.")
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "Use only letters, numbers, and underscores.",
  );

export const createProfileBody = z.object({
  username: usernameField,
  gradeLevel,
});
export type CreateProfileBody = z.infer<typeof createProfileBody>;

export const updateProfileBody = z.object({
  username: usernameField.optional(),
  gradeLevel: gradeLevel.optional(),
  bio: z.string().trim().max(280).optional(),
  avatarUrl: z.string().url().max(500).optional().or(z.literal("")),
});
export type UpdateProfileBody = z.infer<typeof updateProfileBody>;

export const onboardingStepValue = z.enum([
  "profile",
  "school",
  "classes",
  "done",
]);

export const meDto = z.object({
  id: z.string().uuid(),
  username: z.string(),
  email: z.string(),
  gradeLevel: gradeLevel.nullable(),
  bio: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  onboardingSchoolId: z.string().uuid().nullable(),
  onboardingCompleted: z.boolean(),
  onboardingStep: onboardingStepValue,
});
export type MeDto = z.infer<typeof meDto>;

export const myClassDto = z.object({
  id: z.string().uuid(),
  name: z.string(),
  teacherName: z.string(),
  schoolName: z.string(),
  newPostCount: z.number().int().nonnegative(),
  postCount: z.number().int().nonnegative(),
  lastSeenAt: z.string().nullable(),
});
export type MyClassDto = z.infer<typeof myClassDto>;

export const listMyClassesResponse = z.array(myClassDto);

export const setSchoolBody = z.object({
  schoolId: z.string().uuid(),
});

export const completeOnboardingBody = z.object({}).optional();

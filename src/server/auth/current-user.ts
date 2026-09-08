import { cache } from "react";

import { db } from "@/server/db";
import type { User } from "@/server/db/schema";
import { type AuthIdentity, getAuthIdentity } from "./identity";

/**
 * The Classmate profile row for the current request, or null if the visitor is
 * not signed in / has no profile yet. Deduped per request via React `cache`.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const identity = await getAuthIdentity();
  if (!identity) return null;
  const user = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.clerkUserId, identity.clerkUserId),
  });
  return user ?? null;
});

export const getAuthContext = cache(
  async (): Promise<{ identity: AuthIdentity | null; user: User | null }> => {
    const identity = await getAuthIdentity();
    if (!identity) return { identity: null, user: null };
    const user = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.clerkUserId, identity.clerkUserId),
    });
    return { identity, user: user ?? null };
  },
);

// ---------------------------------------------------------------------------
// Onboarding state machine
// ---------------------------------------------------------------------------

export type OnboardingStep = "profile" | "school" | "classes" | "done";

export function onboardingStep(user: User | null): OnboardingStep {
  if (!user) return "profile";
  if (!user.onboardingSchoolId) return "school";
  if (!user.onboardingCompletedAt) return "classes";
  return "done";
}

export function onboardingPath(step: OnboardingStep): string {
  switch (step) {
    case "profile":
      return "/onboarding/profile";
    case "school":
      return "/onboarding/school";
    case "classes":
      return "/onboarding/classes";
    case "done":
      return "/home";
  }
}

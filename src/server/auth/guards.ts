import { redirect } from "next/navigation";

import type { User } from "@/server/db/schema";
import {
  getAuthContext,
  onboardingPath,
  type OnboardingStep,
  onboardingStep,
} from "./current-user";

/** Not signed in at all → send to the sign-in screen. */
function bounceToSignIn(): never {
  redirect("/login");
}

/**
 * Pages inside the authed app shell: require a fully-onboarded user, otherwise
 * send them to sign-in or to the correct onboarding step.
 */
export async function requireCompletedUser(): Promise<User> {
  const { identity, user } = await getAuthContext();
  if (!identity) bounceToSignIn();
  const step = onboardingStep(user);
  if (step !== "done") redirect(onboardingPath(step));
  return user as User;
}

/** Onboarding step pages: require sign-in + exactly this step. */
export async function requireOnboardingStep(
  expected: Extract<OnboardingStep, "profile" | "school" | "classes">,
): Promise<{ user: User | null }> {
  const { identity, user } = await getAuthContext();
  if (!identity) bounceToSignIn();
  const step = onboardingStep(user);
  if (step !== expected) redirect(onboardingPath(step));
  return { user };
}

import { redirect } from "next/navigation";

import type { User } from "@/server/db/schema";
import {
  getCurrentUser,
  onboardingPath,
  type OnboardingStep,
  onboardingStep,
} from "./current-user";

/**
 * For pages inside the authed app shell: require a fully-onboarded user,
 * otherwise send them to the correct onboarding step (or /signup).
 */
export async function requireCompletedUser(): Promise<User> {
  const user = await getCurrentUser();
  const step = onboardingStep(user);
  if (step !== "done") redirect(onboardingPath(step));
  return user as User;
}

/**
 * For an onboarding step page: ensure the user is exactly on this step,
 * bouncing forward/back as needed.
 */
export async function requireOnboardingStep(
  expected: Extract<OnboardingStep, "school" | "classes">,
): Promise<User> {
  const user = await getCurrentUser();
  const step = onboardingStep(user);
  if (step !== expected) redirect(onboardingPath(step));
  return user as User;
}

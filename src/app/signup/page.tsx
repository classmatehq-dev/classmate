import { redirect } from "next/navigation";

import {
  getCurrentUser,
  onboardingPath,
  onboardingStep,
} from "@/server/auth/current-user";
import { SignupForm } from "./signup-form";

export default async function SignupPage() {
  const user = await getCurrentUser();
  const step = onboardingStep(user);
  if (step !== "signup") redirect(onboardingPath(step));
  return <SignupForm />;
}

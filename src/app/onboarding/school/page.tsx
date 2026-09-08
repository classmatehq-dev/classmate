import { requireOnboardingStep } from "@/server/auth/guards";
import { SchoolOnboarding } from "./school-onboarding";

export default async function SchoolOnboardingPage() {
  await requireOnboardingStep("school");
  return <SchoolOnboarding />;
}

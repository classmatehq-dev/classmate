import { requireOnboardingStep } from "@/server/auth/guards";
import { ClassOnboarding } from "./class-onboarding";

export default async function ClassOnboardingPage() {
  const user = await requireOnboardingStep("classes");
  return <ClassOnboarding schoolId={user.onboardingSchoolId!} />;
}

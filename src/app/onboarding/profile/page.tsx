import { requireOnboardingStep } from "@/server/auth/guards";
import { ProfileForm } from "./profile-form";

export default async function ProfileOnboardingPage() {
  await requireOnboardingStep("profile");
  return <ProfileForm />;
}

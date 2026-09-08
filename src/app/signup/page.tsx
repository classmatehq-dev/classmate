import { redirect } from "next/navigation";
import { SignUp } from "@clerk/nextjs";

import { Logo } from "@/components/logo";
import { authMode } from "@/env";
import {
  getAuthContext,
  onboardingPath,
  onboardingStep,
} from "@/server/auth/current-user";

export default async function SignUpPage() {
  const { identity, user } = await getAuthContext();

  // Already signed in → continue where they left off.
  if (identity) redirect(onboardingPath(onboardingStep(user)));

  if (authMode === "dev") {
    // No real signup in dev mode — the dev session is always "signed in".
    redirect("/onboarding/profile");
  }

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo size={48} />
        </div>
        <SignUp
          routing="hash"
          signInUrl="/login"
          fallbackRedirectUrl="/"
        />
      </div>
    </main>
  );
}

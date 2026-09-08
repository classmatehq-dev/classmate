import Link from "next/link";
import { redirect } from "next/navigation";
import { SignIn } from "@clerk/nextjs";

import { Logo } from "@/components/logo";
import { ButtonLink } from "@/components/ui";
import { authMode } from "@/env";
import {
  getAuthContext,
  onboardingPath,
  onboardingStep,
} from "@/server/auth/current-user";
import { DevAccountSwitcher } from "./dev-switcher";

export default async function LoginPage() {
  const { identity, user } = await getAuthContext();

  if (authMode === "clerk") {
    if (identity) redirect(onboardingPath(onboardingStep(user)));
    return (
      <main className="flex flex-1 flex-col items-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex justify-center">
            <Logo size={48} />
          </div>
          <SignIn
            routing="hash"
            signUpUrl="/signup"
            forceRedirectUrl="/onboarding/profile"
          />
        </div>
      </main>
    );
  }

  // Dev mode
  const step = onboardingStep(user);
  const nextPath = onboardingPath(step);

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex justify-center">
          <Logo size={48} />
        </Link>
        <h1 className="mt-6 text-center text-2xl font-extrabold text-navy">
          Log in
        </h1>

        <div className="mt-8 rounded-card border border-border bg-surface p-5">
          <p className="text-sm text-muted">Signed in as</p>
          <p className="text-lg font-bold text-navy">
            {user ? user.username : "New account"}
          </p>
          <ButtonLink href={nextPath} className="mt-4 w-full">
            {step === "done" ? "Go to Home" : "Continue setup"}
          </ButtonLink>
        </div>

        <DevAccountSwitcher />

        <p className="mt-6 text-center text-xs text-muted">
          Dev mode login. Real email/password login is added with Clerk.
        </p>
      </div>
    </main>
  );
}

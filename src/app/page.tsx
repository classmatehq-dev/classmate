import Link from "next/link";
import { redirect } from "next/navigation";

import { Logo } from "@/components/logo";
import { authMode } from "@/env";
import {
  getAuthContext,
  onboardingPath,
  onboardingStep,
} from "@/server/auth/current-user";

export default async function WelcomePage() {
  const { identity, user } = await getAuthContext();
  // Has a profile → resume onboarding / go home.
  if (user) redirect(onboardingPath(onboardingStep(user)));
  // Signed into Clerk but no profile yet → make one.
  if (identity && authMode === "clerk") redirect("/onboarding/profile");
  // Dev mode with no profile, or a true guest → show the welcome screen.
  return <Welcome />;
}

function Welcome() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm text-center">
        <div className="flex justify-center">
          <Logo size={64} />
        </div>

        <h1 className="mt-8 text-4xl font-extrabold tracking-tight text-navy">
          Classmate
        </h1>
        <p className="mt-2 text-lg font-semibold text-brand-blue">
          Learn from your class.
        </p>

        <p className="mt-4 text-base leading-7 text-muted">
          Find notes, questions, discussions, and study material from students in
          your classes.
        </p>

        <div className="mt-10 flex flex-col gap-3">
          <Link
            href="/signup"
            className="flex h-12 items-center justify-center rounded-pill bg-brand-blue px-6 text-base font-semibold text-white transition-colors hover:bg-brand-blue-600"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="flex h-12 items-center justify-center rounded-pill border border-border bg-surface px-6 text-base font-semibold text-navy transition-colors hover:bg-light-blue"
          >
            Log In
          </Link>
        </div>
      </div>
    </main>
  );
}

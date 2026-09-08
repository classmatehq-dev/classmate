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
    <main className="bg-hero relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-16 text-white">
      <div className="bg-hero-dots pointer-events-none absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute -left-16 top-10 h-56 w-56 rounded-full bg-accent-yellow/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-sky/40 blur-3xl" />

      <div className="animate-rise relative w-full max-w-sm text-center">
        <div className="flex justify-center">
          <span className="rounded-3xl bg-white/12 p-3 backdrop-blur">
            <Logo size={60} />
          </span>
        </div>

        <h1 className="mt-7 text-4xl font-extrabold tracking-tight">Classmate</h1>
        <p className="mt-2 text-lg font-bold text-accent-yellow">
          Learn from your class.
        </p>

        <p className="mx-auto mt-4 max-w-xs text-base leading-7 text-white/85">
          Find notes, questions, discussions, and study material from students in
          your classes.
        </p>

        <div className="mt-10 flex flex-col gap-3">
          <Link
            href="/signup"
            className="flex h-12 items-center justify-center rounded-pill bg-white px-6 text-base font-bold text-brand-blue shadow-card transition-transform hover:-translate-y-0.5"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="flex h-12 items-center justify-center rounded-pill border border-white/40 px-6 text-base font-semibold text-white transition-colors hover:bg-white/10"
          >
            Log In
          </Link>
        </div>
      </div>
    </main>
  );
}

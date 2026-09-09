import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Logo } from "@/components/logo";
import { authMode } from "@/env";
import {
  getAuthContext,
  onboardingPath,
  onboardingStep,
} from "@/server/auth/current-user";

export const metadata: Metadata = {
  title: "Classmate — study with the students in your class",
  description:
    "Classmate connects you with the students in your exact class — same school, same teacher, same course. Share notes, ask questions, and study together.",
  alternates: { canonical: "/" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Classmate",
  url: "https://useclassmate.com",
  description:
    "A social learning platform where students connect with classmates in their exact class to share notes, ask questions, and study together.",
};

export default async function WelcomePage() {
  const { identity, user } = await getAuthContext();
  if (user) redirect(onboardingPath(onboardingStep(user)));
  if (identity && authMode === "clerk") redirect("/onboarding/profile");
  return <Landing />;
}

function Landing() {
  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="flex flex-1 flex-col">
        {/* Hero */}
        <section className="bg-hero relative overflow-hidden px-6 pb-20 pt-16 text-white">
          <div className="bg-hero-dots pointer-events-none absolute inset-0 opacity-50" />
          <div className="pointer-events-none absolute -left-16 top-10 h-56 w-56 rounded-full bg-accent-yellow/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-sky/40 blur-3xl" />

          <div className="animate-rise relative mx-auto max-w-xl text-center">
            <div className="flex justify-center">
              <Logo size={64} tone="white" withWordmark />
            </div>

            <h1 className="mt-7 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Study with the students
              <br />
              <span className="text-accent-yellow">in your class.</span>
            </h1>

            <p className="mx-auto mt-4 max-w-md text-lg leading-8 text-white/90">
              Classmate connects you with classmates in your exact class — same
              school, same teacher, same course. Share notes, ask questions, and
              learn together.
            </p>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="flex h-12 items-center justify-center rounded-pill bg-white px-7 text-base font-bold text-brand-blue shadow-card transition-transform hover:-translate-y-0.5"
              >
                Get Started
              </Link>
              <Link
                href="/login"
                className="flex h-12 items-center justify-center rounded-pill border border-white/40 px-7 text-base font-semibold text-white transition-colors hover:bg-white/10"
              >
                Log In
              </Link>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto w-full max-w-4xl px-6 py-16">
          <h2 className="text-center text-2xl font-extrabold text-navy">
            How it works
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {[
              {
                n: "1",
                t: "Find your class",
                d: "Pick your state, school, and teacher. If your class isn't there yet, add it.",
              },
              {
                n: "2",
                t: "Join the room",
                d: "Every class has its own space — just your classmates, not the whole school.",
              },
              {
                n: "3",
                t: "Learn together",
                d: "Post questions and notes, answer classmates, and like what actually helps.",
              },
            ].map((s) => (
              <div
                key={s.n}
                className="rounded-card border border-border bg-surface p-5 shadow-card"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-blue text-sm font-extrabold text-white">
                  {s.n}
                </span>
                <h3 className="mt-3 font-bold text-navy">{s.t}</h3>
                <p className="mt-1 text-sm leading-6 text-muted">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="bg-sky">
          <div className="mx-auto w-full max-w-4xl px-6 py-16">
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  t: "Questions get answered",
                  d: "Ask about a homework problem or a test topic and get help from people taking the same class.",
                },
                {
                  t: "Notes worth keeping",
                  d: "Study guides, summaries, and vocab lists — shared where they're actually useful.",
                },
                {
                  t: "Built for how classes really work",
                  d: "Organised by State → School → Teacher → Class, not vague subject forums.",
                },
                {
                  t: "The helpful stuff rises",
                  d: "Likes surface the answers and notes that helped classmates most.",
                },
              ].map((f) => (
                <div
                  key={f.t}
                  className="rounded-card border border-border bg-surface p-5 shadow-card"
                >
                  <h3 className="font-bold text-navy">{f.t}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted">{f.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto w-full max-w-2xl px-6 py-16 text-center">
          <h2 className="text-2xl font-extrabold text-navy">
            Your class is better together.
          </h2>
          <p className="mx-auto mt-2 max-w-md text-muted">
            Free for students. Middle school, high school, and college.
          </p>
          <Link
            href="/signup"
            className="mt-6 inline-flex h-12 items-center justify-center rounded-pill bg-brand-blue px-8 text-base font-bold text-white shadow-blue-sm transition-colors hover:bg-brand-blue-600"
          >
            Get Started
          </Link>
        </section>

        <footer className="border-t border-border px-6 py-8 text-center text-sm text-muted">
          <div className="flex justify-center">
            <Logo size={22} withWordmark />
          </div>
          <p className="mt-3">
            © {new Date().getFullYear()} Classmate · Learn from your class.
          </p>
        </footer>
      </main>
    </>
  );
}

import type { ReactNode } from "react";

import { Logo } from "@/components/logo";

export function OnboardingShell({
  step,
  title,
  subtitle,
  children,
}: {
  step: 1 | 2;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-6 py-10">
      <div className="flex items-center justify-between">
        <Logo size={36} />
        <span className="text-sm font-semibold text-muted">
          Step {step} of 2
        </span>
      </div>

      <div className="mt-4 flex gap-2">
        <span className="h-1.5 flex-1 rounded-pill bg-brand-blue" />
        <span
          className={`h-1.5 flex-1 rounded-pill ${
            step === 2 ? "bg-brand-blue" : "bg-border"
          }`}
        />
      </div>

      <h1 className="mt-8 text-2xl font-extrabold text-navy">{title}</h1>
      <p className="mt-1.5 text-muted">{subtitle}</p>

      <div className="mt-6">{children}</div>
    </main>
  );
}

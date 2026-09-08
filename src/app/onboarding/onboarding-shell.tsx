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
    <main className="animate-rise mx-auto flex w-full max-w-lg flex-1 flex-col px-6 py-8">
      <div className="flex items-center justify-between">
        <Logo size={34} withWordmark />
        <span className="rounded-pill bg-light-blue px-3 py-1 text-xs font-bold text-brand-blue">
          Step {step} of 2
        </span>
      </div>

      <div className="mt-5 flex gap-2">
        <span className="h-1.5 flex-1 rounded-pill bg-brand-blue" />
        <span
          className={`h-1.5 flex-1 rounded-pill ${
            step === 2 ? "bg-brand-blue" : "bg-light-blue-200"
          }`}
        />
      </div>

      <h1 className="mt-8 text-2xl font-extrabold text-navy">{title}</h1>
      <p className="mt-1.5 text-[15px] text-muted">{subtitle}</p>

      <div className="mt-6">{children}</div>
    </main>
  );
}

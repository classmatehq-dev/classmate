"use client";

import { SignOutButton } from "@clerk/nextjs";
import Link from "next/link";

export function AccountControl({
  authMode,
  className,
}: {
  authMode: "dev" | "clerk";
  className?: string;
}) {
  const cls =
    className ??
    "text-sm font-semibold text-muted hover:text-navy";

  if (authMode === "clerk") {
    return (
      <SignOutButton>
        <button className={cls}>Sign out</button>
      </SignOutButton>
    );
  }
  return (
    <Link href="/login" className={cls}>
      Switch account
    </Link>
  );
}

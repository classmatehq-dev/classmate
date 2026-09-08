import Link from "next/link";

import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <Logo size={52} />
      <p className="mt-6 text-6xl font-extrabold text-brand-blue">404</p>
      <h1 className="mt-2 text-xl font-extrabold text-navy">
        This page doesn&apos;t exist
      </h1>
      <p className="mt-1 max-w-xs text-muted">
        The link may be broken, or the page may have been moved.
      </p>
      <Link
        href="/home"
        className="mt-6 inline-flex h-11 items-center justify-center rounded-pill bg-brand-blue px-6 font-bold text-white shadow-blue-sm transition-colors hover:bg-brand-blue-600"
      >
        Go to Home
      </Link>
    </main>
  );
}

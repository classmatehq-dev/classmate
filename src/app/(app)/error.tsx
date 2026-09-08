"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Button } from "@/components/ui";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-light-blue text-2xl">
        😕
      </span>
      <h1 className="mt-4 text-xl font-extrabold text-navy">
        Something went wrong
      </h1>
      <p className="mt-1 max-w-xs text-muted">
        That page hit a snag. Try again, or head back to Home.
      </p>
      <div className="mt-6 flex gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button variant="secondary" onClick={() => router.push("/home")}>
          Go to Home
        </Button>
      </div>
    </div>
  );
}

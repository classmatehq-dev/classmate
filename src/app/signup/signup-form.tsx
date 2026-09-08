"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Logo } from "@/components/logo";
import { Button, Field, Input, Select } from "@/components/ui";
import { ApiClientError } from "@/lib/api/client";
import { useCreateProfile } from "@/lib/api/hooks";
import type { GradeLevel } from "@/lib/contracts/common";

const GRADES: { value: GradeLevel; label: string }[] = [
  { value: "middle_school", label: "Middle school" },
  { value: "high_school", label: "High school" },
  { value: "college", label: "College" },
];

export function SignupForm() {
  const router = useRouter();
  const createProfile = useCreateProfile();
  const [username, setUsername] = useState("");
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>("high_school");
  const [fieldError, setFieldError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldError(null);
    try {
      await createProfile.mutateAsync({ username: username.trim(), gradeLevel });
      router.push("/onboarding/school");
    } catch (err) {
      if (err instanceof ApiClientError) {
        const fromField =
          (err.details as { fieldErrors?: { username?: string[] } } | undefined)
            ?.fieldErrors?.username?.[0];
        setFieldError(fromField ?? err.message);
      } else {
        setFieldError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex justify-center">
          <Logo size={48} />
        </Link>
        <h1 className="mt-6 text-center text-2xl font-extrabold text-navy">
          Create your account
        </h1>
        <p className="mt-1 text-center text-sm text-muted">
          Pick a username and your grade level to get started.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <Field
            label="Username"
            hint="Letters, numbers, and underscores. This is public."
            error={fieldError ?? undefined}
          >
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. sarah_m"
              autoComplete="username"
              autoFocus
              required
              minLength={3}
              maxLength={20}
            />
          </Field>

          <Field label="Grade level">
            <Select
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value as GradeLevel)}
            >
              {GRADES.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </Select>
          </Field>

          <Button
            type="submit"
            className="w-full"
            disabled={createProfile.isPending || username.trim().length < 3}
          >
            {createProfile.isPending ? "Creating…" : "Continue"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-brand-blue">
            Log in
          </Link>
        </p>

        <p className="mt-4 text-center text-xs text-muted">
          Dev mode: email &amp; password are skipped. Real sign-up is added with
          Clerk.
        </p>
      </div>
    </main>
  );
}

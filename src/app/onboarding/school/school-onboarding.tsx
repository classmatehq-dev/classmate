"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, Card, EmptyState, Field, Input, Select, Spinner } from "@/components/ui";
import { useCreateSchool, useListSchools, useSetSchool } from "@/lib/api/hooks";
import type { SchoolDto } from "@/lib/contracts/schools";
import { US_STATES } from "@/lib/us-states";
import { OnboardingShell } from "../onboarding-shell";

export function SchoolOnboarding() {
  const router = useRouter();
  const [state, setState] = useState("");
  const [q, setQ] = useState("");
  const [requesting, setRequesting] = useState(false);

  const schools = useListSchools({ state, q, enabled: state.length > 0 });
  const setSchool = useSetSchool();

  async function choose(school: SchoolDto) {
    await setSchool.mutateAsync(school.id);
    router.push("/onboarding/classes");
  }

  return (
    <OnboardingShell
      step={1}
      title="Where does your learning happen?"
      subtitle="Find your school so the right classmates and classes find you."
    >
      <Field label="State">
        <Select value={state} onChange={(e) => setState(e.target.value)}>
          <option value="">Choose your state…</option>
          {US_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </Field>

      {state && (
        <div className="mt-4">
          <Field label="School">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search for your school"
            />
          </Field>

          <div className="mt-3 space-y-2">
            {schools.isLoading && (
              <div className="flex justify-center py-6">
                <Spinner />
              </div>
            )}

            {schools.data?.map((school) => (
              <button
                key={school.id}
                onClick={() => choose(school)}
                disabled={setSchool.isPending}
                className="w-full text-left"
              >
                <Card className="transition-colors hover:border-brand-blue">
                  <p className="font-semibold text-navy">{school.name}</p>
                  <p className="text-sm text-muted">
                    {[school.city, school.state].filter(Boolean).join(", ")}
                    {school.status === "pending" && " · pending review"}
                  </p>
                </Card>
              </button>
            ))}

            {schools.data && schools.data.length === 0 && !requesting && (
              <EmptyState
                title="No schools found"
                description="Add your school and we'll review it."
                action={
                  <Button size="sm" onClick={() => setRequesting(true)}>
                    Request your school
                  </Button>
                }
              />
            )}
          </div>

          {!requesting ? (
            <button
              onClick={() => setRequesting(true)}
              className="mt-3 text-sm font-semibold text-brand-blue"
            >
              Can&apos;t find your school? Request it
            </button>
          ) : (
            <RequestSchoolForm
              state={state}
              defaultName={q}
              onCancel={() => setRequesting(false)}
              onCreated={choose}
            />
          )}
        </div>
      )}
    </OnboardingShell>
  );
}

function RequestSchoolForm({
  state,
  defaultName,
  onCancel,
  onCreated,
}: {
  state: string;
  defaultName: string;
  onCancel: () => void;
  onCreated: (school: SchoolDto) => void | Promise<void>;
}) {
  const createSchool = useCreateSchool();
  const [name, setName] = useState(defaultName);
  const [city, setCity] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const school = await createSchool.mutateAsync({
        name: name.trim(),
        state,
        city: city.trim() || undefined,
      });
      await onCreated(school);
    } catch {
      setError("We couldn't add that school. Please try again.");
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3 rounded-card border border-border bg-surface p-4">
      <p className="text-sm font-semibold text-navy">Request a school</p>
      <Field label="School name">
        <Input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
      </Field>
      <Field label="City (optional)">
        <Input value={city} onChange={(e) => setCity(e.target.value)} />
      </Field>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={createSchool.isPending}>
          {createSchool.isPending ? "Adding…" : "Add & continue"}
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

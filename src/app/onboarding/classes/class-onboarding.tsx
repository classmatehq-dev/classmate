"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ClassFinder, JoinedBadges } from "@/components/class-finder";
import { Button } from "@/components/ui";
import { useCompleteOnboarding } from "@/lib/api/hooks";
import type { ClassDto } from "@/lib/contracts/classes";
import { OnboardingShell } from "../onboarding-shell";

export function ClassOnboarding({ schoolId }: { schoolId: string }) {
  const router = useRouter();
  const complete = useCompleteOnboarding();
  const [joined, setJoined] = useState<Record<string, ClassDto>>({});

  const joinedList = Object.values(joined);

  async function finish() {
    await complete.mutateAsync();
    router.push("/home");
  }

  return (
    <OnboardingShell
      step={2}
      title="Add your classes."
      subtitle="Join the rooms where your questions can find an answer."
    >
      <JoinedBadges classes={joinedList} />

      <ClassFinder
        schoolId={schoolId}
        onJoined={(klass) => setJoined((j) => ({ ...j, [klass.id]: klass }))}
      />

      <div className="mt-8">
        <Button onClick={finish} disabled={complete.isPending} className="w-full">
          {complete.isPending
            ? "Finishing…"
            : joinedList.length === 0
              ? "Skip for now"
              : "I'm done"}
        </Button>
      </div>
    </OnboardingShell>
  );
}

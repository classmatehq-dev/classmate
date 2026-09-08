"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ClassFinder, JoinedBadges } from "@/components/class-finder";
import { Button } from "@/components/ui";
import type { ClassDto } from "@/lib/contracts/classes";

export function AddClassView({ schoolId }: { schoolId: string }) {
  const router = useRouter();
  const [joined, setJoined] = useState<Record<string, ClassDto>>({});
  const joinedList = Object.values(joined);
  const last = joinedList[joinedList.length - 1];

  return (
    <div className="px-4 py-4 md:px-0">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/home" className="text-sm font-semibold text-brand-blue">
          ← Home
        </Link>
        <h1 className="text-xl font-extrabold text-navy">Add a class</h1>
      </div>

      <JoinedBadges classes={joinedList} />

      <ClassFinder
        schoolId={schoolId}
        onJoined={(klass) => setJoined((j) => ({ ...j, [klass.id]: klass }))}
      />

      {last && (
        <div className="mt-6 flex gap-2">
          <Button onClick={() => router.push(`/class/${last.id}`)}>
            Go to {last.name}
          </Button>
          <Button variant="secondary" onClick={() => router.push("/home")}>
            Done
          </Button>
        </div>
      )}
    </div>
  );
}

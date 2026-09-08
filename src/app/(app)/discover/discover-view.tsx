"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  Avatar,
  Card,
  EmptyState,
  Input,
  Skeleton,
} from "@/components/ui";
import { useDiscover } from "@/lib/api/hooks";

const GRADE_LABEL: Record<string, string> = {
  middle_school: "Middle school",
  high_school: "High school",
  college: "College",
};

export function DiscoverView({ initialQuery }: { initialQuery: string }) {
  const [input, setInput] = useState(initialQuery);
  const [q, setQ] = useState(initialQuery);

  // debounce
  useEffect(() => {
    const t = setTimeout(() => setQ(input.trim()), 300);
    return () => clearTimeout(t);
  }, [input]);

  const result = useDiscover(q);
  const data = result.data;

  return (
    <div className="animate-rise px-4 py-4 md:px-0">
      <h1 className="text-xl font-extrabold text-navy">Discover</h1>
      <p className="mt-1 text-sm text-muted">
        Find classes and students across Classmate.
      </p>

      <Input
        className="mt-3"
        placeholder="Search classes, teachers, or students"
        aria-label="Search"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        autoFocus
      />

      {result.isLoading && !data ? (
        <div className="mt-6 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-card" />
          ))}
        </div>
      ) : (
        <>
          <Section title={q ? "Classes" : "Popular classes"}>
            {data && data.classes.length > 0 ? (
              data.classes.map((c) => (
                <Link key={c.id} href={`/class/${c.id}`}>
                  <Card interactive>
                    <p className="font-bold text-navy">{c.name}</p>
                    <p className="text-sm text-muted">
                      {c.teacherName} · {c.schoolName}, {c.state}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-brand-blue">
                      {c.memberCount}{" "}
                      {c.memberCount === 1 ? "member" : "members"}
                    </p>
                  </Card>
                </Link>
              ))
            ) : (
              <p className="px-1 py-3 text-sm text-muted">
                No classes match “{q}”.
              </p>
            )}
          </Section>

          <Section title={q ? "Students" : "Top contributors"}>
            {data && data.students.length > 0 ? (
              data.students.map((s) => (
                <Link key={s.id} href={`/u/${s.username}`}>
                  <Card interactive className="flex items-center gap-3">
                    <Avatar username={s.username} src={s.avatarUrl} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-navy">
                        @{s.username}
                      </p>
                      {s.gradeLevel && (
                        <p className="text-xs text-muted">
                          {GRADE_LABEL[s.gradeLevel] ?? s.gradeLevel}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-sm font-bold text-brand-blue">
                      {s.helpfulReceived}{" "}
                      <span className="font-medium text-muted">Helpful</span>
                    </span>
                  </Card>
                </Link>
              ))
            ) : (
              <p className="px-1 py-3 text-sm text-muted">
                No students match “{q}”.
              </p>
            )}
          </Section>

          {q &&
            data &&
            data.classes.length === 0 &&
            data.students.length === 0 && (
              <div className="mt-6">
                <EmptyState
                  icon="🔍"
                  title={`Nothing found for “${q}”`}
                  description="Try a different spelling, a teacher's name, or a school."
                />
              </div>
            )}
        </>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 flex items-center gap-2 font-extrabold text-navy">
        <span className="h-4 w-1.5 rounded-pill bg-brand-blue" />
        {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

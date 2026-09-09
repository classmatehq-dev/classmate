"use client";

import { useState } from "react";

import { Badge, Button, Card, Field, Input, Spinner } from "@/components/ui";
import { useCreateClass, useJoinClass, useListClasses } from "@/lib/api/hooks";
import type { ClassDto } from "@/lib/contracts/classes";

/**
 * Shared "search / join / create a class" UI, used both in onboarding step 2
 * and on /classes/add.
 */
export function ClassFinder({
  schoolId,
  onJoined,
}: {
  schoolId: string;
  onJoined?: (klass: ClassDto) => void;
}) {
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());

  const classes = useListClasses({ schoolId, q });
  const joinClass = useJoinClass();

  async function join(klass: ClassDto) {
    await joinClass.mutateAsync(klass.id);
    setJoinedIds((s) => new Set(s).add(klass.id));
    onJoined?.(klass);
  }

  return (
    <div>
      <Field label="Find a class">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search classes or teachers"
        />
      </Field>

      <div className="mt-3 space-y-2">
        {classes.isLoading && (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        )}

        {classes.data?.map((klass) => {
          const isJoined = joinedIds.has(klass.id);
          return (
            <Card
              key={klass.id}
              className="flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-navy">
                  {klass.name}
                  {klass.teacher && (
                    <span className="font-normal text-muted">
                      {" "}
                      · {klass.teacher.displayName}
                    </span>
                  )}
                </p>
                <p className="truncate text-sm text-muted">
                  {klass.teacher
                    ? "Teacher section"
                    : "Open to everyone taking this subject"}
                  {klass.courseLevel && ` · ${klass.courseLevel}`}
                </p>
                <p className="text-xs text-muted">
                  {klass.memberCount}{" "}
                  {klass.memberCount === 1 ? "member" : "members"}
                </p>
              </div>
              <Button
                size="sm"
                variant={isJoined ? "secondary" : "primary"}
                disabled={isJoined || joinClass.isPending}
                onClick={() => join(klass)}
              >
                {isJoined ? "Joined" : "Join"}
              </Button>
            </Card>
          );
        })}

        {classes.data && classes.data.length === 0 && (
          <p className="py-4 text-center text-sm text-muted">
            No classes match. Create one below.
          </p>
        )}
      </div>

      {creating ? (
        <CreateClassForm
          schoolId={schoolId}
          onCancel={() => setCreating(false)}
          onCreated={(klass) => {
            setJoinedIds((s) => new Set(s).add(klass.id));
            setCreating(false);
            onJoined?.(klass);
          }}
        />
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="mt-3 text-sm font-semibold text-brand-blue"
        >
          + Create a class
        </button>
      )}
    </div>
  );
}

export function JoinedBadges({ classes }: { classes: ClassDto[] }) {
  if (classes.length === 0) return null;
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {classes.map((k) => (
        <Badge key={k.id} tone="blue">
          ✓ {k.name}
          {k.teacher ? ` · ${k.teacher.displayName}` : ""}
        </Badge>
      ))}
    </div>
  );
}

function CreateClassForm({
  schoolId,
  onCancel,
  onCreated,
}: {
  schoolId: string;
  onCancel: () => void;
  onCreated: (klass: ClassDto) => void;
}) {
  const createClass = useCreateClass();
  const [name, setName] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [courseLevel, setCourseLevel] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await createClass.mutateAsync({
        schoolId,
        name: name.trim(),
        teacherName: teacherName.trim() || undefined,
        courseLevel: courseLevel.trim() || undefined,
      });
      onCreated(res.class);
    } catch {
      setError("We couldn't create that class. Check the details and try again.");
    }
  }

  return (
    <form
      onSubmit={submit}
      className="mt-4 space-y-3 rounded-card border border-border bg-surface p-4"
    >
      <p className="text-sm font-semibold text-navy">Create a class</p>
      <Field label="Class or subject">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Biology"
          required
          minLength={2}
        />
      </Field>
      <Field
        label="Teacher (optional)"
        hint="Leave blank to make it open to everyone taking this subject."
      >
        <Input
          value={teacherName}
          onChange={(e) => setTeacherName(e.target.value)}
          placeholder="e.g. Mrs. Smith"
        />
      </Field>
      <Field label="Course level (optional)">
        <Input
          value={courseLevel}
          onChange={(e) => setCourseLevel(e.target.value)}
          placeholder="11th Grade"
        />
      </Field>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={createClass.isPending}>
          {createClass.isPending ? "Creating…" : "Create & join"}
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

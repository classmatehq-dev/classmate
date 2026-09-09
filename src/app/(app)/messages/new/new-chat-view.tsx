"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, cx, Field, Input } from "@/components/ui";
import { ApiClientError } from "@/lib/api/client";
import { useCreateGroup, useStartDirect } from "@/lib/api/hooks";

type Mode = "direct" | "group";

export function NewChatView() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("direct");

  const startDirect = useStartDirect();
  const createGroup = useCreateGroup();

  const [username, setUsername] = useState("");
  const [groupName, setGroupName] = useState("");
  const [people, setPeople] = useState<string[]>([]);
  const [personInput, setPersonInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const pending = startDirect.isPending || createGroup.isPending;

  function splitNames(raw: string): string[] {
    return raw
      .split(/[,\s]+/)
      .map((s) => s.trim().replace(/^@/, ""))
      .filter(Boolean);
  }

  function addPerson() {
    const names = splitNames(personInput);
    if (names.length > 0) {
      setPeople([...new Set([...people, ...names])]);
    }
    setPersonInput("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (mode === "direct") {
        const convo = await startDirect.mutateAsync({ username });
        router.push(`/messages/${convo.id}`);
      } else {
        const names = [...new Set([...people, ...splitNames(personInput)])];
        const convo = await createGroup.mutateAsync({
          title: groupName,
          usernames: names,
        });
        router.push(`/messages/${convo.id}`);
      }
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Something went wrong. Please try again.",
      );
    }
  }

  return (
    <div className="animate-rise px-4 py-4 md:px-0">
      <Link
        href="/messages"
        className="text-sm font-semibold text-brand-blue hover:underline"
      >
        ← Messages
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold text-navy">New message</h1>

      <div className="mt-4 flex gap-1 rounded-pill bg-surface p-1 shadow-card">
        {(["direct", "group"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={cx(
              "flex-1 rounded-pill px-3 py-2 text-sm font-bold transition-colors",
              mode === m
                ? "bg-brand-blue text-white shadow-blue-sm"
                : "text-muted hover:text-navy",
            )}
          >
            {m === "direct" ? "One person" : "Group"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-5 space-y-4">
        {mode === "direct" ? (
          <Field label="Their username">
            <Input
              autoFocus
              placeholder="@username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </Field>
        ) : (
          <>
            <Field label="Group name">
              <Input
                autoFocus
                placeholder="e.g. Bio study group"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </Field>

            <Field label="Add people by username">
              <div className="flex gap-2">
                <Input
                  placeholder="@username"
                  value={personInput}
                  onChange={(e) => setPersonInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addPerson();
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={addPerson}
                >
                  Add
                </Button>
              </div>
            </Field>

            {people.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {people.map((p) => (
                  <span
                    key={p}
                    className="inline-flex items-center gap-1 rounded-pill bg-light-blue px-3 py-1 text-sm font-semibold text-brand-blue"
                  >
                    @{p}
                    <button
                      type="button"
                      onClick={() =>
                        setPeople(people.filter((x) => x !== p))
                      }
                      aria-label={`Remove ${p}`}
                      className="text-brand-blue/70 hover:text-brand-blue"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={pending}>
          {pending
            ? "Starting…"
            : mode === "direct"
              ? "Start chat"
              : "Create group"}
        </Button>
      </form>
    </div>
  );
}

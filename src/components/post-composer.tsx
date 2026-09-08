"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, cx, Field, Select, Textarea } from "@/components/ui";
import { ApiClientError } from "@/lib/api/client";
import { useCreatePost, useMyClasses } from "@/lib/api/hooks";
import type { PostType } from "@/lib/contracts/common";

export function PostComposer({
  fixedClassId,
  onCreated,
  compact,
}: {
  fixedClassId?: string;
  onCreated?: (postId: string) => void;
  compact?: boolean;
}) {
  const router = useRouter();
  const myClasses = useMyClasses();
  const [classId, setClassId] = useState(fixedClassId ?? "");
  const [type, setType] = useState<PostType>("post");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  const targetClassId = fixedClassId ?? classId;
  const createPost = useCreatePost(targetClassId);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!targetClassId) {
      setError("Choose a class first.");
      return;
    }
    try {
      const post = await createPost.mutateAsync({
        body: body.trim(),
        type,
        visibility: "class",
      });
      setBody("");
      if (onCreated) onCreated(post.id);
      else router.push(`/post/${post.id}`);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Something went wrong. Please try again.",
      );
    }
  }

  return (
    <form onSubmit={submit} className={cx(!compact && "space-y-4")}>
      {!fixedClassId && (
        <Field label="Class">
          <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
            <option value="">Choose a class…</option>
            {myClasses.data?.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name} · {k.teacherName}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <div className={cx("flex gap-2", compact ? "mb-2" : "")}>
        {(["post", "question"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={cx(
              "rounded-pill px-3 py-1 text-sm font-semibold capitalize",
              type === t
                ? "bg-brand-blue text-white"
                : "border border-border text-navy",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={
          type === "question"
            ? "What do you want to ask your class?"
            : "Share notes, a study guide, or something useful…"
        }
        required
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button
        type="submit"
        disabled={createPost.isPending || body.trim().length === 0}
        className={compact ? "mt-2" : undefined}
      >
        {createPost.isPending ? "Posting…" : "Post"}
      </Button>
    </form>
  );
}

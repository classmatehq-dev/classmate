"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Avatar, Badge, cx } from "@/components/ui";
import { api, ApiClientError } from "@/lib/api/client";
import type { FeedItemDto } from "@/lib/contracts/feed";
import { relativeTime } from "@/lib/time";

export type FeedPostData = FeedItemDto;

export function FeedPost({
  post,
  onChanged,
}: {
  post: FeedPostData;
  onChanged?: () => void;
}) {
  const router = useRouter();
  const [helpful, setHelpful] = useState(post.viewerHasMarkedHelpful);
  const [count, setCount] = useState(post.helpfulCount);
  const [pending, setPending] = useState(false);

  async function toggleHelpful() {
    if (pending) return;
    setPending(true);
    const next = !helpful;
    setHelpful(next);
    setCount((c) => c + (next ? 1 : -1));
    try {
      const res = await api<{ marked: boolean; count: number }>(
        "/api/helpful",
        { method: "POST", body: { targetType: "post", targetId: post.id } },
      );
      setHelpful(res.marked);
      setCount(res.count);
      onChanged?.();
    } catch (err) {
      // revert
      setHelpful(!next);
      setCount((c) => c - (next ? 1 : -1));
      if (err instanceof ApiClientError && err.status === 401) {
        router.push("/login");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <article className="border-b border-border bg-surface px-4 py-4 md:rounded-card md:border md:mb-3">
      <div className="flex items-center gap-2.5">
        <Avatar username={post.author.username} src={post.author.avatarUrl} size={36} />
        <div className="min-w-0 text-sm">
          <span className="font-semibold text-navy">
            @{post.author.username}
          </span>
          <div className="text-muted">
            <Link href={`/class/${post.class.id}`} className="hover:underline">
              {post.class.name} · {post.class.teacherName}
            </Link>
            <span> · {relativeTime(post.createdAt)}</span>
          </div>
        </div>
        {post.type === "question" && (
          <span className="ml-auto">
            <Badge tone="yellow">Question</Badge>
          </span>
        )}
      </div>

      <Link href={`/post/${post.id}`} className="mt-3 block">
        <p className="whitespace-pre-wrap text-[15px] leading-6 text-navy">
          {post.body}
        </p>
      </Link>

      <div className="mt-3 flex items-center gap-5 text-sm">
        <button
          onClick={toggleHelpful}
          disabled={pending}
          className={cx(
            "inline-flex items-center gap-1.5 rounded-pill px-2 py-1 font-semibold transition-colors",
            helpful
              ? "bg-light-blue text-brand-blue"
              : "text-muted hover:bg-light-blue/60",
          )}
          aria-pressed={helpful}
        >
          <span aria-hidden>👍</span> {count}
          <span className="hidden sm:inline">Helpful</span>
        </button>

        <Link
          href={`/post/${post.id}`}
          className="inline-flex items-center gap-1.5 text-muted hover:text-navy"
        >
          <span aria-hidden>💬</span> {post.commentCount}
        </Link>
      </div>
    </article>
  );
}

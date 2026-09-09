"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Avatar, Badge, cx } from "@/components/ui";
import { api, ApiClientError } from "@/lib/api/client";
import { classColor } from "@/lib/class-color";
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
  const c = classColor(post.class.id);

  async function toggleHelpful() {
    if (pending) return;
    setPending(true);
    const next = !helpful;
    setHelpful(next);
    setCount((n) => n + (next ? 1 : -1));
    try {
      const res = await api<{ marked: boolean; count: number }>("/api/helpful", {
        method: "POST",
        body: { targetType: "post", targetId: post.id },
      });
      setHelpful(res.marked);
      setCount(res.count);
      onChanged?.();
    } catch (err) {
      setHelpful(!next);
      setCount((n) => n - (next ? 1 : -1));
      if (err instanceof ApiClientError && err.status === 401) {
        router.push("/login");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <article className="rounded-card border border-border bg-surface p-4 shadow-card transition-shadow hover:shadow-blue-sm max-md:mx-3">
      <div className="flex items-center gap-2.5">
        <Avatar
          username={post.author.username}
          src={post.author.avatarUrl}
          size={38}
        />
        <div className="min-w-0 text-sm">
          <Link
            href={`/u/${post.author.username}`}
            className="font-bold text-navy hover:underline"
          >
            @{post.author.username}
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[13px] text-muted">
            <Link
              href={`/class/${post.class.id}`}
              className="inline-flex items-center rounded-pill px-2 py-0.5 font-bold"
              style={{ background: c.bg, color: c.text }}
            >
              {post.class.name}
            </Link>
            {post.class.teacherName && (
              <>
                <span className="font-medium">{post.class.teacherName}</span>
                <span aria-hidden>·</span>
              </>
            )}
            <span>{relativeTime(post.createdAt)}</span>
          </div>
        </div>
        {post.type === "question" && (
          <span className="ml-auto self-start">
            <Badge tone="yellow">Question</Badge>
          </span>
        )}
      </div>

      <Link href={`/post/${post.id}`} className="mt-3 block">
        <p className="whitespace-pre-wrap text-base leading-7 text-navy">
          {post.body}
        </p>
      </Link>

      <div className="mt-3 flex items-center gap-2 text-sm">
        <button
          onClick={toggleHelpful}
          disabled={pending}
          className={cx(
            "inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 font-bold transition-colors",
            helpful
              ? "bg-brand-blue text-white"
              : "bg-light-blue/70 text-brand-blue hover:bg-light-blue",
          )}
          aria-pressed={helpful}
        >
          <span aria-hidden>👍</span> {count}
          <span className="hidden sm:inline">Likes</span>
        </button>

        <Link
          href={`/post/${post.id}`}
          className="inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 font-semibold text-muted transition-colors hover:bg-background hover:text-navy"
        >
          <span aria-hidden>💬</span> {post.commentCount}
          <span className="hidden sm:inline">
            {post.commentCount === 1 ? "reply" : "replies"}
          </span>
        </Link>
      </div>
    </article>
  );
}

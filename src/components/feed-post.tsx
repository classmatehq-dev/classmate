"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AttachmentList } from "@/components/attachments";
import { Avatar, Badge, cx } from "@/components/ui";
import { api, ApiClientError } from "@/lib/api/client";
import { classColor } from "@/lib/class-color";
import type { FeedItemDto } from "@/lib/contracts/feed";
import { renderBody } from "@/lib/mentions";
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
  const [saved, setSaved] = useState(post.viewerHasSaved);
  const c = classColor(post.class.id);

  async function toggleSave() {
    const next = !saved;
    setSaved(next);
    try {
      const res = await api<{ saved: boolean }>(`/api/posts/${post.id}/save`, {
        method: "POST",
      });
      setSaved(res.saved);
    } catch (err) {
      setSaved(!next);
      if (err instanceof ApiClientError && err.status === 401) {
        router.push("/login");
      }
    }
  }

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
            <Link
              href={`/post/${post.id}`}
              className="hover:text-navy hover:underline"
            >
              {relativeTime(post.createdAt)}
            </Link>
          </div>
        </div>
        {post.type === "question" && (
          <span className="ml-auto self-start">
            <Badge tone="yellow">Question</Badge>
          </span>
        )}
      </div>

      {post.body && (
        <div className="mt-3">
          <p className="whitespace-pre-wrap text-base leading-7 text-navy">
            {renderBody(post.body, post.mentions)}
          </p>
        </div>
      )}

      {post.attachments.length > 0 && (
        <AttachmentList attachments={post.attachments} className="mt-3" />
      )}

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

        <button
          onClick={toggleSave}
          aria-pressed={saved}
          aria-label={saved ? "Remove from saved" : "Save post"}
          className={cx(
            "ml-auto inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 font-semibold transition-colors",
            saved
              ? "text-brand-blue"
              : "text-muted hover:bg-background hover:text-navy",
          )}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill={saved ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
          <span className="hidden sm:inline">{saved ? "Saved" : "Save"}</span>
        </button>
      </div>
    </article>
  );
}

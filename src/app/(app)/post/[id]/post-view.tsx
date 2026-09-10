"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AttachmentList } from "@/components/attachments";
import { CommentThread } from "@/components/comment-thread";
import { ReportButton } from "@/components/report-button";
import { Avatar, Badge, cx, EmptyState, Spinner } from "@/components/ui";
import { api, ApiClientError } from "@/lib/api/client";
import {
  useComments,
  useDeletePost,
  usePost,
} from "@/lib/api/hooks";
import { renderBody } from "@/lib/mentions";
import { relativeTime } from "@/lib/time";

export function PostView({ postId }: { postId: string }) {
  const router = useRouter();
  const post = usePost(postId);
  const comments = useComments(postId);
  const deletePost = useDeletePost();

  const [helpful, setHelpful] = useState(false);
  const [count, setCount] = useState(0);
  const [saved, setSaved] = useState(false);
  const [synced, setSynced] = useState(false);

  if (post.data && !synced) {
    setHelpful(post.data.viewerHasMarkedHelpful);
    setCount(post.data.helpfulCount);
    setSaved(post.data.viewerHasSaved);
    setSynced(true);
  }

  async function toggleSave() {
    if (!post.data) return;
    const next = !saved;
    setSaved(next);
    try {
      const res = await api<{ saved: boolean }>(
        `/api/posts/${postId}/save`,
        { method: "POST" },
      );
      setSaved(res.saved);
    } catch {
      setSaved(!next);
    }
  }

  async function toggleHelpful() {
    const next = !helpful;
    setHelpful(next);
    setCount((c) => c + (next ? 1 : -1));
    try {
      const res = await api<{ marked: boolean; count: number }>("/api/helpful", {
        method: "POST",
        body: { targetType: "post", targetId: postId },
      });
      setHelpful(res.marked);
      setCount(res.count);
    } catch {
      setHelpful(!next);
      setCount((c) => c - (next ? 1 : -1));
    }
  }

  if (post.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (post.error) {
    const status =
      post.error instanceof ApiClientError ? post.error.status : 500;
    return (
      <div className="px-4 py-10 md:px-0">
        <EmptyState
          title={
            status === 403
              ? "You must join this class to see this post."
              : "We couldn't find that post."
          }
          action={
            <Link href="/home" className="font-semibold text-brand-blue">
              Back to Home
            </Link>
          }
        />
      </div>
    );
  }

  const p = post.data!;

  return (
    <div className="animate-rise">
      <div className="px-4 py-3 md:px-0">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 rounded-pill bg-surface px-3 py-1.5 text-sm font-semibold text-brand-blue shadow-card hover:bg-light-blue"
        >
          ← Back
        </button>
      </div>

      <article className="rounded-card border border-border bg-surface p-4 shadow-card max-md:mx-3">
        <div className="flex items-center gap-2.5">
          <Avatar username={p.author.username} src={p.author.avatarUrl} size={42} />
          <div className="text-sm">
            <Link
              href={`/u/${p.author.username}`}
              className="font-bold text-navy hover:underline"
            >
              @{p.author.username}
            </Link>
            <div className="text-xs text-muted">
              <Link
                href={`/class/${p.classId}`}
                className="font-semibold text-brand-blue hover:underline"
              >
                View class
              </Link>
              <span> · {relativeTime(p.createdAt)}</span>
            </div>
          </div>
          {p.type === "question" && (
            <span className="ml-auto">
              <Badge tone="yellow">Question</Badge>
            </span>
          )}
        </div>

        {p.body && (
          <p className="mt-3 whitespace-pre-wrap text-base leading-7 text-navy">
            {renderBody(p.body, p.mentions)}
          </p>
        )}

        {p.attachments.length > 0 && (
          <AttachmentList attachments={p.attachments} className="mt-3" />
        )}

        <div className="mt-4 flex items-center gap-2 text-sm">
          <button
            onClick={toggleHelpful}
            className={cx(
              "inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 font-bold transition-colors",
              helpful
                ? "bg-brand-blue text-white"
                : "bg-light-blue/70 text-brand-blue hover:bg-light-blue",
            )}
          >
            👍 {count} {count === 1 ? "Like" : "Likes"}
          </button>
          <span className="text-muted">
            💬 {p.commentCount}{" "}
            {p.commentCount === 1 ? "reply" : "replies"}
          </span>
          <button
            onClick={toggleSave}
            aria-pressed={saved}
            className={cx(
              "inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 font-semibold transition-colors",
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
            {saved ? "Saved" : "Save"}
          </button>
          {p.isAuthor ? (
            <button
              onClick={async () => {
                if (!confirm("Delete this post?")) return;
                await deletePost.mutateAsync(postId);
                router.push("/home");
              }}
              className="font-semibold text-red-600"
            >
              Delete
            </button>
          ) : (
            <ReportButton targetType="post" targetId={postId} />
          )}
        </div>
      </article>

      <section className="mt-4">
        <h2 className="px-4 font-bold text-navy md:px-0">Comments</h2>
        {comments.isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <CommentThread
            postId={postId}
            classId={p.classId}
            comments={comments.data ?? []}
            onChanged={() => {
              comments.refetch();
              post.refetch();
            }}
          />
        )}
      </section>
    </div>
  );
}

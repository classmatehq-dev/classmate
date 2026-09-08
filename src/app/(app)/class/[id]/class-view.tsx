"use client";

import Link from "next/link";
import { useState } from "react";

import { FeedPost } from "@/components/feed-post";
import { PostComposer } from "@/components/post-composer";
import {
  Button,
  Card,
  cx,
  EmptyState,
  Spinner,
} from "@/components/ui";
import { ApiClientError } from "@/lib/api/client";
import {
  useClass,
  useClassPosts,
  useJoinClass,
} from "@/lib/api/hooks";

const TABS = ["Posts", "Questions", "Study Sets", "Resources"] as const;
type Tab = (typeof TABS)[number];

export function ClassView({ classId }: { classId: string }) {
  const klass = useClass(classId);
  const posts = useClassPosts(classId);
  const joinClass = useJoinClass();
  const [tab, setTab] = useState<Tab>("Posts");
  const [composerOpen, setComposerOpen] = useState(false);

  const notMember =
    posts.error instanceof ApiClientError && posts.error.status === 403;

  if (klass.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (klass.error instanceof ApiClientError && klass.error.status === 404) {
    return (
      <div className="px-4 py-10 md:px-0">
        <EmptyState
          title="We couldn't find that class."
          action={
            <Link href="/home" className="font-semibold text-brand-blue">
              Back to Home
            </Link>
          }
        />
      </div>
    );
  }

  const c = klass.data!;
  const filteredPosts =
    tab === "Questions"
      ? posts.data?.items.filter((p) => p.type === "question")
      : posts.data?.items;

  return (
    <div>
      {/* Header */}
      <header className="border-b border-border bg-surface px-4 py-5 md:rounded-card md:border">
        <div className="flex items-center gap-2 text-sm text-brand-blue">
          <Link href="/home" className="font-semibold">
            ← Home
          </Link>
        </div>
        <h1 className="mt-2 text-2xl font-extrabold text-navy">{c.name}</h1>
        <p className="mt-1 text-muted">
          {c.teacher.displayName} · {c.school.name}
          {c.courseLevel && ` · ${c.courseLevel}`}
          {c.period && ` · ${c.period}`}
        </p>
        <p className="mt-1 text-sm text-muted">
          {c.memberCount} {c.memberCount === 1 ? "member" : "members"}
        </p>
      </header>

      {/* Tabs */}
      <div className="scrollbar-none mt-3 flex gap-1 overflow-x-auto px-4 md:px-0">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cx(
              "shrink-0 rounded-pill px-3 py-1.5 text-sm font-semibold transition-colors",
              tab === t
                ? "bg-brand-blue text-white"
                : "text-muted hover:bg-light-blue/60",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-3">
        {notMember ? (
          <div className="px-4 md:px-0">
            <Card className="text-center">
              <p className="font-semibold text-navy">
                Join this class to see posts
              </p>
              <p className="mt-1 text-sm text-muted">
                Only members can read and post in {c.name}.
              </p>
              <Button
                className="mt-4"
                disabled={joinClass.isPending}
                onClick={async () => {
                  await joinClass.mutateAsync(classId);
                  posts.refetch();
                  klass.refetch();
                }}
              >
                {joinClass.isPending ? "Joining…" : "Join class"}
              </Button>
            </Card>
          </div>
        ) : tab === "Study Sets" || tab === "Resources" ? (
          <div className="px-4 md:px-0">
            <EmptyState
              title={`${tab} are coming soon`}
              description="This is where shared study sets and resources will live."
            />
          </div>
        ) : (
          <>
            <div className="px-4 md:px-0">
              {composerOpen ? (
                <Card className="mb-3">
                  <PostComposer
                    fixedClassId={classId}
                    onCreated={() => {
                      setComposerOpen(false);
                      posts.refetch();
                    }}
                  />
                </Card>
              ) : (
                <Button
                  className="mb-3 w-full"
                  onClick={() => setComposerOpen(true)}
                >
                  + New post
                </Button>
              )}
            </div>

            {posts.isLoading ? (
              <div className="flex justify-center py-10">
                <Spinner />
              </div>
            ) : filteredPosts && filteredPosts.length > 0 ? (
              filteredPosts.map((p) => (
                <FeedPost
                  key={p.id}
                  post={{
                    ...p,
                    class: {
                      id: c.id,
                      name: c.name,
                      teacherName: c.teacher.displayName,
                    },
                  }}
                  onChanged={() => posts.refetch()}
                />
              ))
            ) : (
              <div className="px-4 md:px-0">
                <EmptyState
                  title="No posts yet."
                  description="Be the first person to share something with your class."
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

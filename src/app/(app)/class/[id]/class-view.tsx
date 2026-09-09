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
  FeedSkeleton,
  Spinner,
} from "@/components/ui";
import { ApiClientError } from "@/lib/api/client";
import {
  useClass,
  useClassPosts,
  useClassSections,
  useJoinClass,
} from "@/lib/api/hooks";
import { classColor } from "@/lib/class-color";
import type { ClassDto } from "@/lib/contracts/classes";

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
  const cc = classColor(c.id);
  const filteredPosts =
    tab === "Questions"
      ? posts.data?.items.filter((p) => p.type === "question")
      : posts.data?.items;

  return (
    <div className="animate-rise">
      {/* Header */}
      <header className="relative overflow-hidden px-4 pt-4 md:px-0">
        <div
          className="relative rounded-card p-5 text-white shadow-blue-sm"
          style={{
            backgroundImage: `linear-gradient(135deg, ${cc.text}, ${cc.accent})`,
          }}
        >
          <div className="bg-hero-dots pointer-events-none absolute inset-0 opacity-50" />
          <div className="relative">
            <Link
              href="/home"
              className="text-sm font-semibold text-white/80 hover:text-white"
            >
              ← Home
            </Link>
            <h1 className="mt-2 text-2xl font-extrabold">
              {c.name}
              {c.teacher && (
                <span className="font-semibold text-white/80">
                  {" "}
                  · {c.teacher.displayName}
                </span>
              )}
            </h1>
            <p className="mt-1 text-sm text-white/85">
              {c.teacher
                ? `${c.teacher.displayName}'s section`
                : "Open to everyone taking this subject"}{" "}
              · {c.school.name}
              {c.courseLevel && ` · ${c.courseLevel}`}
            </p>
            <span className="mt-3 inline-flex items-center rounded-pill bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
              {c.memberCount} {c.memberCount === 1 ? "member" : "members"}
            </span>
          </div>
        </div>

        <SectionSwitcher classId={classId} current={c} />
      </header>

      {/* Tabs */}
      <div className="scrollbar-none mt-4 flex gap-1 overflow-x-auto px-4 md:px-0">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cx(
              "shrink-0 rounded-pill px-3.5 py-1.5 text-sm font-bold transition-colors",
              tab === t
                ? "bg-brand-blue text-white shadow-blue-sm"
                : "bg-surface text-muted hover:bg-light-blue/60",
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
              <FeedSkeleton />
            ) : filteredPosts && filteredPosts.length > 0 ? (
              filteredPosts.map((p) => (
                <FeedPost
                  key={p.id}
                  post={{
                    ...p,
                    class: {
                      id: c.id,
                      name: c.name,
                      teacherName: c.teacher?.displayName ?? null,
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

/** lets you jump between the general room and each teacher's section */
function SectionSwitcher({
  classId,
  current,
}: {
  classId: string;
  current: ClassDto;
}) {
  const sections = useClassSections(classId);
  const list = sections.data ?? [];
  if (list.length === 0) return null;

  const chip =
    "shrink-0 rounded-pill px-3 py-1 text-xs font-bold transition-colors";

  return (
    <div className="scrollbar-none mt-2 flex items-center gap-1.5 overflow-x-auto px-4 md:px-0">
      <span className="shrink-0 text-xs font-semibold text-muted">
        Sections:
      </span>
      <span className={`${chip} bg-brand-blue text-white`}>
        {current.teacher ? current.teacher.displayName : "Everyone"}
      </span>
      {list.map((s) => (
        <Link
          key={s.id}
          href={`/class/${s.id}`}
          className={`${chip} bg-surface text-navy hover:bg-light-blue`}
        >
          {s.teacher ? s.teacher.displayName : "Everyone"}
        </Link>
      ))}
    </div>
  );
}

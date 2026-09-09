"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { FeedPost } from "@/components/feed-post";
import { NotificationBell } from "@/components/notification-bell";
import {
  ButtonLink,
  Card,
  EmptyState,
  FeedSkeleton,
  Skeleton,
} from "@/components/ui";
import { useHomeFeed, useMyClasses } from "@/lib/api/hooks";
import { classColor } from "@/lib/class-color";
import type { FeedItemDto } from "@/lib/contracts/feed";
import type { MyClassDto } from "@/lib/contracts/me";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function hotScore(p: FeedItemDto) {
  return p.helpfulCount * 3 + p.commentCount * 2;
}

function SectionHeading({
  children,
  action,
  accent = "blue",
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
  accent?: "blue" | "yellow";
}) {
  return (
    <div className="mb-3 flex items-center justify-between px-4 md:px-0">
      <h2 className="flex items-center gap-2 text-lg font-extrabold text-navy">
        <span
          className={`h-4 w-1.5 rounded-pill ${
            accent === "yellow" ? "bg-accent-yellow" : "bg-brand-blue"
          }`}
        />
        {children}
      </h2>
      {action}
    </div>
  );
}

export function HomeView({ username }: { username: string }) {
  const router = useRouter();
  const myClasses = useMyClasses();
  const feed = useHomeFeed();
  const [search, setSearch] = useState("");

  const classes = myClasses.data ?? [];
  const totalNew = classes.reduce((n, c) => n + c.newPostCount, 0);

  const hot =
    feed.data?.items
      .filter((p) => hotScore(p) > 0)
      .sort((a, b) => hotScore(b) - hotScore(a))
      .slice(0, 3) ?? [];

  return (
    <div className="animate-rise pb-4 md:px-2">
      {/* ---- Hero ---- */}
      <header className="px-3 pt-3 md:px-0">
        <div className="bg-hero relative overflow-hidden rounded-card p-5 text-white shadow-blue">
          <div className="bg-hero-dots pointer-events-none absolute inset-0 opacity-70" />
          {/* warm accent glow */}
          <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-accent-yellow/25 blur-2xl" />
          <div className="relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[15px] font-semibold text-accent-yellow">
                  {greeting()},
                </p>
                <h1 className="text-3xl font-extrabold tracking-tight">
                  {username}
                </h1>
              </div>
              <span className="rounded-full bg-white/15 p-1 backdrop-blur">
                <NotificationBell />
              </span>
            </div>

            <p className="mt-1.5 text-[15px] font-medium text-white/95">
              {classes.length === 0
                ? "Join a class to start learning with your classmates."
                : totalNew > 0
                  ? `${totalNew} new post${totalNew === 1 ? "" : "s"} across your classes`
                  : "You're all caught up in your classes."}
            </p>

            <form
              className="mt-4"
              onSubmit={(e) => {
                e.preventDefault();
                router.push(
                  search.trim()
                    ? `/discover?q=${encodeURIComponent(search.trim())}`
                    : "/discover",
                );
              }}
            >
              <div className="flex items-center gap-2 rounded-pill bg-white px-4 py-2.5 shadow-card">
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 text-muted"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  className="w-full bg-transparent text-[15px] text-navy placeholder:text-muted focus:outline-none"
                  placeholder="Search classes, students, study sets"
                  aria-label="Search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </form>
          </div>
        </div>
      </header>

      {/* ---- My Classes ---- */}
      <section className="mt-6">
        <SectionHeading
          action={
            classes.length > 0 ? (
              <Link
                href="/classes/add"
                className="text-sm font-semibold text-brand-blue hover:underline"
              >
                + Add
              </Link>
            ) : undefined
          }
        >
          My Classes
        </SectionHeading>

        {myClasses.isLoading ? (
          <div className="flex gap-3 px-4 md:px-0">
            <Skeleton className="h-28 w-40 shrink-0 rounded-card" />
            <Skeleton className="h-28 w-40 shrink-0 rounded-card" />
          </div>
        ) : classes.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto px-4 pb-2 md:px-0 lg:flex-wrap lg:overflow-visible">
            {classes.map((k) => (
              <ClassCard key={k.id} klass={k} />
            ))}
            <Link
              href="/classes/add"
              className="flex w-40 shrink-0 flex-col items-center justify-center gap-1 rounded-card border-2 border-dashed border-light-blue-200 bg-sky text-sm font-semibold text-brand-blue transition-colors hover:border-brand-blue hover:bg-light-blue"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-blue text-lg text-white">
                +
              </span>
              Add class
            </Link>
          </div>
        ) : (
          <div className="px-4 md:px-0">
            <EmptyState
              icon="🎒"
              title="You haven't joined a class yet."
              description="Find your class and start sharing notes and questions."
              action={
                <ButtonLink href="/classes/add" size="sm">
                  Add a class
                </ButtonLink>
              }
            />
          </div>
        )}
      </section>

      {/* ---- Hot Today (mobile/tablet only — desktop shows it in the rail) ---- */}
      {hot.length > 0 && (
        <section className="mt-8 lg:hidden">
          <SectionHeading accent="yellow">Hot Today</SectionHeading>
          <div className="space-y-2 px-4 md:px-0">
            {hot.map((p, i) => (
              <Link key={p.id} href={`/post/${p.id}`}>
                <Card interactive className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-yellow/20 text-sm font-extrabold text-navy">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-[15px] font-medium text-navy">
                      {p.body}
                    </p>
                    <p className="mt-1 text-[13px] text-muted">
                      {p.class.name} · 👍 {p.helpfulCount} · 💬 {p.commentCount}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ---- Latest From Your Classes ---- */}
      <section className="mt-8">
        <SectionHeading>Latest From Your Classes</SectionHeading>

        <div>
          {feed.isLoading ? (
            <FeedSkeleton />
          ) : feed.data && feed.data.items.length > 0 ? (
            <div className="space-y-3 md:px-0">
              {feed.data.items.map((post) => (
                <FeedPost
                  key={post.id}
                  post={post}
                  onChanged={() => feed.refetch()}
                />
              ))}
            </div>
          ) : (
            <div className="px-4 md:px-0">
              <EmptyState
                icon="📝"
                title="No posts yet."
                description="Be the first person to share something with your class."
                action={
                  <ButtonLink href="/create" size="sm">
                    Create a post
                  </ButtonLink>
                }
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function ClassCard({ klass }: { klass: MyClassDto }) {
  const c = classColor(klass.id);
  return (
    <Link href={`/class/${klass.id}`} className="w-40 shrink-0">
      <div
        className="flex h-full flex-col overflow-hidden rounded-card border border-border bg-surface shadow-card transition-all hover:-translate-y-0.5 hover:shadow-blue-sm"
        style={{ borderColor: `${c.accent}22` }}
      >
        <div
          className="flex h-16 items-end p-3"
          style={{ background: c.bg }}
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-extrabold text-white"
            style={{ background: c.accent }}
          >
            {klass.name.slice(0, 1).toUpperCase()}
          </span>
        </div>
        <div className="flex flex-1 flex-col p-3">
          <p className="line-clamp-1 text-[15px] font-bold text-navy">
            {klass.name}
          </p>
          <p className="line-clamp-1 text-[13px] text-muted">
            {klass.teacherName}
          </p>
          <p
            className="mt-auto pt-2 text-[13px] font-bold"
            style={{ color: klass.newPostCount > 0 ? c.accent : undefined }}
          >
            {klass.newPostCount > 0 ? (
              `${klass.newPostCount} new`
            ) : (
              <span className="text-muted">
                {klass.postCount} {klass.postCount === 1 ? "post" : "posts"}
              </span>
            )}
          </p>
        </div>
      </div>
    </Link>
  );
}

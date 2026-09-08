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
  Input,
  Spinner,
} from "@/components/ui";
import { useHomeFeed, useMyClasses } from "@/lib/api/hooks";
import type { FeedItemDto } from "@/lib/contracts/feed";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function hotScore(p: FeedItemDto) {
  return p.helpfulCount * 3 + p.commentCount * 2;
}

export function HomeView({ username }: { username: string }) {
  const router = useRouter();
  const myClasses = useMyClasses();
  const feed = useHomeFeed();
  const [search, setSearch] = useState("");

  const hot =
    feed.data?.items
      .filter((p) => hotScore(p) > 0)
      .sort((a, b) => hotScore(b) - hotScore(a))
      .slice(0, 3) ?? [];

  return (
    <div className="md:px-2">
      <header className="px-4 pt-4 md:px-0">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-extrabold text-navy">
            {greeting()}, {username}
          </h1>
          <span className="hidden md:block">
            <NotificationBell />
          </span>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            router.push(
              search.trim()
                ? `/discover?q=${encodeURIComponent(search.trim())}`
                : "/discover",
            );
          }}
        >
          <Input
            className="mt-3"
            placeholder="Search classes, students, or study sets"
            aria-label="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
      </header>

      {/* My Classes */}
      <section className="mt-6">
        <div className="flex items-center justify-between px-4 md:px-0">
          <h2 className="font-bold text-navy">My Classes</h2>
          <Link href="/profile" className="text-sm font-semibold text-brand-blue">
            See all
          </Link>
        </div>

        {myClasses.isLoading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : myClasses.data && myClasses.data.length > 0 ? (
          <div className="mt-3 flex gap-3 overflow-x-auto px-4 pb-1 md:px-0">
            {myClasses.data.map((k) => (
              <Link key={k.id} href={`/class/${k.id}`} className="w-44 shrink-0">
                <Card className="h-full transition-colors hover:border-brand-blue">
                  <p className="font-semibold text-navy">{k.name}</p>
                  <p className="text-sm text-muted">{k.teacherName}</p>
                  <p className="mt-2 text-xs font-semibold text-brand-blue">
                    {k.newPostCount > 0
                      ? `${k.newPostCount} new post${k.newPostCount === 1 ? "" : "s"}`
                      : "No new posts"}
                  </p>
                </Card>
              </Link>
            ))}
            <Link
              href="/classes/add"
              className="flex w-44 shrink-0 items-center justify-center rounded-card border border-dashed border-border text-sm font-semibold text-brand-blue hover:bg-light-blue"
            >
              + Add class
            </Link>
          </div>
        ) : (
          <div className="mt-3 px-4 md:px-0">
            <EmptyState
              title="You haven't joined a class yet."
              action={
                <ButtonLink href="/classes/add" size="sm">
                  Add Class
                </ButtonLink>
              }
            />
          </div>
        )}
      </section>

      {/* Hot Today */}
      {hot.length > 0 && (
        <section className="mt-8">
          <h2 className="px-4 font-bold text-navy md:px-0">🔥 Hot Today</h2>
          <div className="mt-3 space-y-2 px-4 md:px-0">
            {hot.map((p) => (
              <Link key={p.id} href={`/post/${p.id}`}>
                <Card className="transition-colors hover:border-brand-blue">
                  <p className="line-clamp-2 text-sm text-navy">{p.body}</p>
                  <p className="mt-1 text-xs text-muted">
                    {p.class.name} · 👍 {p.helpfulCount} · 💬 {p.commentCount}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Latest From Your Classes */}
      <section className="mt-8">
        <h2 className="px-4 font-bold text-navy md:px-0">
          Latest From Your Classes
        </h2>

        <div className="mt-3">
          {feed.isLoading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : feed.data && feed.data.items.length > 0 ? (
            feed.data.items.map((post) => (
              <FeedPost
                key={post.id}
                post={post}
                onChanged={() => feed.refetch()}
              />
            ))
          ) : (
            <div className="px-4 md:px-0">
              <EmptyState
                title="No posts yet."
                description="Be the first person to share something with your class."
                action={
                  <ButtonLink href="/create" size="sm">
                    Create Post
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

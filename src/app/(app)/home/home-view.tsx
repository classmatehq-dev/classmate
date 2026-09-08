"use client";

import Link from "next/link";

import { FeedPost } from "@/components/feed-post";
import { Card, EmptyState, Input, Spinner, ButtonLink } from "@/components/ui";
import { useHomeFeed, useMyClasses } from "@/lib/api/hooks";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function HomeView({ username }: { username: string }) {
  const myClasses = useMyClasses();
  const feed = useHomeFeed();

  return (
    <div className="md:px-2">
      <header className="px-4 pt-4 md:px-0">
        <h1 className="text-xl font-extrabold text-navy">
          {greeting()}, {username}
        </h1>
        <Input
          className="mt-3"
          placeholder="Search classes, students, or study sets"
          aria-label="Search"
        />
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
              <Link
                key={k.id}
                href={`/class/${k.id}`}
                className="w-44 shrink-0"
              >
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
          </div>
        ) : (
          <div className="mt-3 px-4 md:px-0">
            <EmptyState
              title="You haven't joined a class yet."
              action={<ButtonLink href="/classes/add" size="sm">Add Class</ButtonLink>}
            />
          </div>
        )}
      </section>

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

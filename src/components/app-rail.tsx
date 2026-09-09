"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Avatar, Skeleton } from "@/components/ui";
import { useHomeFeed, useLeaderboard } from "@/lib/api/hooks";
import type { FeedItemDto } from "@/lib/contracts/feed";

function hotScore(p: FeedItemDto) {
  return p.helpfulCount * 3 + p.commentCount * 2;
}

/** Desktop-only right rail: quick context that fills the extra width. */
export function AppRail() {
  const pathname = usePathname();
  // Not useful on the leaderboard itself.
  const showLeaderboard = pathname !== "/leaderboard";

  const feed = useHomeFeed();
  const board = useLeaderboard({ enabled: showLeaderboard });

  const hot =
    feed.data?.items
      .filter((p) => hotScore(p) > 0)
      .sort((a, b) => hotScore(b) - hotScore(a))
      .slice(0, 4) ?? [];

  return (
    <aside className="sticky top-4 hidden h-fit w-[290px] shrink-0 space-y-4 py-4 lg:block">
      {/* Hot today */}
      <RailCard title="🔥 Hot Today">
        {feed.isLoading ? (
          <RailSkeleton />
        ) : hot.length > 0 ? (
          <ul className="space-y-3">
            {hot.map((p, i) => (
              <li key={p.id}>
                <Link href={`/post/${p.id}`} className="group block">
                  <p className="line-clamp-2 text-[13px] font-medium leading-snug text-navy group-hover:text-brand-blue">
                    <span className="mr-1 font-extrabold text-accent-yellow-600">
                      {i + 1}.
                    </span>
                    {p.body}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {p.class.name} · 👍 {p.helpfulCount} · 💬 {p.commentCount}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[13px] text-muted">
            Nothing trending yet — be the first to post something useful.
          </p>
        )}
      </RailCard>

      {/* Most helpful */}
      {showLeaderboard && (
        <RailCard
          title="🏅 Most Helpful"
          action={
            <Link
              href="/leaderboard"
              className="text-xs font-semibold text-brand-blue hover:underline"
            >
              See all
            </Link>
          }
        >
          {board.isLoading ? (
            <RailSkeleton />
          ) : board.data && board.data.mostHelpful.length > 0 ? (
            <ul className="space-y-2">
              {board.data.mostHelpful.slice(0, 5).map((row) => (
                <li key={row.userId}>
                  <Link
                    href={`/u/${row.username}`}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span className="w-4 text-center text-xs font-bold text-muted">
                      {row.rank}
                    </span>
                    <Avatar
                      username={row.username}
                      src={row.avatarUrl}
                      size={24}
                    />
                    <span className="min-w-0 flex-1 truncate font-semibold text-navy">
                      @{row.username}
                    </span>
                    <span className="text-xs font-bold text-brand-blue">
                      {row.value}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-muted">
              Rankings appear as students mark each other Helpful.
            </p>
          )}
        </RailCard>
      )}

    </aside>
  );
}

function RailCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-card border border-border bg-surface p-4 shadow-card">
      <div className="mb-2.5 flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-navy">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function RailSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

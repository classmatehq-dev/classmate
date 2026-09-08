"use client";

import Link from "next/link";
import { useState } from "react";

import { Avatar, cx, EmptyState, Skeleton } from "@/components/ui";
import { useLeaderboard } from "@/lib/api/hooks";
import type { LeaderboardEntry } from "@/lib/contracts/leaderboard";

const TABS = [
  { key: "helpful", label: "Most Helpful", unit: "Helpful" },
  { key: "followed", label: "Most Followed", unit: "followers" },
] as const;

export function LeaderboardView() {
  const board = useLeaderboard();
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("helpful");

  const rows =
    tab === "helpful"
      ? board.data?.mostHelpful
      : board.data?.mostFollowed;
  const unit = TABS.find((t) => t.key === tab)!.unit;

  return (
    <div className="animate-rise px-4 py-4 md:px-0">
      <header className="relative overflow-hidden rounded-card bg-hero p-5 text-white shadow-blue-sm">
        <div className="bg-hero-dots absolute inset-0 opacity-50" />
        <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-accent-yellow/25 blur-2xl" />
        <div className="relative">
          <h1 className="text-2xl font-extrabold">Leaderboard</h1>
          <p className="mt-1 text-[15px] text-white/90">
            Students recognised for helping their classmates.
          </p>
        </div>
      </header>

      <div className="mt-4 flex gap-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cx(
              "rounded-pill px-3.5 py-1.5 text-sm font-bold transition-colors",
              tab === t.key
                ? "bg-brand-blue text-white shadow-blue-sm"
                : "bg-surface text-muted hover:bg-light-blue/60",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {board.isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-card" />
          ))
        ) : rows && rows.length > 0 ? (
          rows.map((row) => (
            <Row key={row.userId} row={row} unit={unit} />
          ))
        ) : (
          <EmptyState
            icon="🏅"
            title="No rankings yet"
            description="As students post, comment, and mark each other Helpful, the leaderboard fills in."
          />
        )}
      </div>
    </div>
  );
}

function Row({ row, unit }: { row: LeaderboardEntry; unit: string }) {
  const medal = ["🥇", "🥈", "🥉"][row.rank - 1];
  return (
    <Link
      href={`/u/${row.username}`}
      className={cx(
        "flex items-center gap-3 rounded-card border bg-surface p-3 shadow-card transition-colors hover:border-brand-blue/40",
        row.isViewer ? "border-brand-blue" : "border-border",
      )}
    >
      <span className="w-7 shrink-0 text-center text-lg font-extrabold text-muted">
        {medal ?? row.rank}
      </span>
      <Avatar username={row.username} src={row.avatarUrl} size={36} />
      <span className="min-w-0 flex-1 truncate font-bold text-navy">
        @{row.username}
        {row.isViewer && (
          <span className="ml-1 text-xs font-semibold text-brand-blue">
            (you)
          </span>
        )}
      </span>
      <span className="shrink-0 text-sm font-bold text-brand-blue">
        {row.value}{" "}
        <span className="font-medium text-muted">{unit}</span>
      </span>
    </Link>
  );
}

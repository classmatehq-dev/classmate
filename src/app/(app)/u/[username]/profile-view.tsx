"use client";

import Link from "next/link";
import { useState } from "react";

import { AccountControl } from "@/components/account-control";
import { FeedPost } from "@/components/feed-post";
import { ReportButton } from "@/components/report-button";
import {
  Avatar,
  cx,
  EmptyState,
  FeedSkeleton,
  Spinner,
  Textarea,
} from "@/components/ui";
import {
  useProfile,
  useProfilePosts,
  useToggleFollow,
  useUpdateProfile,
} from "@/lib/api/hooks";

const TABS = ["Posts", "Study Sets", "Resources"] as const;
type Tab = (typeof TABS)[number];

const GRADE_LABEL: Record<string, string> = {
  middle_school: "Middle school",
  high_school: "High school",
  college: "College",
};

export function ProfileView({
  username,
  authMode,
}: {
  username: string;
  authMode: "dev" | "clerk";
}) {
  const profile = useProfile(username);
  const posts = useProfilePosts(username);
  const follow = useToggleFollow(username);
  const updateProfile = useUpdateProfile();
  const [tab, setTab] = useState<Tab>("Posts");
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");

  if (profile.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (profile.error || !profile.data) {
    return (
      <div className="px-4 py-10 md:px-0">
        <EmptyState
          title="We couldn't find that person."
          action={
            <Link href="/home" className="font-semibold text-brand-blue">
              Back to Home
            </Link>
          }
        />
      </div>
    );
  }

  const p = profile.data;

  return (
    <div className="animate-rise">
      <header className="relative overflow-hidden bg-hero p-5 text-white shadow-blue-sm max-md:border-b max-md:border-brand-blue-700 md:rounded-card">
        <div className="bg-hero-dots absolute inset-0 opacity-50" />
        <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-accent-yellow/20 blur-2xl" />

        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex shrink-0 rounded-full bg-white p-1 shadow-card">
                <Avatar username={p.username} src={p.avatarUrl} size={64} />
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-extrabold">
                  @{p.username}
                </h1>
                {p.gradeLevel && (
                  <p className="text-sm font-medium text-white/80">
                    {GRADE_LABEL[p.gradeLevel] ?? p.gradeLevel}
                  </p>
                )}
              </div>
            </div>

            {p.isSelf ? (
              <button
                onClick={() => {
                  setBio(p.bio ?? "");
                  setEditing((v) => !v);
                }}
                className="shrink-0 rounded-pill bg-white/15 px-4 py-1.5 text-sm font-bold text-white backdrop-blur transition-colors hover:bg-white/25"
              >
                Edit profile
              </button>
            ) : (
              <button
                disabled={follow.isPending}
                onClick={() => follow.mutate()}
                className={cx(
                  "shrink-0 rounded-pill px-4 py-1.5 text-sm font-bold transition-colors disabled:opacity-60",
                  p.viewerIsFollowing
                    ? "bg-white/15 text-white hover:bg-white/25"
                    : "bg-white text-brand-blue hover:bg-white/90",
                )}
              >
                {p.viewerIsFollowing ? "Following" : "Follow"}
              </button>
            )}
          </div>

          {editing ? (
            <form
              className="mt-4"
              onSubmit={async (e) => {
                e.preventDefault();
                await updateProfile.mutateAsync({ bio: bio.trim() });
                setEditing(false);
                profile.refetch();
              }}
            >
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={280}
                placeholder="Add a short bio"
                className="min-h-[64px] border-white/30 bg-white/10 text-white placeholder:text-white/60"
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={updateProfile.isPending}
                  className="rounded-pill bg-white px-4 py-1.5 text-sm font-bold text-brand-blue disabled:opacity-60"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-pill bg-white/15 px-4 py-1.5 text-sm font-bold text-white"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            p.bio && (
              <p className="mt-3 text-[15px] leading-6 text-white/90">
                {p.bio}
              </p>
            )
          )}

          <div className="mt-4 grid grid-cols-3 gap-2">
            <ProfileStat label="Likes" value={p.helpfulReceived} />
            <ProfileStat label="Followers" value={p.followersCount} />
            <ProfileStat label="Following" value={p.followingCount} />
          </div>

          {!p.isSelf && (
            <div className="mt-3">
              <ReportButton targetType="profile" targetId={p.id} light />
            </div>
          )}
        </div>
      </header>

      {p.isSelf && (
        <div className="mt-3 px-4 lg:hidden md:px-0">
          <AccountControl authMode={authMode} />
        </div>
      )}

      <div className="mt-4 flex gap-1 px-4 md:px-0">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cx(
              "rounded-pill px-3.5 py-1.5 text-sm font-bold transition-colors",
              tab === t
                ? "bg-brand-blue text-white shadow-blue-sm"
                : "bg-surface text-muted hover:bg-light-blue/60",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {tab !== "Posts" ? (
          <div className="px-4 md:px-0">
            <EmptyState
              icon={tab === "Study Sets" ? "🧠" : "📎"}
              title={`${tab} are coming soon`}
              description={
                tab === "Study Sets"
                  ? "Flashcard sets you create and share will show up here."
                  : "Files, links, and study material will show up here."
              }
            />
          </div>
        ) : posts.isLoading ? (
          <FeedSkeleton count={2} />
        ) : posts.data && posts.data.length > 0 ? (
          posts.data.map((post) => (
            <FeedPost
              key={post.id}
              post={post}
              onChanged={() => posts.refetch()}
            />
          ))
        ) : (
          <div className="px-4 md:px-0">
            <EmptyState
              title={p.isSelf ? "You haven't posted yet." : "No posts to show."}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white/12 px-3 py-2 text-center backdrop-blur">
      <div className="text-lg font-extrabold text-white">{value}</div>
      <div className="text-xs font-semibold text-white/75">{label}</div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";

import { AccountControl } from "@/components/account-control";
import { FeedPost } from "@/components/feed-post";
import { ReportButton } from "@/components/report-button";
import {
  Avatar,
  Button,
  cx,
  EmptyState,
  Field,
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
      <header className="overflow-hidden md:rounded-card md:border md:border-border">
        <div className="bg-hero relative h-24">
          <div className="bg-hero-dots absolute inset-0 opacity-50" />
          <div className="absolute -right-6 -top-8 h-28 w-28 rounded-full bg-accent-yellow/25 blur-2xl" />
        </div>
        <div className="bg-surface px-4 pb-5">
          <div className="-mt-9 flex items-end gap-4">
            <span className="rounded-full ring-4 ring-surface">
              <Avatar username={p.username} src={p.avatarUrl} size={72} />
            </span>
            <div className="min-w-0 flex-1 pb-1">
              <h1 className="text-xl font-extrabold text-navy">
                @{p.username}
              </h1>
              {p.gradeLevel && (
                <p className="text-sm text-muted">
                  {GRADE_LABEL[p.gradeLevel] ?? p.gradeLevel}
                </p>
              )}
            </div>
            <div className="pb-1">
              {p.isSelf ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setBio(p.bio ?? "");
                    setEditing((v) => !v);
                  }}
                >
                  Edit
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant={p.viewerIsFollowing ? "secondary" : "primary"}
                  disabled={follow.isPending}
                  onClick={() => follow.mutate()}
                >
                  {p.viewerIsFollowing ? "Following" : "Follow"}
                </Button>
              )}
            </div>
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
              <Field label="Bio">
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={280}
                  className="min-h-[64px]"
                />
              </Field>
              <div className="mt-2 flex gap-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={updateProfile.isPending}
                >
                  Save
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            p.bio && <p className="mt-3 text-[15px] text-navy">{p.bio}</p>
          )}

          <div className="mt-4 grid grid-cols-3 gap-2">
            <Stat label="Helpful" value={p.helpfulReceived} highlight />
            <Stat label="Followers" value={p.followersCount} />
            <Stat label="Following" value={p.followingCount} />
          </div>

          <div className="mt-3">
            {p.isSelf ? (
              <AccountControl authMode={authMode} />
            ) : (
              <ReportButton targetType="profile" targetId={p.id} />
            )}
          </div>
        </div>
      </header>

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
            <EmptyState title={`${tab} — Coming Soon`} />
          </div>
        ) : posts.isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
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

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={cx(
        "rounded-xl border px-3 py-2 text-center",
        highlight
          ? "border-transparent bg-brand-blue text-white"
          : "border-border bg-background text-navy",
      )}
    >
      <div className="text-lg font-extrabold">{value}</div>
      <div
        className={cx(
          "text-xs font-semibold",
          highlight ? "text-white/80" : "text-muted",
        )}
      >
        {label}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";

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

export function ProfileView({ username }: { username: string }) {
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
    <div>
      <header className="border-b border-border bg-surface px-4 py-6 md:rounded-card md:border">
        <div className="flex items-start gap-4">
          <Avatar username={p.username} src={p.avatarUrl} size={64} />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-extrabold text-navy">@{p.username}</h1>
            {p.gradeLevel && (
              <p className="text-sm text-muted">
                {GRADE_LABEL[p.gradeLevel] ?? p.gradeLevel}
              </p>
            )}
          </div>
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
              <Button type="submit" size="sm" disabled={updateProfile.isPending}>
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

        <div className="mt-4 flex gap-6 text-sm">
          <Stat label="Helpful" value={p.helpfulReceived} />
          <Stat label="Followers" value={p.followersCount} />
          <Stat label="Following" value={p.followingCount} />
        </div>

        {!p.isSelf && (
          <div className="mt-3">
            <ReportButton targetType="profile" targetId={p.id} />
          </div>
        )}
      </header>

      <div className="mt-3 flex gap-1 px-4 md:px-0">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cx(
              "rounded-pill px-3 py-1.5 text-sm font-semibold",
              tab === t ? "bg-brand-blue text-white" : "text-muted",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-3">
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

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <span>
      <span className="font-bold text-navy">{value}</span>{" "}
      <span className="text-muted">{label}</span>
    </span>
  );
}

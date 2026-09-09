"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import { AccountControl } from "@/components/account-control";
import { Avatar, Button, Field, Input, Select, Spinner, Textarea } from "@/components/ui";
import { ApiClientError } from "@/lib/api/client";
import { useMe, useUpdateProfile } from "@/lib/api/hooks";
import type { GradeLevel } from "@/lib/contracts/common";
import { uploadFile, UploadError } from "@/lib/upload";

const GRADES: { value: GradeLevel; label: string }[] = [
  { value: "middle_school", label: "Middle school" },
  { value: "high_school", label: "High school" },
  { value: "college", label: "College" },
];

export function SettingsView({ authMode }: { authMode: "dev" | "clerk" }) {
  const me = useMe();
  const profile = me.data?.profile;

  if (me.isLoading || !profile) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="animate-rise px-4 py-4 md:px-0">
      <header className="mb-5">
        <h1 className="text-2xl font-extrabold text-navy">Settings</h1>
        <p className="mt-1 text-sm text-muted">
          Manage your profile and account.
        </p>
      </header>

      <ProfileSection
        key={profile.id}
        initial={{
          username: profile.username,
          gradeLevel: profile.gradeLevel ?? "high_school",
          bio: profile.bio ?? "",
          avatarUrl: profile.avatarUrl,
        }}
        onSaved={() => me.refetch()}
      />

      <section className="mt-4 rounded-card border border-border bg-surface p-5 shadow-card">
        <h2 className="text-lg font-extrabold text-navy">Account</h2>
        <div className="mt-3 space-y-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted">Email</span>
            <span className="truncate font-medium text-navy">
              {profile.email}
            </span>
          </div>
          <div className="border-t border-border pt-3">
            <AccountControl
              authMode={authMode}
              className="text-sm font-semibold text-red-600 hover:text-red-700"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function ProfileSection({
  initial,
  onSaved,
}: {
  initial: {
    username: string;
    gradeLevel: GradeLevel;
    bio: string;
    avatarUrl: string | null;
  };
  onSaved: () => void;
}) {
  const updateProfile = useUpdateProfile();
  const fileRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState(initial.username);
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>(initial.gradeLevel);
  const [bio, setBio] = useState(initial.bio);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initial.avatarUrl);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const dirty =
    username.trim() !== initial.username ||
    gradeLevel !== initial.gradeLevel ||
    bio.trim() !== initial.bio.trim() ||
    (avatarUrl ?? "") !== (initial.avatarUrl ?? "");

  async function pickPhoto(file: File) {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }
    setUploading(true);
    try {
      const uploaded = await uploadFile(file);
      setAvatarUrl(uploaded.url);
    } catch (err) {
      setError(
        err instanceof UploadError ? err.message : "Couldn't upload that photo.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    try {
      await updateProfile.mutateAsync({
        username: username.trim(),
        gradeLevel,
        bio: bio.trim(),
        avatarUrl: avatarUrl ?? "",
      });
      setSaved(true);
      onSaved();
    } catch (err) {
      if (err instanceof ApiClientError) {
        const fromField = (
          err.details as { fieldErrors?: { username?: string[] } } | undefined
        )?.fieldErrors?.username?.[0];
        setError(fromField ?? err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <form
      onSubmit={save}
      className="rounded-card border border-border bg-surface p-5 shadow-card"
    >
      <h2 className="text-lg font-extrabold text-navy">Profile</h2>

      <div className="mt-4 flex items-center gap-4">
        <Avatar username={username || "?"} src={avatarUrl} size={64} />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? "Uploading…" : "Change photo"}
          </Button>
          {avatarUrl && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setAvatarUrl(null)}
            >
              Remove
            </Button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void pickPhoto(f);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <Field
          label="Username"
          hint="Letters, numbers, and underscores. This is public."
        >
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            minLength={3}
            maxLength={20}
            autoComplete="username"
          />
        </Field>

        <Field label="Grade level">
          <Select
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value as GradeLevel)}
          >
            {GRADES.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Bio" hint={`${bio.length}/280`}>
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 280))}
            placeholder="A short line about you — classes, interests, what you can help with."
            className="min-h-[80px]"
          />
        </Field>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {saved && !dirty && (
        <p className="mt-3 text-sm font-semibold text-brand-blue">Saved.</p>
      )}

      <Button
        type="submit"
        className="mt-4"
        disabled={
          updateProfile.isPending ||
          uploading ||
          !dirty ||
          username.trim().length < 3
        }
      >
        {updateProfile.isPending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}

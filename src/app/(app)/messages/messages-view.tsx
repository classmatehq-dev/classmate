"use client";

import Link from "next/link";

import { Avatar, ButtonLink, EmptyState, Skeleton } from "@/components/ui";
import { useConversations } from "@/lib/api/hooks";
import type { ConversationDto } from "@/lib/contracts/messages";
import { relativeTime } from "@/lib/time";

export function MessagesView() {
  const convos = useConversations();

  return (
    <div className="animate-rise">
      <header className="relative overflow-hidden px-4 pt-4 md:px-0">
        <div className="bg-hero relative overflow-hidden rounded-card p-5 text-white shadow-blue">
          <div className="bg-hero-dots pointer-events-none absolute inset-0 opacity-60" />
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">
                Messages
              </h1>
              <p className="mt-1 text-sm text-white/85">
                Chat one-on-one or start a group.
              </p>
            </div>
            <ButtonLink href="/messages/new" size="sm" variant="secondary">
              + New
            </ButtonLink>
          </div>
        </div>
      </header>

      <div className="mt-4 px-4 md:px-0">
        {convos.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-card" />
            ))}
          </div>
        ) : convos.data && convos.data.length > 0 ? (
          <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface shadow-card">
            {convos.data.map((c) => (
              <li key={c.id}>
                <ConversationRow convo={c} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon="💬"
            title="No conversations yet."
            description="Start a chat with a classmate by their username, or make a group."
            action={
              <ButtonLink href="/messages/new" size="sm">
                New message
              </ButtonLink>
            }
          />
        )}
      </div>
    </div>
  );
}

function ConversationRow({ convo }: { convo: ConversationDto }) {
  const preview = convo.lastMessage
    ? `${convo.kind === "group" ? `${convo.lastMessage.senderUsername}: ` : ""}${
        convo.lastMessage.body
      }`
    : "No messages yet";

  return (
    <Link
      href={`/messages/${convo.id}`}
      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-light-blue/50"
    >
      <GroupOrUserAvatar convo={convo} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate font-bold text-navy">{convo.title}</p>
          <span className="shrink-0 text-xs text-muted">
            {relativeTime(convo.updatedAt)}
          </span>
        </div>
        <p
          className={
            convo.unreadCount > 0
              ? "truncate text-sm font-semibold text-navy"
              : "truncate text-sm text-muted"
          }
        >
          {preview}
        </p>
      </div>
      {convo.unreadCount > 0 && (
        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-blue px-1.5 text-xs font-bold text-white">
          {convo.unreadCount > 9 ? "9+" : convo.unreadCount}
        </span>
      )}
    </Link>
  );
}

function GroupOrUserAvatar({ convo }: { convo: ConversationDto }) {
  if (convo.kind === "group") {
    return (
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-yellow/20 text-lg"
        aria-hidden
      >
        👥
      </span>
    );
  }
  const other = convo.otherMembers[0];
  return (
    <Avatar
      username={other?.username ?? "?"}
      src={other?.avatarUrl}
      size={40}
    />
  );
}

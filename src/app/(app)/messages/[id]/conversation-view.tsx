"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  AttachButton,
  AttachmentDraftTray,
  AttachmentList,
  useAttachmentDraft,
} from "@/components/attachments";
import {
  Avatar,
  Button,
  cx,
  EmptyState,
  Spinner,
} from "@/components/ui";
import { ApiClientError } from "@/lib/api/client";
import {
  useAddGroupMembers,
  useConversation,
  useLeaveConversation,
  useMarkConversationRead,
  useMessages,
  useSendMessage,
} from "@/lib/api/hooks";
import type { MessageDto } from "@/lib/contracts/messages";
import { relativeTime } from "@/lib/time";

export function ConversationView({
  conversationId,
}: {
  conversationId: string;
}) {
  const router = useRouter();
  const convo = useConversation(conversationId);
  const messages = useMessages(conversationId);
  const send = useSendMessage(conversationId);
  const markRead = useMarkConversationRead();
  const leave = useLeaveConversation();

  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const attach = useAttachmentDraft();

  const items = messages.data?.items ?? [];
  const lastId = items.at(-1)?.id;
  const bottomRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // scroll to newest whenever the last message changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [lastId]);

  // mark read on open and each time a newer message shows up (not on every poll)
  const markReadRef = useRef(markRead.mutate);
  markReadRef.current = markRead.mutate;
  const markedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!messages.data) return;
    const key = `${conversationId}:${lastId ?? "empty"}`;
    if (markedFor.current === key) return;
    markedFor.current = key;
    markReadRef.current(conversationId);
  }, [conversationId, lastId, messages.data]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (send.isPending || attach.uploading) return;
    const body = draft.trim();
    const attachments = attach.inputs;
    if (!body && attachments.length === 0) return;
    setError(null);
    setDraft("");
    attach.clear();
    try {
      await send.mutateAsync({ body, attachments });
    } catch (err) {
      setDraft(body);
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Couldn't send. Try again.",
      );
    }
  }

  if (convo.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (convo.error instanceof ApiClientError) {
    return (
      <div className="px-4 py-10 md:px-0">
        <EmptyState
          title="We couldn't open that conversation."
          action={
            <Link href="/messages" className="font-semibold text-brand-blue">
              Back to Messages
            </Link>
          }
        />
      </div>
    );
  }

  const c = convo.data!;
  const subtitle =
    c.kind === "group"
      ? `${c.memberCount} members`
      : c.otherMembers[0]
        ? "Direct message"
        : "";

  return (
    <div className="animate-rise flex h-[calc(100vh-3rem)] flex-col md:h-[calc(100vh-2rem)]">
      {/* header */}
      <header className="flex items-center gap-3 border-b border-border px-4 py-3 md:px-2">
        <Link
          href="/messages"
          className="shrink-0 text-brand-blue"
          aria-label="Back to messages"
        >
          ←
        </Link>
        <button
          type="button"
          onClick={() => c.kind === "group" && setShowMembers((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <div className="min-w-0">
            <p className="truncate font-extrabold text-navy">{c.title}</p>
            {subtitle && (
              <p className="truncate text-xs text-muted">{subtitle}</p>
            )}
          </div>
        </button>
        {c.kind === "direct" && c.otherMembers[0] && (
          <Link
            href={`/u/${c.otherMembers[0].username}`}
            className="shrink-0 text-sm font-semibold text-brand-blue hover:underline"
          >
            Profile
          </Link>
        )}
      </header>

      {c.kind === "group" && showMembers && (
        <GroupPanel
          conversationId={conversationId}
          members={c.otherMembers}
          isOwner={c.isOwner}
          onLeave={async () => {
            await leave.mutateAsync(conversationId);
            router.push("/messages");
          }}
        />
      )}

      {/* messages */}
      <div className="flex-1 space-y-1 overflow-y-auto px-4 py-4 md:px-2">
        {messages.isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : items.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">
            No messages yet — say hi.
          </p>
        ) : (
          items.map((m, i) => (
            <MessageBubble
              key={m.id}
              message={m}
              showSender={
                c.kind === "group" &&
                !m.isMine &&
                items[i - 1]?.sender.id !== m.sender.id
              }
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* composer */}
      <form
        ref={formRef}
        onSubmit={submit}
        className="border-t border-border px-3 py-3 md:px-2"
      >
        {error && (
          <p className="mb-2 px-1 text-sm text-red-600">{error}</p>
        )}
        <AttachmentDraftTray draft={attach} />
        <div className="flex items-end gap-2">
          <AttachButton draft={attach} className="h-11 w-11" />
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                formRef.current?.requestSubmit();
              }
            }}
            rows={1}
            placeholder="Write a message…"
            className="max-h-32 min-h-[2.75rem] w-full resize-none rounded-2xl border border-border bg-surface px-4 py-2.5 text-[15px] text-navy placeholder:text-muted focus:border-brand-blue focus:outline-none"
          />
          <Button
            type="submit"
            size="sm"
            disabled={
              send.isPending ||
              attach.uploading ||
              (draft.trim().length === 0 && attach.inputs.length === 0)
            }
            className="h-11 shrink-0"
          >
            {attach.uploading ? "…" : "Send"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function MessageBubble({
  message,
  showSender,
}: {
  message: MessageDto;
  showSender: boolean;
}) {
  return (
    <div
      className={cx(
        "flex flex-col",
        message.isMine ? "items-end" : "items-start",
      )}
    >
      {showSender && (
        <span className="mb-0.5 ml-1 text-xs font-semibold text-muted">
          @{message.sender.username}
        </span>
      )}
      {message.body && (
        <div
          className={cx(
            "max-w-[78%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-[15px]",
            message.isMine
              ? "rounded-br-sm bg-brand-blue text-white"
              : "rounded-bl-sm bg-surface text-navy shadow-card",
          )}
        >
          {message.body}
        </div>
      )}
      {message.attachments.length > 0 && (
        <div className="mt-1 max-w-[78%]">
          <AttachmentList attachments={message.attachments} />
        </div>
      )}
      <span className="mx-1 mt-0.5 text-[11px] text-muted">
        {relativeTime(message.createdAt)}
      </span>
    </div>
  );
}

function GroupPanel({
  conversationId,
  members,
  isOwner,
  onLeave,
}: {
  conversationId: string;
  members: { id: string; username: string; avatarUrl: string | null }[];
  isOwner: boolean;
  onLeave: () => void;
}) {
  const addMembers = useAddGroupMembers(conversationId);
  const [value, setValue] = useState("");
  const [note, setNote] = useState<string | null>(null);

  async function add() {
    const names = value
      .split(/[,\s]+/)
      .map((s) => s.trim().replace(/^@/, ""))
      .filter(Boolean);
    if (names.length === 0) return;
    setNote(null);
    try {
      await addMembers.mutateAsync(names);
      setValue("");
    } catch (err) {
      setNote(
        err instanceof ApiClientError ? err.message : "Couldn't add them.",
      );
    }
  }

  return (
    <div className="border-b border-border bg-light-blue/40 px-4 py-3 md:px-2">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
        In this group
      </p>
      <div className="flex flex-wrap gap-2">
        {members.map((m) => (
          <Link
            key={m.id}
            href={`/u/${m.username}`}
            className="inline-flex items-center gap-1.5 rounded-pill bg-surface px-2 py-1 text-sm font-semibold text-navy shadow-card"
          >
            <Avatar username={m.username} src={m.avatarUrl} size={18} />
            @{m.username}
          </Link>
        ))}
      </div>

      {isOwner && (
        <div className="mt-3 flex gap-2">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Add by @username"
            className="w-full rounded-pill border border-border bg-surface px-3 py-1.5 text-sm text-navy placeholder:text-muted focus:border-brand-blue focus:outline-none"
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={add}
            disabled={addMembers.isPending}
          >
            Add
          </Button>
        </div>
      )}
      {note && <p className="mt-2 text-sm text-red-600">{note}</p>}

      <button
        type="button"
        onClick={onLeave}
        className="mt-3 text-sm font-semibold text-red-600 hover:underline"
      >
        Leave group
      </button>
    </div>
  );
}

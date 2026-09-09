"use client";

import Link from "next/link";

import { Avatar } from "@/components/ui";
import { useNotificationsUnreadCount } from "@/lib/api/hooks";
import type { NotificationDto } from "@/lib/contracts/notifications";
import { relativeTime } from "@/lib/time";

/**
 * Bell icon + unread badge that links to the notifications page.
 * (A dropdown would get clipped inside the home hero's `overflow-hidden`,
 * and we already have a full-page list, so the bell just navigates.)
 */
export function NotificationBell({ className }: { className?: string }) {
  const unread = useNotificationsUnreadCount();
  const count = unread.data?.count ?? 0;

  return (
    <Link
      href="/notifications"
      aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ""}`}
      className={`relative rounded-full p-2 text-navy hover:bg-light-blue ${
        className ?? ""
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {count > 0 && (
        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}

export function NotificationRow({
  n,
  onNavigate,
}: {
  n: NotificationDto;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={n.href}
      onClick={onNavigate}
      className={`flex gap-3 px-4 py-3 transition-colors hover:bg-light-blue/50 ${
        n.isRead ? "" : "bg-light-blue/30"
      }`}
    >
      {n.actor ? (
        <Avatar username={n.actor.username} src={n.actor.avatarUrl} size={36} />
      ) : (
        <span className="h-9 w-9 shrink-0 rounded-full bg-light-blue" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm text-navy">
          <span className="font-bold">
            {n.actor ? `@${n.actor.username}` : "Someone"}
          </span>{" "}
          {n.text}
        </p>
        {n.context && (
          <p className="mt-0.5 truncate text-[13px] text-muted">
            &ldquo;{n.context}&rdquo;
          </p>
        )}
        <p className="mt-0.5 text-xs text-muted">{relativeTime(n.createdAt)}</p>
      </div>
      {!n.isRead && (
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-blue" />
      )}
    </Link>
  );
}

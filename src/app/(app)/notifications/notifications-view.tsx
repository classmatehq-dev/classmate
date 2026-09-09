"use client";

import { useEffect, useRef } from "react";

import { NotificationRow } from "@/components/notification-bell";
import { EmptyState, Skeleton } from "@/components/ui";
import {
  useMarkNotificationsRead,
  useNotifications,
  useNotificationsUnreadCount,
} from "@/lib/api/hooks";

export function NotificationsView() {
  const list = useNotifications();
  const unread = useNotificationsUnreadCount();
  const markRead = useMarkNotificationsRead();

  const count = unread.data?.count ?? 0;
  const markFn = useRef(markRead.mutate);
  markFn.current = markRead.mutate;
  useEffect(() => {
    if (count > 0) markFn.current();
  }, [count]);

  const items = list.data?.items ?? [];

  return (
    <div className="animate-rise">
      <header className="px-4 pt-4 md:px-0">
        <div className="bg-hero relative overflow-hidden rounded-card p-5 text-white shadow-blue">
          <div className="bg-hero-dots pointer-events-none absolute inset-0 opacity-60" />
          <h1 className="relative text-2xl font-extrabold tracking-tight">
            Notifications
          </h1>
        </div>
      </header>

      <div className="mt-4 px-4 md:px-0">
        {list.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-card" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon="🔔"
            title="No notifications yet."
            description="When people comment on your posts, reply to you, like your work, or follow you, it shows up here."
          />
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface shadow-card">
            {items.map((n) => (
              <li key={n.id}>
                <NotificationRow n={n} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

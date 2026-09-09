import { and, desc, eq, isNull, lt, or, sql } from "drizzle-orm";

import type {
  ListNotificationsResponse,
  NotificationDto,
  NotificationType,
} from "@/lib/contracts/notifications";
import { db } from "@/server/db";
import { notifications, users, type Notification } from "@/server/db/schema";
import { decodeCursor, encodeCursor } from "@/server/lib/cursor";

// ---------------------------------------------------------------------------
// Emit  (called from the comment / like / follow flows)
// ---------------------------------------------------------------------------

type NotifyParams = {
  /** recipient */
  userId: string;
  /** who triggered it */
  actorId: string;
  type: NotificationType;
  postId?: string | null;
  commentId?: string | null;
  context?: string | null;
};

function snippet(text: string | null | undefined): string | null {
  if (!text) return null;
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > 120 ? `${clean.slice(0, 117)}…` : clean || null;
}

/**
 * Record a notification. Never throws into the caller — a failed notification
 * must not roll back the comment / like / follow that triggered it.
 * Likes de-dupe: re-liking the same thing won't stack rows.
 */
export async function notify(params: NotifyParams): Promise<void> {
  try {
    if (params.userId === params.actorId) return;

    if (params.type === "like_on_post" || params.type === "like_on_comment") {
      const existing = await db.query.notifications.findFirst({
        where: (n, { and, eq }) =>
          and(
            eq(n.userId, params.userId),
            eq(n.actorId, params.actorId),
            eq(n.type, params.type),
            params.commentId
              ? eq(n.commentId, params.commentId)
              : eq(n.postId, params.postId ?? ""),
          ),
      });
      if (existing) return;
    }

    await db.insert(notifications).values({
      userId: params.userId,
      actorId: params.actorId,
      type: params.type,
      postId: params.postId ?? null,
      commentId: params.commentId ?? null,
      context: snippet(params.context),
    });
  } catch (err) {
    console.error("[notifications] failed to record:", err);
  }
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

const VERB: Record<NotificationType, string> = {
  comment_on_post: "commented on your post",
  reply_to_comment: "replied to your comment",
  like_on_post: "liked your post",
  like_on_comment: "liked your comment",
  follow: "started following you",
};

function toDto(
  row: Notification,
  actor: { username: string; avatarUrl: string | null } | null,
): NotificationDto {
  const href =
    row.type === "follow"
      ? actor
        ? `/u/${actor.username}`
        : "/notifications"
      : row.postId
        ? `/post/${row.postId}`
        : "/notifications";

  return {
    id: row.id,
    type: row.type,
    actor,
    text: VERB[row.type],
    href,
    context: row.context,
    isRead: row.readAt != null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listNotifications(
  userId: string,
  opts: { limit: number; cursor?: string },
): Promise<ListNotificationsResponse> {
  const cursor = decodeCursor(opts.cursor);

  const rows = await db
    .select({
      notification: notifications,
      actorUsername: users.username,
      actorAvatarUrl: users.avatarUrl,
    })
    .from(notifications)
    .leftJoin(users, eq(users.id, notifications.actorId))
    .where(
      and(
        eq(notifications.userId, userId),
        cursor
          ? or(
              lt(notifications.createdAt, new Date(cursor.t)),
              and(
                eq(notifications.createdAt, new Date(cursor.t)),
                lt(notifications.id, cursor.id),
              ),
            )
          : undefined,
      ),
    )
    .orderBy(desc(notifications.createdAt), desc(notifications.id))
    .limit(opts.limit + 1);

  const hasMore = rows.length > opts.limit;
  const page = hasMore ? rows.slice(0, opts.limit) : rows;

  const items = page.map((r) =>
    toDto(
      r.notification,
      r.actorUsername
        ? { username: r.actorUsername, avatarUrl: r.actorAvatarUrl }
        : null,
    ),
  );

  const last = page[page.length - 1];
  const nextCursor =
    hasMore && last
      ? encodeCursor({
          t: last.notification.createdAt.toISOString(),
          id: last.notification.id,
        })
      : null;

  return { items, nextCursor };
}

export async function unreadNotificationCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(notifications)
    .where(
      and(eq(notifications.userId, userId), isNull(notifications.readAt)),
    );
  return row?.n ?? 0;
}

export async function markNotificationsRead(
  userId: string,
): Promise<{ ok: true }> {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(eq(notifications.userId, userId), isNull(notifications.readAt)),
    );
  return { ok: true };
}

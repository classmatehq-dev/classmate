import { and, desc, eq, exists, inArray, or, sql } from "drizzle-orm";

import type { FeedItemDto, FeedResponse } from "@/lib/contracts/feed";
import { db } from "@/server/db";
import {
  classMemberships,
  classes,
  helpfulVotes,
  posts,

  users,
} from "@/server/db/schema";
import { decodeCursor, encodeCursor } from "@/server/lib/cursor";

/**
 * Chronological feed of posts from the classes the user is an active member of.
 * Keyset pagination on (created_at, id) descending. Not algorithmic — newest first.
 */
export async function getHomeFeed(
  userId: string,
  params: { limit: number; cursor?: string },
): Promise<FeedResponse> {
  const memberClassIds = (
    await db
      .select({ classId: classMemberships.classId })
      .from(classMemberships)
      .where(
        and(
          eq(classMemberships.userId, userId),
          eq(classMemberships.status, "active"),
        ),
      )
  ).map((r) => r.classId);

  if (memberClassIds.length === 0) {
    return { items: [], nextCursor: null };
  }

  const cursor = decodeCursor(params.cursor);
  const cursorClause = cursor
    ? sql`(${posts.createdAt}, ${posts.id}) < (${new Date(cursor.t)}, ${cursor.id})`
    : undefined;

  const viewerHelpful = exists(
    db
      .select({ one: sql`1` })
      .from(helpfulVotes)
      .where(
        and(
          eq(helpfulVotes.userId, userId),
          eq(helpfulVotes.targetType, "post"),
          eq(helpfulVotes.targetId, posts.id),
        ),
      ),
  );

  const rows = await db
    .select({
      id: posts.id,
      type: posts.type,
      body: posts.body,
      status: posts.status,
      createdAt: posts.createdAt,
      helpfulCount: posts.helpfulCount,
      commentCount: posts.commentCount,
      authorId: posts.authorId,
      authorUsername: users.username,
      authorAvatarUrl: users.avatarUrl,
      classId: classes.id,
      className: classes.name,
      teacherName: classes.teacherName,
      viewerHasMarkedHelpful: viewerHelpful,
    })
    .from(posts)
    .innerJoin(users, eq(users.id, posts.authorId))
    .innerJoin(classes, eq(classes.id, posts.classId))
    .where(
      and(
        inArray(posts.classId, memberClassIds),
        eq(posts.status, "active"),
        or(eq(posts.visibility, "class"), eq(posts.visibility, "public")),
        cursorClause,
      ),
    )
    .orderBy(desc(posts.createdAt), desc(posts.id))
    .limit(params.limit + 1);

  const hasMore = rows.length > params.limit;
  const page = hasMore ? rows.slice(0, params.limit) : rows;

  const items: FeedItemDto[] = page.map((r) => ({
    id: r.id,
    type: r.type,
    body: r.body,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    helpfulCount: r.helpfulCount,
    commentCount: r.commentCount,
    viewerHasMarkedHelpful: Boolean(r.viewerHasMarkedHelpful),
    isAuthor: r.authorId === userId,
    author: {
      id: r.authorId,
      username: r.authorUsername,
      avatarUrl: r.authorAvatarUrl,
    },
    class: { id: r.classId, name: r.className, teacherName: r.teacherName },
  }));

  const last = page[page.length - 1];
  const nextCursor =
    hasMore && last
      ? encodeCursor({ t: last.createdAt.toISOString(), id: last.id })
      : null;

  return { items, nextCursor };
}

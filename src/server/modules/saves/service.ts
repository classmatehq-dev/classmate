import { and, desc, eq, sql } from "drizzle-orm";

import type { FeedItemDto, FeedResponse } from "@/lib/contracts/feed";
import { db } from "@/server/db";
import { classes, posts, savedPosts, users } from "@/server/db/schema";
import { decodeCursor, encodeCursor } from "@/server/lib/cursor";
import { loadAttachmentsMap } from "@/server/modules/attachments/service";
import { loadMentionsMap } from "@/server/modules/mentions/service";
import { loadAccessiblePost } from "@/server/modules/posts/service";

export async function toggleSave(
  userId: string,
  postId: string,
): Promise<{ saved: boolean }> {
  await loadAccessiblePost(postId, userId);

  const existing = await db.query.savedPosts.findFirst({
    where: (s, { and, eq }) =>
      and(eq(s.userId, userId), eq(s.postId, postId)),
  });

  if (existing) {
    await db.delete(savedPosts).where(eq(savedPosts.id, existing.id));
    return { saved: false };
  }

  try {
    await db.insert(savedPosts).values({ userId, postId });
  } catch {
    /* unique race — already saved */
  }
  return { saved: true };
}

export async function listSavedPosts(
  userId: string,
  params: { limit: number; cursor?: string },
): Promise<FeedResponse> {
  const cursor = decodeCursor(params.cursor);
  const cursorClause = cursor
    ? sql`(${savedPosts.createdAt}, ${savedPosts.id}) < (${new Date(cursor.t)}, ${cursor.id})`
    : undefined;

  const rows = await db
    .select({
      savedId: savedPosts.id,
      savedAt: savedPosts.createdAt,
      post: posts,
      authorId: users.id,
      authorUsername: users.username,
      authorAvatarUrl: users.avatarUrl,
      classId: classes.id,
      className: classes.name,
      teacherName: classes.teacherName,
      marked: sql<boolean>`exists (
        select 1 from helpful_votes hv
        where hv.user_id = ${userId} and hv.target_type = 'post' and hv.target_id = ${posts.id}
      )`,
    })
    .from(savedPosts)
    .innerJoin(posts, eq(posts.id, savedPosts.postId))
    .innerJoin(users, eq(users.id, posts.authorId))
    .innerJoin(classes, eq(classes.id, posts.classId))
    .where(
      and(
        eq(savedPosts.userId, userId),
        eq(posts.status, "active"),
        cursorClause,
      ),
    )
    .orderBy(desc(savedPosts.createdAt), desc(savedPosts.id))
    .limit(params.limit + 1);

  const hasMore = rows.length > params.limit;
  const page = hasMore ? rows.slice(0, params.limit) : rows;

  const postIds = page.map((r) => r.post.id);
  const [attachmentsByPost, mentionsByPost] = await Promise.all([
    loadAttachmentsMap("post", postIds),
    loadMentionsMap("post", postIds),
  ]);

  const items: FeedItemDto[] = page.map((r) => ({
    id: r.post.id,
    type: r.post.type,
    body: r.post.body,
    status: r.post.status,
    createdAt: r.post.createdAt.toISOString(),
    helpfulCount: r.post.helpfulCount,
    commentCount: r.post.commentCount,
    viewerHasMarkedHelpful: Boolean(r.marked),
    viewerHasSaved: true,
    isAuthor: r.authorId === userId,
    author: {
      id: r.authorId,
      username: r.authorUsername,
      avatarUrl: r.authorAvatarUrl,
    },
    class: { id: r.classId, name: r.className, teacherName: r.teacherName },
    attachments: attachmentsByPost.get(r.post.id) ?? [],
    mentions: mentionsByPost.get(r.post.id) ?? [],
  }));

  const last = page[page.length - 1];
  const nextCursor =
    hasMore && last
      ? encodeCursor({ t: last.savedAt.toISOString(), id: last.savedId })
      : null;

  return { items, nextCursor };
}

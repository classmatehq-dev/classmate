import { and, asc, eq, sql } from "drizzle-orm";

import type { CommentDto } from "@/lib/contracts/interactions";
import { db } from "@/server/db";
import { comments, posts, users, type Comment } from "@/server/db/schema";
import { ApiError } from "@/server/http/errors";
import { loadAccessiblePost } from "@/server/modules/posts/service";

type AuthorRow = { id: string; username: string; avatarUrl: string | null };

function toDto(
  c: Comment,
  author: AuthorRow,
  viewerId: string,
  marked: boolean,
): CommentDto {
  const deleted = c.status === "deleted";
  return {
    id: c.id,
    postId: c.postId,
    parentCommentId: c.parentCommentId,
    body: deleted ? "[deleted]" : c.body,
    status: c.status,
    createdAt: c.createdAt.toISOString(),
    helpfulCount: c.helpfulCount,
    viewerHasMarkedHelpful: marked,
    isAuthor: c.authorId === viewerId,
    author: deleted
      ? { id: c.authorId, username: "deleted", avatarUrl: null }
      : author,
  };
}

export async function listComments(
  postId: string,
  viewerId: string,
): Promise<CommentDto[]> {
  await loadAccessiblePost(postId, viewerId);

  const rows = await db
    .select({
      comment: comments,
      authorId: users.id,
      authorUsername: users.username,
      authorAvatarUrl: users.avatarUrl,
      marked: sql<boolean>`exists (
        select 1 from helpful_votes hv
        where hv.user_id = ${viewerId}
          and hv.target_type = 'comment'
          and hv.target_id = ${comments.id}
      )`,
    })
    .from(comments)
    .innerJoin(users, eq(users.id, comments.authorId))
    .where(and(eq(comments.postId, postId)))
    .orderBy(asc(comments.createdAt));

  // hide deleted comments that have no replies; keep the rest as tombstones
  const hasChild = new Set(
    rows
      .map((r) => r.comment.parentCommentId)
      .filter((id): id is string => id != null),
  );

  return rows
    .filter(
      (r) => r.comment.status !== "deleted" || hasChild.has(r.comment.id),
    )
    .map((r) =>
      toDto(
        r.comment,
        {
          id: r.authorId,
          username: r.authorUsername,
          avatarUrl: r.authorAvatarUrl,
        },
        viewerId,
        Boolean(r.marked),
      ),
    );
}

export async function createComment(
  postId: string,
  viewerId: string,
  input: { body: string; parentCommentId?: string },
): Promise<CommentDto> {
  await loadAccessiblePost(postId, viewerId);

  if (input.parentCommentId) {
    const parent = await db.query.comments.findFirst({
      where: (c, { eq }) => eq(c.id, input.parentCommentId!),
    });
    if (!parent || parent.postId !== postId) {
      throw ApiError.validation("That reply target doesn't exist.");
    }
  }

  const [row] = await db
    .insert(comments)
    .values({
      postId,
      authorId: viewerId,
      parentCommentId: input.parentCommentId ?? null,
      body: input.body.trim(),
      status: "active",
    })
    .returning();

  await db
    .update(posts)
    .set({ commentCount: sql`${posts.commentCount} + 1`, updatedAt: new Date() })
    .where(eq(posts.id, postId));

  const author = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, viewerId),
  });

  return toDto(
    row,
    { id: author!.id, username: author!.username, avatarUrl: author!.avatarUrl },
    viewerId,
    false,
  );
}

export async function updateComment(
  commentId: string,
  viewerId: string,
  body: string,
): Promise<CommentDto> {
  const c = await db.query.comments.findFirst({
    where: (cc, { eq }) => eq(cc.id, commentId),
  });
  if (!c || c.status === "deleted") {
    throw ApiError.notFound("We couldn't find that comment.");
  }
  if (c.authorId !== viewerId) {
    throw ApiError.forbidden("You can only edit your own comments.");
  }

  const [row] = await db
    .update(comments)
    .set({ body: body.trim(), updatedAt: new Date() })
    .where(eq(comments.id, commentId))
    .returning();

  const author = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, viewerId),
  });
  return toDto(
    row,
    { id: author!.id, username: author!.username, avatarUrl: author!.avatarUrl },
    viewerId,
    false,
  );
}

export async function deleteComment(
  commentId: string,
  viewerId: string,
): Promise<{ ok: true }> {
  const c = await db.query.comments.findFirst({
    where: (cc, { eq }) => eq(cc.id, commentId),
  });
  if (!c || c.status === "deleted") {
    throw ApiError.notFound("We couldn't find that comment.");
  }

  let allowed = c.authorId === viewerId;
  if (!allowed) {
    const post = await db.query.posts.findFirst({
      where: (p, { eq }) => eq(p.id, c.postId),
    });
    if (post) {
      const membership = await db.query.classMemberships.findFirst({
        where: (m, { and, eq }) =>
          and(eq(m.userId, viewerId), eq(m.classId, post.classId)),
      });
      allowed =
        membership?.status === "active" &&
        (membership.role === "creator" || membership.role === "moderator");
    }
  }
  if (!allowed) {
    throw ApiError.forbidden("You can only delete your own comments.");
  }

  await db
    .update(comments)
    .set({ status: "deleted", updatedAt: new Date() })
    .where(eq(comments.id, commentId));

  if (c.status === "active") {
    await db
      .update(posts)
      .set({ commentCount: sql`greatest(${posts.commentCount} - 1, 0)` })
      .where(eq(posts.id, c.postId));
  }

  return { ok: true };
}

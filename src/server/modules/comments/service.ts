import { and, asc, eq, sql } from "drizzle-orm";

import type { AttachmentDto, AttachmentInput } from "@/lib/contracts/attachments";
import type { CommentDto } from "@/lib/contracts/interactions";
import { db } from "@/server/db";
import { comments, posts, users, type Comment } from "@/server/db/schema";
import { ApiError } from "@/server/http/errors";
import {
  listAttachmentsFor,
  loadAttachmentsMap,
  persistAttachments,
} from "@/server/modules/attachments/service";
import { listClassMemberUsers } from "@/server/modules/classes/service";
import {
  listMentionUsernamesFor,
  loadMentionsMap,
  resolveMentions,
  storeMentions,
} from "@/server/modules/mentions/service";
import { notify } from "@/server/modules/notifications/service";
import { loadAccessiblePost } from "@/server/modules/posts/service";

type AuthorRow = { id: string; username: string; avatarUrl: string | null };

function toDto(
  c: Comment,
  author: AuthorRow,
  viewerId: string,
  marked: boolean,
  attachments: AttachmentDto[],
  mentions: string[],
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
    attachments: deleted ? [] : attachments,
    mentions: deleted ? [] : mentions,
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

  const visible = rows.filter(
    (r) => r.comment.status !== "deleted" || hasChild.has(r.comment.id),
  );

  const commentIds = visible.map((r) => r.comment.id);
  const [attachmentsByComment, mentionsByComment] = await Promise.all([
    loadAttachmentsMap("comment", commentIds),
    loadMentionsMap("comment", commentIds),
  ]);

  return visible.map((r) =>
    toDto(
      r.comment,
      {
        id: r.authorId,
        username: r.authorUsername,
        avatarUrl: r.authorAvatarUrl,
      },
      viewerId,
      Boolean(r.marked),
      attachmentsByComment.get(r.comment.id) ?? [],
      mentionsByComment.get(r.comment.id) ?? [],
    ),
  );
}

export async function createComment(
  postId: string,
  viewerId: string,
  input: {
    body: string;
    parentCommentId?: string;
    attachments?: AttachmentInput[];
  },
): Promise<CommentDto> {
  const post = await loadAccessiblePost(postId, viewerId);

  let parent: typeof comments.$inferSelect | undefined;
  if (input.parentCommentId) {
    parent = await db.query.comments.findFirst({
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

  const attachments = await persistAttachments(
    "comment",
    row.id,
    viewerId,
    input.attachments,
  );

  // @mentions — class members only
  const members = await listClassMemberUsers(post.classId);
  const mentioned = await resolveMentions(
    input.body,
    members.map((m) => m.id),
  );
  await storeMentions("comment", row.id, mentioned);

  // who we've already told, so nobody gets two pings for one comment
  const notified = new Set<string>();
  for (const u of mentioned) {
    await notify({
      userId: u.id,
      actorId: viewerId,
      type: "mention",
      postId,
      commentId: row.id,
      context: input.body,
    });
    notified.add(u.id);
  }
  if (parent && !notified.has(parent.authorId)) {
    await notify({
      userId: parent.authorId,
      actorId: viewerId,
      type: "reply_to_comment",
      postId,
      commentId: row.id,
      context: input.body,
    });
    notified.add(parent.authorId);
  }
  if (!notified.has(post.authorId) && (!parent || parent.authorId !== post.authorId)) {
    await notify({
      userId: post.authorId,
      actorId: viewerId,
      type: "comment_on_post",
      postId,
      commentId: parent ? null : row.id,
      context: input.body,
    });
  }

  const author = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, viewerId),
  });

  return toDto(
    row,
    { id: author!.id, username: author!.username, avatarUrl: author!.avatarUrl },
    viewerId,
    false,
    attachments,
    await listMentionUsernamesFor("comment", row.id),
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
  const [att, ment] = await Promise.all([
    listAttachmentsFor("comment", commentId),
    listMentionUsernamesFor("comment", commentId),
  ]);
  return toDto(
    row,
    { id: author!.id, username: author!.username, avatarUrl: author!.avatarUrl },
    viewerId,
    false,
    att,
    ment,
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

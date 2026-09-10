import { and, desc, eq, sql } from "drizzle-orm";

import type { AttachmentDto, AttachmentInput } from "@/lib/contracts/attachments";
import type {
  ListPostsResponse,
  PostDto,
} from "@/lib/contracts/interactions";
import { db } from "@/server/db";
import { posts, users, type Post } from "@/server/db/schema";
import { ApiError } from "@/server/http/errors";
import { decodeCursor, encodeCursor } from "@/server/lib/cursor";
import {
  listAttachmentsFor,
  loadAttachmentsMap,
  persistAttachments,
} from "@/server/modules/attachments/service";
import {
  listClassMemberUsers,
  requireActiveMembership,
} from "@/server/modules/classes/service";
import {
  listMentionUsernamesFor,
  loadMentionsMap,
  resolveMentions,
  storeMentions,
} from "@/server/modules/mentions/service";
import { notify } from "@/server/modules/notifications/service";
import { isPostSaved, loadSavedSet } from "@/server/modules/saves/query";

type AuthorRow = { id: string; username: string; avatarUrl: string | null };

function toDto(
  post: Post,
  author: AuthorRow,
  viewerId: string,
  opts: {
    viewerHasMarkedHelpful: boolean;
    viewerHasSaved: boolean;
    attachments: AttachmentDto[];
    mentions: string[];
  },
): PostDto {
  return {
    id: post.id,
    classId: post.classId,
    type: post.type,
    body: post.body,
    status: post.status,
    visibility: post.visibility,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    helpfulCount: post.helpfulCount,
    commentCount: post.commentCount,
    viewerHasMarkedHelpful: opts.viewerHasMarkedHelpful,
    viewerHasSaved: opts.viewerHasSaved,
    isAuthor: post.authorId === viewerId,
    author,
    attachments: opts.attachments,
    mentions: opts.mentions,
  };
}

const viewerHelpfulSql = (viewerId: string) => sql<boolean>`exists (
  select 1 from helpful_votes hv
  where hv.user_id = ${viewerId}
    and hv.target_type = 'post'
    and hv.target_id = ${posts.id}
)`;

/** Membership gate: active member required unless the post is public. */
export async function loadAccessiblePost(postId: string, viewerId: string) {
  const post = await db.query.posts.findFirst({
    where: (p, { eq }) => eq(p.id, postId),
  });
  if (!post || post.status === "deleted") {
    throw ApiError.notFound("We couldn't find that post.");
  }
  if (post.visibility !== "public") {
    await requireActiveMembership(viewerId, post.classId);
  }
  return post;
}

export async function listClassPosts(
  classId: string,
  viewerId: string,
  params: { limit: number; cursor?: string },
): Promise<ListPostsResponse> {
  await requireActiveMembership(viewerId, classId);

  const cursor = decodeCursor(params.cursor);
  const cursorClause = cursor
    ? sql`(${posts.createdAt}, ${posts.id}) < (${new Date(cursor.t)}, ${cursor.id})`
    : undefined;

  const rows = await db
    .select({
      post: posts,
      authorId: users.id,
      authorUsername: users.username,
      authorAvatarUrl: users.avatarUrl,
      viewerHasMarkedHelpful: viewerHelpfulSql(viewerId),
    })
    .from(posts)
    .innerJoin(users, eq(users.id, posts.authorId))
    .where(
      and(eq(posts.classId, classId), eq(posts.status, "active"), cursorClause),
    )
    .orderBy(desc(posts.createdAt), desc(posts.id))
    .limit(params.limit + 1);

  const hasMore = rows.length > params.limit;
  const page = hasMore ? rows.slice(0, params.limit) : rows;

  const postIds = page.map((r) => r.post.id);
  const [attachmentsByPost, mentionsByPost, savedSet] = await Promise.all([
    loadAttachmentsMap("post", postIds),
    loadMentionsMap("post", postIds),
    loadSavedSet(viewerId, postIds),
  ]);

  const items = page.map((r) =>
    toDto(
      r.post,
      {
        id: r.authorId,
        username: r.authorUsername,
        avatarUrl: r.authorAvatarUrl,
      },
      viewerId,
      {
        viewerHasMarkedHelpful: Boolean(r.viewerHasMarkedHelpful),
        viewerHasSaved: savedSet.has(r.post.id),
        attachments: attachmentsByPost.get(r.post.id) ?? [],
        mentions: mentionsByPost.get(r.post.id) ?? [],
      },
    ),
  );

  const last = page[page.length - 1];
  const nextCursor =
    hasMore && last
      ? encodeCursor({ t: last.post.createdAt.toISOString(), id: last.post.id })
      : null;

  return { items, nextCursor };
}

export async function getPostDto(
  postId: string,
  viewerId: string,
): Promise<PostDto> {
  const post = await loadAccessiblePost(postId, viewerId);
  const author = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, post.authorId),
  });
  const marked = await db.query.helpfulVotes.findFirst({
    where: (hv, { and, eq }) =>
      and(
        eq(hv.userId, viewerId),
        eq(hv.targetType, "post"),
        eq(hv.targetId, postId),
      ),
  });
  const [attachments, mentionUsernames, saved] = await Promise.all([
    listAttachmentsFor("post", postId),
    listMentionUsernamesFor("post", postId),
    isPostSaved(viewerId, postId),
  ]);

  return toDto(
    post,
    {
      id: author!.id,
      username: author!.username,
      avatarUrl: author!.avatarUrl,
    },
    viewerId,
    {
      viewerHasMarkedHelpful: Boolean(marked),
      viewerHasSaved: saved,
      attachments,
      mentions: mentionUsernames,
    },
  );
}

export async function createPost(
  classId: string,
  viewerId: string,
  input: {
    body: string;
    type: "post" | "question";
    visibility: "class" | "public";
    attachments?: AttachmentInput[];
  },
): Promise<PostDto> {
  await requireActiveMembership(viewerId, classId);

  const [row] = await db
    .insert(posts)
    .values({
      classId,
      authorId: viewerId,
      body: input.body.trim(),
      type: input.type,
      visibility: input.visibility,
      status: "active",
    })
    .returning();

  await persistAttachments("post", row.id, viewerId, input.attachments);

  // @mentions — only people in the class, never yourself
  const members = await listClassMemberUsers(classId);
  const mentioned = await resolveMentions(
    input.body,
    members.map((m) => m.id),
  );
  await storeMentions("post", row.id, mentioned);
  for (const u of mentioned) {
    await notify({
      userId: u.id,
      actorId: viewerId,
      type: "mention",
      postId: row.id,
      context: input.body,
    });
  }

  return getPostDto(row.id, viewerId);
}

export async function updatePost(
  postId: string,
  viewerId: string,
  patch: { body?: string; type?: "post" | "question" },
): Promise<PostDto> {
  const post = await db.query.posts.findFirst({
    where: (p, { eq }) => eq(p.id, postId),
  });
  if (!post || post.status === "deleted") {
    throw ApiError.notFound("We couldn't find that post.");
  }
  if (post.authorId !== viewerId) {
    throw ApiError.forbidden("You can only edit your own posts.");
  }

  await db
    .update(posts)
    .set({
      body: patch.body?.trim() ?? post.body,
      type: patch.type ?? post.type,
      updatedAt: new Date(),
    })
    .where(eq(posts.id, postId));

  return getPostDto(postId, viewerId);
}

export async function deletePost(
  postId: string,
  viewerId: string,
): Promise<{ ok: true }> {
  const post = await db.query.posts.findFirst({
    where: (p, { eq }) => eq(p.id, postId),
  });
  if (!post || post.status === "deleted") {
    throw ApiError.notFound("We couldn't find that post.");
  }

  let allowed = post.authorId === viewerId;
  if (!allowed) {
    const membership = await db.query.classMemberships.findFirst({
      where: (m, { and, eq }) =>
        and(eq(m.userId, viewerId), eq(m.classId, post.classId)),
    });
    allowed =
      membership?.status === "active" &&
      (membership.role === "creator" || membership.role === "moderator");
  }
  if (!allowed) {
    throw ApiError.forbidden("You can only delete your own posts.");
  }

  await db
    .update(posts)
    .set({ status: "deleted", updatedAt: new Date() })
    .where(eq(posts.id, postId));

  return { ok: true };
}

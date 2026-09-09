import { and, desc, eq, inArray, or, sql } from "drizzle-orm";

import type { FeedItemDto } from "@/lib/contracts/feed";
import type {
  FollowResponse,
  PublicProfileDto,
} from "@/lib/contracts/profile";
import { db } from "@/server/db";
import {
  classMemberships,
  classes,
  follows,
  posts,
  users,
} from "@/server/db/schema";
import { ApiError } from "@/server/http/errors";
import { normalizeUsername } from "@/server/lib/normalize";
import { loadAttachmentsMap } from "@/server/modules/attachments/service";
import { getHelpfulReceived } from "@/server/modules/interactions/service";

async function loadByUsername(username: string) {
  const user = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.usernameLower, normalizeUsername(username)),
  });
  if (!user) throw ApiError.notFound("We couldn't find that person.");
  return user;
}

async function countFollowers(userId: string) {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(follows)
    .where(eq(follows.followingUserId, userId));
  return row?.n ?? 0;
}

async function countFollowing(userId: string) {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(follows)
    .where(eq(follows.followerUserId, userId));
  return row?.n ?? 0;
}

/** class ids the viewer can see content from (their active memberships) */
async function viewerClassIds(viewerId: string) {
  return (
    await db
      .select({ id: classMemberships.classId })
      .from(classMemberships)
      .where(
        and(
          eq(classMemberships.userId, viewerId),
          eq(classMemberships.status, "active"),
        ),
      )
  ).map((r) => r.id);
}

export async function getPublicProfile(
  username: string,
  viewerId: string,
): Promise<PublicProfileDto> {
  const user = await loadByUsername(username);

  const sharedClassIds = await viewerClassIds(viewerId);
  const visiblePosts = sharedClassIds.length
    ? or(
        eq(posts.visibility, "public"),
        inArray(posts.classId, sharedClassIds),
      )
    : eq(posts.visibility, "public");

  const [[{ postCount }], following, helpfulReceived, followersCount, followingCount] =
    await Promise.all([
      db
        .select({ postCount: sql<number>`count(*)::int` })
        .from(posts)
        .where(
          and(
            eq(posts.authorId, user.id),
            eq(posts.status, "active"),
            visiblePosts,
          ),
        ),
      db.query.follows.findFirst({
        where: (f, { and, eq }) =>
          and(
            eq(f.followerUserId, viewerId),
            eq(f.followingUserId, user.id),
          ),
      }),
      getHelpfulReceived(user.id),
      countFollowers(user.id),
      countFollowing(user.id),
    ]);

  return {
    id: user.id,
    username: user.username,
    gradeLevel: user.gradeLevel,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    helpfulReceived,
    followersCount,
    followingCount,
    postCount,
    isSelf: user.id === viewerId,
    viewerIsFollowing: Boolean(following),
    joinedAt: user.createdAt.toISOString(),
  };
}

export async function getProfilePosts(
  username: string,
  viewerId: string,
): Promise<FeedItemDto[]> {
  const user = await loadByUsername(username);
  const sharedClassIds = await viewerClassIds(viewerId);
  const visiblePosts = sharedClassIds.length
    ? or(eq(posts.visibility, "public"), inArray(posts.classId, sharedClassIds))
    : eq(posts.visibility, "public");

  const rows = await db
    .select({
      post: posts,
      authorId: users.id,
      username: users.username,
      avatarUrl: users.avatarUrl,
      classId: classes.id,
      className: classes.name,
      teacherName: classes.teacherName,
      marked: sql<boolean>`exists (
        select 1 from helpful_votes hv
        where hv.user_id = ${viewerId} and hv.target_type = 'post' and hv.target_id = ${posts.id}
      )`,
    })
    .from(posts)
    .innerJoin(users, eq(users.id, posts.authorId))
    .innerJoin(classes, eq(classes.id, posts.classId))
    .where(
      and(
        eq(posts.authorId, user.id),
        eq(posts.status, "active"),
        visiblePosts,
      ),
    )
    .orderBy(desc(posts.createdAt))
    .limit(30);

  const attachmentsByPost = await loadAttachmentsMap(
    "post",
    rows.map((r) => r.post.id),
  );

  return rows.map((r) => ({
    id: r.post.id,
    type: r.post.type,
    body: r.post.body,
    status: r.post.status,
    createdAt: r.post.createdAt.toISOString(),
    helpfulCount: r.post.helpfulCount,
    commentCount: r.post.commentCount,
    viewerHasMarkedHelpful: Boolean(r.marked),
    isAuthor: r.post.authorId === viewerId,
    author: { id: r.authorId, username: r.username, avatarUrl: r.avatarUrl },
    class: { id: r.classId, name: r.className, teacherName: r.teacherName },
    attachments: attachmentsByPost.get(r.post.id) ?? [],
  }));
}

export async function toggleFollow(
  username: string,
  viewerId: string,
): Promise<FollowResponse> {
  const target = await loadByUsername(username);
  if (target.id === viewerId) {
    throw ApiError.validation("You can't follow yourself.");
  }

  const existing = await db.query.follows.findFirst({
    where: (f, { and, eq }) =>
      and(
        eq(f.followerUserId, viewerId),
        eq(f.followingUserId, target.id),
      ),
  });

  if (existing) {
    await db.delete(follows).where(eq(follows.id, existing.id));
  } else {
    try {
      await db
        .insert(follows)
        .values({ followerUserId: viewerId, followingUserId: target.id });
    } catch {
      /* unique race */
    }
  }

  return {
    following: !existing,
    followersCount: await countFollowers(target.id),
  };
}

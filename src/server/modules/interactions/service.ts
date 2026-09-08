import { eq, sql } from "drizzle-orm";

import type {
  HelpfulResponse,
  ReportBody,
} from "@/lib/contracts/interactions";
import { db } from "@/server/db";
import { comments, helpfulVotes, posts, reports } from "@/server/db/schema";
import { ApiError } from "@/server/http/errors";
import { loadAccessiblePost } from "@/server/modules/posts/service";

/**
 * Toggle a Helpful vote. One vote per (user, target); pressing again removes it.
 * Keeps the denormalized `helpfulCount` on the target in sync.
 */
export async function toggleHelpful(
  viewerId: string,
  targetType: "post" | "comment",
  targetId: string,
): Promise<HelpfulResponse> {
  // access check + resolve the target's class
  if (targetType === "post") {
    await loadAccessiblePost(targetId, viewerId);
  } else {
    const comment = await db.query.comments.findFirst({
      where: (c, { eq }) => eq(c.id, targetId),
    });
    if (!comment || comment.status === "deleted") {
      throw ApiError.notFound("We couldn't find that comment.");
    }
    await loadAccessiblePost(comment.postId, viewerId);
  }

  const existing = await db.query.helpfulVotes.findFirst({
    where: (hv, { and, eq }) =>
      and(
        eq(hv.userId, viewerId),
        eq(hv.targetType, targetType),
        eq(hv.targetId, targetId),
      ),
  });

  const delta = existing ? -1 : 1;

  if (existing) {
    await db.delete(helpfulVotes).where(eq(helpfulVotes.id, existing.id));
  } else {
    try {
      await db
        .insert(helpfulVotes)
        .values({ userId: viewerId, targetType, targetId });
    } catch {
      // unique violation from a double-tap race — treat as already marked
    }
  }

  let count: number;
  if (targetType === "post") {
    const [row] = await db
      .update(posts)
      .set({
        helpfulCount:
          delta > 0
            ? sql`${posts.helpfulCount} + 1`
            : sql`greatest(${posts.helpfulCount} - 1, 0)`,
      })
      .where(eq(posts.id, targetId))
      .returning({ count: posts.helpfulCount });
    count = row?.count ?? 0;
  } else {
    const [row] = await db
      .update(comments)
      .set({
        helpfulCount:
          delta > 0
            ? sql`${comments.helpfulCount} + 1`
            : sql`greatest(${comments.helpfulCount} - 1, 0)`,
      })
      .where(eq(comments.id, targetId))
      .returning({ count: comments.helpfulCount });
    count = row?.count ?? 0;
  }

  return { marked: !existing, count };
}

export async function getHelpfulReceived(userId: string): Promise<number> {
  const result = await db.execute<{ total: number }>(sql`
    select coalesce(sum(cnt), 0)::int as total from (
      select helpful_count as cnt from ${posts} where author_id = ${userId} and status <> 'deleted'
      union all
      select helpful_count as cnt from ${comments} where author_id = ${userId} and status <> 'deleted'
    ) t
  `);
  return Number(result.rows[0]?.total ?? 0);
}

export async function createReport(
  reporterUserId: string,
  input: ReportBody,
): Promise<{ ok: true }> {
  // light existence check so we don't collect reports for nothing
  if (input.targetType === "post") {
    const p = await db.query.posts.findFirst({
      where: (x, { eq }) => eq(x.id, input.targetId),
    });
    if (!p) throw ApiError.notFound("We couldn't find that post.");
  } else if (input.targetType === "comment") {
    const c = await db.query.comments.findFirst({
      where: (x, { eq }) => eq(x.id, input.targetId),
    });
    if (!c) throw ApiError.notFound("We couldn't find that comment.");
  } else {
    const u = await db.query.users.findFirst({
      where: (x, { eq }) => eq(x.id, input.targetId),
    });
    if (!u) throw ApiError.notFound("We couldn't find that person.");
  }

  await db.insert(reports).values({
    reporterUserId,
    targetType: input.targetType,
    targetId: input.targetId,
    category: input.category,
    details: input.details?.trim() || null,
    status: "open",
  });

  return { ok: true };
}

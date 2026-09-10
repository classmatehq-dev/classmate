import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/server/db";
import { savedPosts } from "@/server/db/schema";

/**
 * Save lookups with no dependency on the posts module — safe to import from
 * posts/feed services without a cycle.
 */

export async function isPostSaved(
  userId: string,
  postId: string,
): Promise<boolean> {
  const row = await db.query.savedPosts.findFirst({
    where: (s, { and, eq }) => and(eq(s.userId, userId), eq(s.postId, postId)),
  });
  return Boolean(row);
}

export async function loadSavedSet(
  userId: string,
  postIds: string[],
): Promise<Set<string>> {
  if (postIds.length === 0) return new Set();
  const rows = await db
    .select({ postId: savedPosts.postId })
    .from(savedPosts)
    .where(
      and(eq(savedPosts.userId, userId), inArray(savedPosts.postId, postIds)),
    );
  return new Set(rows.map((r) => r.postId));
}

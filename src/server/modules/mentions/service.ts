import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/server/db";
import { mentions, users } from "@/server/db/schema";
import { extractHandles } from "@/server/lib/mentions";

export type MentionOwner = "post" | "comment";
export type MentionedUser = { id: string; username: string };

/**
 * Resolve the `@handles` in `body` to real users, limited to `allowedUserIds`
 * (the people who can actually see this content — usually the class members).
 */
export async function resolveMentions(
  body: string,
  allowedUserIds: Iterable<string>,
): Promise<MentionedUser[]> {
  const handles = extractHandles(body);
  if (handles.length === 0) return [];

  const allowed = new Set(allowedUserIds);
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      usernameLower: users.usernameLower,
    })
    .from(users)
    .where(inArray(users.usernameLower, handles));

  return rows
    .filter((r) => allowed.has(r.id))
    .map((r) => ({ id: r.id, username: r.username }));
}

/** Record which users were mentioned in a row (idempotent). */
export async function storeMentions(
  ownerType: MentionOwner,
  ownerId: string,
  mentioned: MentionedUser[],
): Promise<void> {
  if (mentioned.length === 0) return;
  await db
    .insert(mentions)
    .values(
      mentioned.map((u) => ({
        ownerType,
        ownerId,
        mentionedUserId: u.id,
      })),
    )
    .onConflictDoNothing();
}

/** Usernames mentioned in a single row — for linkifying the body. */
export async function listMentionUsernamesFor(
  ownerType: MentionOwner,
  ownerId: string,
): Promise<string[]> {
  const rows = await db
    .select({ username: users.username })
    .from(mentions)
    .innerJoin(users, eq(users.id, mentions.mentionedUserId))
    .where(
      and(eq(mentions.ownerType, ownerType), eq(mentions.ownerId, ownerId)),
    );
  return rows.map((r) => r.username);
}

/** Mentioned usernames for many rows at once, grouped by owner id. */
export async function loadMentionsMap(
  ownerType: MentionOwner,
  ownerIds: string[],
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (ownerIds.length === 0) return map;

  const rows = await db
    .select({
      ownerId: mentions.ownerId,
      username: users.username,
    })
    .from(mentions)
    .innerJoin(users, eq(users.id, mentions.mentionedUserId))
    .where(
      and(
        eq(mentions.ownerType, ownerType),
        inArray(mentions.ownerId, ownerIds),
      ),
    );

  for (const r of rows) {
    const list = map.get(r.ownerId) ?? [];
    list.push(r.username);
    map.set(r.ownerId, list);
  }
  return map;
}

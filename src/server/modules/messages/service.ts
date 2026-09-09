import {
  and,
  desc,
  eq,
  inArray,
  lt,
  ne,
  or,
  sql,
} from "drizzle-orm";

import type {
  ConversationDto,
  ListConversationsResponse,
  ListMessagesResponse,
  MessageDto,
} from "@/lib/contracts/messages";
import { db } from "@/server/db";
import {
  blocks,
  conversationMembers,
  conversations,
  messages,
  users,
  type Conversation,
} from "@/server/db/schema";
import { ApiError } from "@/server/http/errors";
import { normalizeUsername } from "@/server/lib/normalize";
import { decodeCursor, encodeCursor } from "@/server/lib/cursor";

type ChatUser = { id: string; username: string; avatarUrl: string | null };

/** Deterministic key for a 1:1 conversation — order-independent. */
function directKeyFor(a: string, b: string): string {
  return [a, b].sort().join(":");
}

/**
 * A conversation the viewer belongs to, plus the fields the DTO needs.
 * Throws 404 when the viewer is not an active member (don't reveal it exists).
 */
async function loadMembership(conversationId: string, viewerId: string) {
  const membership = await db.query.conversationMembers.findFirst({
    where: (m, { and, eq }) =>
      and(eq(m.conversationId, conversationId), eq(m.userId, viewerId)),
  });
  if (!membership || membership.status !== "active") {
    throw ApiError.notFound("We couldn't find that conversation.");
  }
  const conversation = await db.query.conversations.findFirst({
    where: (c, { eq }) => eq(c.id, conversationId),
  });
  if (!conversation) {
    throw ApiError.notFound("We couldn't find that conversation.");
  }
  return { membership, conversation };
}

/** Reject if either user has blocked the other. */
async function assertNotBlocked(a: string, b: string) {
  const row = await db.query.blocks.findFirst({
    where: (bl, { and, or, eq }) =>
      or(
        and(eq(bl.blockerUserId, a), eq(bl.blockedUserId, b)),
        and(eq(bl.blockerUserId, b), eq(bl.blockedUserId, a)),
      ),
  });
  if (row) {
    throw ApiError.forbidden("You can't message this person.");
  }
}

/** Look up users by username; error names the ones we couldn't find. */
async function resolveUsernames(rawUsernames: string[]): Promise<ChatUser[]> {
  const wanted = [
    ...new Set(rawUsernames.map((u) => normalizeUsername(u)).filter(Boolean)),
  ];
  if (wanted.length === 0) {
    throw ApiError.validation("Add at least one person.");
  }
  const found = await db
    .select({
      id: users.id,
      username: users.username,
      usernameLower: users.usernameLower,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(inArray(users.usernameLower, wanted));

  const missing = wanted.filter(
    (w) => !found.some((f) => f.usernameLower === w),
  );
  if (missing.length > 0) {
    throw ApiError.validation(
      missing.length === 1
        ? `We couldn't find @${missing[0]}.`
        : `We couldn't find: ${missing.map((m) => `@${m}`).join(", ")}.`,
    );
  }
  return found.map((f) => ({
    id: f.id,
    username: f.username,
    avatarUrl: f.avatarUrl,
  }));
}

// ---------------------------------------------------------------------------
// DTO assembly
// ---------------------------------------------------------------------------

async function buildConversationDtos(
  rows: Conversation[],
  viewerId: string,
): Promise<ConversationDto[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);

  const memberRows = await db
    .select({
      conversationId: conversationMembers.conversationId,
      userId: conversationMembers.userId,
      role: conversationMembers.role,
      lastReadAt: conversationMembers.lastReadAt,
      username: users.username,
      avatarUrl: users.avatarUrl,
    })
    .from(conversationMembers)
    .innerJoin(users, eq(users.id, conversationMembers.userId))
    .where(
      and(
        inArray(conversationMembers.conversationId, ids),
        eq(conversationMembers.status, "active"),
      ),
    );

  const lastMsgRows = await db
    .selectDistinctOn([messages.conversationId], {
      conversationId: messages.conversationId,
      body: messages.body,
      senderId: messages.senderId,
      createdAt: messages.createdAt,
      senderUsername: users.username,
    })
    .from(messages)
    .innerJoin(users, eq(users.id, messages.senderId))
    .where(
      and(inArray(messages.conversationId, ids), eq(messages.status, "active")),
    )
    .orderBy(messages.conversationId, desc(messages.createdAt));

  const unreadRows = await db
    .select({
      conversationId: messages.conversationId,
      n: sql<number>`count(*)::int`,
    })
    .from(messages)
    .innerJoin(
      conversationMembers,
      and(
        eq(conversationMembers.conversationId, messages.conversationId),
        eq(conversationMembers.userId, viewerId),
      ),
    )
    .where(
      and(
        inArray(messages.conversationId, ids),
        eq(messages.status, "active"),
        ne(messages.senderId, viewerId),
        or(
          sql`${conversationMembers.lastReadAt} is null`,
          sql`${messages.createdAt} > ${conversationMembers.lastReadAt}`,
        ),
      ),
    )
    .groupBy(messages.conversationId);

  const lastByConv = new Map(lastMsgRows.map((r) => [r.conversationId, r]));
  const unreadByConv = new Map(unreadRows.map((r) => [r.conversationId, r.n]));

  return rows.map((c) => {
    const members = memberRows.filter((m) => m.conversationId === c.id);
    const others = members
      .filter((m) => m.userId !== viewerId)
      .map<ChatUser>((m) => ({
        id: m.userId,
        username: m.username,
        avatarUrl: m.avatarUrl,
      }));
    const mine = members.find((m) => m.userId === viewerId);
    const last = lastByConv.get(c.id);

    const title =
      c.kind === "group"
        ? (c.title ?? "Group chat")
        : others.length > 0
          ? `@${others[0].username}`
          : "Unknown";

    return {
      id: c.id,
      kind: c.kind,
      title,
      otherMembers: others,
      memberCount: members.length,
      lastMessage: last
        ? {
            body: last.body,
            senderId: last.senderId,
            senderUsername: last.senderUsername,
            createdAt: last.createdAt.toISOString(),
          }
        : null,
      unreadCount: unreadByConv.get(c.id) ?? 0,
      updatedAt: c.lastMessageAt.toISOString(),
      isOwner: c.kind === "group" && mine?.role === "owner",
    };
  });
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function listConversations(
  viewerId: string,
): Promise<ListConversationsResponse> {
  const memberships = await db
    .select({ conversationId: conversationMembers.conversationId })
    .from(conversationMembers)
    .where(
      and(
        eq(conversationMembers.userId, viewerId),
        eq(conversationMembers.status, "active"),
      ),
    );
  if (memberships.length === 0) return [];

  const rows = await db
    .select()
    .from(conversations)
    .where(
      inArray(
        conversations.id,
        memberships.map((m) => m.conversationId),
      ),
    )
    .orderBy(desc(conversations.lastMessageAt));

  return buildConversationDtos(rows, viewerId);
}

export async function getConversationDto(
  conversationId: string,
  viewerId: string,
): Promise<ConversationDto> {
  const { conversation } = await loadMembership(conversationId, viewerId);
  const [dto] = await buildConversationDtos([conversation], viewerId);
  return dto;
}

function toMessageDto(
  row: { message: typeof messages.$inferSelect; sender: ChatUser },
  viewerId: string,
): MessageDto {
  return {
    id: row.message.id,
    conversationId: row.message.conversationId,
    body: row.message.body,
    createdAt: row.message.createdAt.toISOString(),
    isMine: row.message.senderId === viewerId,
    sender: row.sender,
  };
}

export async function listMessages(
  conversationId: string,
  viewerId: string,
  opts: { limit: number; cursor?: string },
): Promise<ListMessagesResponse> {
  const dto = await getConversationDto(conversationId, viewerId);

  const cursor = decodeCursor(opts.cursor);
  const rows = await db
    .select({ message: messages, sender: users })
    .from(messages)
    .innerJoin(users, eq(users.id, messages.senderId))
    .where(
      and(
        eq(messages.conversationId, conversationId),
        eq(messages.status, "active"),
        cursor
          ? or(
              lt(messages.createdAt, new Date(cursor.t)),
              and(
                eq(messages.createdAt, new Date(cursor.t)),
                lt(messages.id, cursor.id),
              ),
            )
          : undefined,
      ),
    )
    .orderBy(desc(messages.createdAt), desc(messages.id))
    .limit(opts.limit + 1);

  const hasMore = rows.length > opts.limit;
  const page = hasMore ? rows.slice(0, opts.limit) : rows;
  const nextCursor =
    hasMore && page.length > 0
      ? encodeCursor({
          t: page[page.length - 1].message.createdAt.toISOString(),
          id: page[page.length - 1].message.id,
        })
      : null;

  // newest-first from the DB; hand back oldest-first for rendering
  const items = page
    .map((r) =>
      toMessageDto(
        {
          message: r.message,
          sender: {
            id: r.sender.id,
            username: r.sender.username,
            avatarUrl: r.sender.avatarUrl,
          },
        },
        viewerId,
      ),
    )
    .reverse();

  return { conversation: dto, items, nextCursor };
}

export async function unreadTotal(viewerId: string): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(messages)
    .innerJoin(
      conversationMembers,
      and(
        eq(conversationMembers.conversationId, messages.conversationId),
        eq(conversationMembers.userId, viewerId),
        eq(conversationMembers.status, "active"),
      ),
    )
    .where(
      and(
        eq(messages.status, "active"),
        ne(messages.senderId, viewerId),
        or(
          sql`${conversationMembers.lastReadAt} is null`,
          sql`${messages.createdAt} > ${conversationMembers.lastReadAt}`,
        ),
      ),
    );
  return row?.n ?? 0;
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export async function startDirect(
  viewerId: string,
  username: string,
): Promise<ConversationDto> {
  const [other] = await resolveUsernames([username]);
  if (other.id === viewerId) {
    throw ApiError.validation("You can't message yourself.");
  }
  await assertNotBlocked(viewerId, other.id);

  const key = directKeyFor(viewerId, other.id);
  const existing = await db.query.conversations.findFirst({
    where: (c, { eq }) => eq(c.directKey, key),
  });
  if (existing) {
    // make sure both sides are still active members (either could have "left")
    await db
      .update(conversationMembers)
      .set({ status: "active" })
      .where(eq(conversationMembers.conversationId, existing.id));
    return getConversationDto(existing.id, viewerId);
  }

  const conversationId = await db.transaction(async (tx) => {
    const [conv] = await tx
      .insert(conversations)
      .values({
        kind: "direct",
        createdBy: viewerId,
        directKey: key,
        lastMessageAt: new Date(),
      })
      .returning();
    await tx.insert(conversationMembers).values([
      { conversationId: conv.id, userId: viewerId, role: "member" },
      { conversationId: conv.id, userId: other.id, role: "member" },
    ]);
    return conv.id;
  });

  return getConversationDto(conversationId, viewerId);
}

export async function createGroup(
  viewerId: string,
  input: { title: string; usernames: string[] },
): Promise<ConversationDto> {
  const invited = (await resolveUsernames(input.usernames)).filter(
    (u) => u.id !== viewerId,
  );
  if (invited.length === 0) {
    throw ApiError.validation("Add at least one other person.");
  }
  for (const u of invited) await assertNotBlocked(viewerId, u.id);

  const conversationId = await db.transaction(async (tx) => {
    const [conv] = await tx
      .insert(conversations)
      .values({
        kind: "group",
        title: input.title.trim(),
        createdBy: viewerId,
        lastMessageAt: new Date(),
      })
      .returning();
    await tx.insert(conversationMembers).values([
      { conversationId: conv.id, userId: viewerId, role: "owner" as const },
      ...invited.map((u) => ({
        conversationId: conv.id,
        userId: u.id,
        role: "member" as const,
      })),
    ]);
    return conv.id;
  });

  return getConversationDto(conversationId, viewerId);
}

export async function sendMessage(
  conversationId: string,
  viewerId: string,
  body: string,
): Promise<MessageDto> {
  const { conversation } = await loadMembership(conversationId, viewerId);

  // For a direct chat, block after the fact (someone blocked since it started).
  if (conversation.kind === "direct") {
    const other = await db.query.conversationMembers.findFirst({
      where: (m, { and, eq, ne }) =>
        and(eq(m.conversationId, conversationId), ne(m.userId, viewerId)),
    });
    if (other) await assertNotBlocked(viewerId, other.userId);
  }

  const trimmed = body.trim();
  const now = new Date();
  const [row] = await db
    .insert(messages)
    .values({
      conversationId,
      senderId: viewerId,
      body: trimmed,
      status: "active",
      createdAt: now,
    })
    .returning();

  await db
    .update(conversations)
    .set({
      lastMessageAt: now,
      lastMessagePreview: trimmed.slice(0, 140),
      updatedAt: now,
    })
    .where(eq(conversations.id, conversationId));

  // sender has now "seen" their own message
  await db
    .update(conversationMembers)
    .set({ lastReadAt: now })
    .where(
      and(
        eq(conversationMembers.conversationId, conversationId),
        eq(conversationMembers.userId, viewerId),
      ),
    );

  const sender = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, viewerId),
  });
  return toMessageDto(
    {
      message: row,
      sender: {
        id: sender!.id,
        username: sender!.username,
        avatarUrl: sender!.avatarUrl,
      },
    },
    viewerId,
  );
}

export async function markRead(
  conversationId: string,
  viewerId: string,
): Promise<{ ok: true }> {
  await loadMembership(conversationId, viewerId);
  await db
    .update(conversationMembers)
    .set({ lastReadAt: new Date() })
    .where(
      and(
        eq(conversationMembers.conversationId, conversationId),
        eq(conversationMembers.userId, viewerId),
      ),
    );
  return { ok: true };
}

export async function addMembers(
  conversationId: string,
  viewerId: string,
  usernames: string[],
): Promise<ConversationDto> {
  const { conversation, membership } = await loadMembership(
    conversationId,
    viewerId,
  );
  if (conversation.kind !== "group") {
    throw ApiError.validation("You can only add people to a group chat.");
  }
  if (membership.role !== "owner") {
    throw ApiError.forbidden("Only the group owner can add people.");
  }

  const people = (await resolveUsernames(usernames)).filter(
    (u) => u.id !== viewerId,
  );
  for (const u of people) await assertNotBlocked(viewerId, u.id);

  for (const u of people) {
    await db
      .insert(conversationMembers)
      .values({
        conversationId,
        userId: u.id,
        role: "member",
        status: "active",
      })
      .onConflictDoUpdate({
        target: [
          conversationMembers.conversationId,
          conversationMembers.userId,
        ],
        set: { status: "active" },
      });
  }

  return getConversationDto(conversationId, viewerId);
}

export async function leaveConversation(
  conversationId: string,
  viewerId: string,
): Promise<{ ok: true }> {
  const { membership } = await loadMembership(conversationId, viewerId);
  await db
    .update(conversationMembers)
    .set({ status: "left" })
    .where(eq(conversationMembers.id, membership.id));
  return { ok: true };
}

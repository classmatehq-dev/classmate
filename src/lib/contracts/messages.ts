import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

export const chatUserDto = z.object({
  id: z.string().uuid(),
  username: z.string(),
  avatarUrl: z.string().nullable(),
});
export type ChatUserDto = z.infer<typeof chatUserDto>;

export const conversationKind = z.enum(["direct", "group"]);

// ---------------------------------------------------------------------------
// Conversations
// ---------------------------------------------------------------------------

export const conversationDto = z.object({
  id: z.string().uuid(),
  kind: conversationKind,
  /** group name, or the other person's @username for direct chats */
  title: z.string(),
  /** everyone in the chat except the viewer */
  otherMembers: z.array(chatUserDto),
  memberCount: z.number().int().positive(),
  lastMessage: z
    .object({
      body: z.string(),
      senderId: z.string().uuid(),
      senderUsername: z.string(),
      createdAt: z.string(),
    })
    .nullable(),
  unreadCount: z.number().int().nonnegative(),
  updatedAt: z.string(),
  /** viewer is the group owner (can add people / rename) */
  isOwner: z.boolean(),
});
export type ConversationDto = z.infer<typeof conversationDto>;

export const listConversationsResponse = z.array(conversationDto);
export type ListConversationsResponse = z.infer<
  typeof listConversationsResponse
>;

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export const messageDto = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  body: z.string(),
  createdAt: z.string(),
  isMine: z.boolean(),
  sender: chatUserDto,
});
export type MessageDto = z.infer<typeof messageDto>;

export const listMessagesQuery = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(30),
  cursor: z.string().max(500).optional(),
});

export const listMessagesResponse = z.object({
  conversation: conversationDto,
  items: z.array(messageDto),
  nextCursor: z.string().nullable(),
});
export type ListMessagesResponse = z.infer<typeof listMessagesResponse>;

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

const usernameField = z
  .string()
  .trim()
  .min(1, "Enter a username.")
  .max(40)
  .transform((v) => v.replace(/^@/, ""));

export const startDirectBody = z.object({
  username: usernameField,
});
export type StartDirectBody = z.infer<typeof startDirectBody>;

export const createGroupBody = z.object({
  title: z.string().trim().min(1, "Name the group.").max(80),
  usernames: z
    .array(usernameField)
    .min(1, "Add at least one person.")
    .max(50),
});
export type CreateGroupBody = z.infer<typeof createGroupBody>;

export const sendMessageBody = z.object({
  body: z.string().trim().min(1, "Write a message first.").max(4000),
});
export type SendMessageBody = z.infer<typeof sendMessageBody>;

export const addMembersBody = z.object({
  usernames: z.array(usernameField).min(1).max(50),
});
export type AddMembersBody = z.infer<typeof addMembersBody>;

export const unreadCountResponse = z.object({
  count: z.number().int().nonnegative(),
});
export type UnreadCountResponse = z.infer<typeof unreadCountResponse>;

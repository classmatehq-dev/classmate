import { z } from "zod";

export const notificationType = z.enum([
  "comment_on_post",
  "reply_to_comment",
  "like_on_post",
  "like_on_comment",
  "follow",
]);
export type NotificationType = z.infer<typeof notificationType>;

export const notificationActor = z.object({
  username: z.string(),
  avatarUrl: z.string().nullable(),
});

export const notificationDto = z.object({
  id: z.string().uuid(),
  type: notificationType,
  actor: notificationActor.nullable(),
  /** rendered verb phrase, e.g. "commented on your post" */
  text: z.string(),
  /** where clicking the row goes */
  href: z.string(),
  /** snippet of the post/comment involved, if any */
  context: z.string().nullable(),
  isRead: z.boolean(),
  createdAt: z.string(),
});
export type NotificationDto = z.infer<typeof notificationDto>;

export const listNotificationsQuery = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().max(500).optional(),
});

export const listNotificationsResponse = z.object({
  items: z.array(notificationDto),
  nextCursor: z.string().nullable(),
});
export type ListNotificationsResponse = z.infer<
  typeof listNotificationsResponse
>;

export const notificationsUnreadResponse = z.object({
  count: z.number().int().nonnegative(),
});
export type NotificationsUnreadResponse = z.infer<
  typeof notificationsUnreadResponse
>;

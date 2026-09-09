import { relations } from "drizzle-orm";
import {
  type AnyPgColumn,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Classmate database schema (Milestone 1).
 *
 * Conventions:
 * - Code uses camelCase; the DB uses snake_case (configured via `casing: "snake_case"`
 *   on the drizzle client and in drizzle.config.ts).
 * - `normalized*` columns hold a lowercased/trimmed/whitespace-collapsed form used for
 *   dedupe + case-insensitive matching. They are written by the service layer.
 * - Content moderation status lives on the row (`active | hidden | deleted | under_review`).
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const gradeLevelEnum = pgEnum("grade_level", [
  "middle_school",
  "high_school",
  "college",
]);

export const listingStatusEnum = pgEnum("listing_status", [
  "active",
  "pending",
  "hidden",
]);

export const membershipRoleEnum = pgEnum("membership_role", [
  "member",
  "creator",
  "moderator",
]);

export const membershipStatusEnum = pgEnum("membership_status", [
  "active",
  "pending",
  "removed",
]);

export const postTypeEnum = pgEnum("post_type", ["post", "question"]);

export const visibilityEnum = pgEnum("visibility", ["class", "public"]);

export const contentStatusEnum = pgEnum("content_status", [
  "active",
  "hidden",
  "deleted",
  "under_review",
]);

export const helpfulTargetEnum = pgEnum("helpful_target", ["post", "comment"]);

export const reportTargetEnum = pgEnum("report_target", [
  "post",
  "comment",
  "profile",
]);

export const reportCategoryEnum = pgEnum("report_category", [
  "inappropriate",
  "bullying",
  "cheating",
  "spam",
  "privacy",
  "copyright",
  "other",
]);

export const reportStatusEnum = pgEnum("report_status", [
  "open",
  "reviewing",
  "resolved",
  "dismissed",
]);

export const conversationKindEnum = pgEnum("conversation_kind", [
  "direct",
  "group",
]);

export const conversationMemberRoleEnum = pgEnum("conversation_member_role", [
  "owner",
  "member",
]);

export const conversationMemberStatusEnum = pgEnum(
  "conversation_member_status",
  ["active", "left", "removed"],
);

export const messageStatusEnum = pgEnum("message_status", ["active", "deleted"]);

export const attachmentOwnerEnum = pgEnum("attachment_owner", [
  "message",
  "post",
  "comment",
]);

export const attachmentKindEnum = pgEnum("attachment_kind", ["image", "file"]);

const timestamps = {
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
};

// ---------------------------------------------------------------------------
// Users  (Classmate profile; identity is owned by Clerk via clerkUserId)
// ---------------------------------------------------------------------------

export const users = pgTable(
  "users",
  {
    id: uuid().primaryKey().defaultRandom(),
    /** Clerk user id, or a `dev_*` id when AUTH_DEV_BYPASS is on. */
    clerkUserId: text().notNull(),
    username: text().notNull(),
    /** lowercased username, used for the uniqueness check + lookups */
    usernameLower: text().notNull(),
    /** never exposed on public profile responses */
    email: text().notNull(),
    gradeLevel: gradeLevelEnum(),
    bio: text(),
    avatarUrl: text(),
    /** persisted school selection from onboarding step 1 */
    onboardingSchoolId: uuid().references(() => schools.id, {
      onDelete: "set null",
    }),
    onboardingCompletedAt: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("users_clerk_user_id_key").on(t.clerkUserId),
    uniqueIndex("users_username_lower_key").on(t.usernameLower),
  ],
);

// ---------------------------------------------------------------------------
// Schools
// ---------------------------------------------------------------------------

export const schools = pgTable(
  "schools",
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    normalizedName: text().notNull(),
    state: text().notNull(),
    city: text(),
    status: listingStatusEnum().notNull().default("pending"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("schools_normalized_name_state_key").on(
      t.normalizedName,
      t.state,
    ),
  ],
);

// ---------------------------------------------------------------------------
// Teachers  (scoped to a school; not globally unique by name)
// ---------------------------------------------------------------------------

export const teachers = pgTable(
  "teachers",
  {
    id: uuid().primaryKey().defaultRandom(),
    schoolId: uuid()
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    displayName: text().notNull(),
    normalizedName: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("teachers_school_normalized_name_key").on(
      t.schoolId,
      t.normalizedName,
    ),
  ],
);

// ---------------------------------------------------------------------------
// Classes
//
// A class is a subject at a school ("Algebra II" at Marble Falls HS). It may
// optionally be tied to a teacher ("Algebra II · Ms. Smith") — a teacher-less
// class is the general room anyone taking that subject can join.
// ---------------------------------------------------------------------------

export const classes = pgTable(
  "classes",
  {
    id: uuid().primaryKey().defaultRandom(),
    schoolId: uuid()
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    /** null = open to everyone taking this subject, regardless of teacher */
    teacherId: uuid().references(() => teachers.id, { onDelete: "set null" }),
    name: text().notNull(),
    normalizedName: text().notNull(),
    /** denormalized teacher display name ("" when no teacher) */
    teacherName: text(),
    /** normalized teacher name, "" when none — keeps the identity index clean */
    normalizedTeacherName: text().notNull().default(""),
    courseLevel: text(),
    normalizedCourseLevel: text(),
    status: listingStatusEnum().notNull().default("active"),
    createdBy: uuid().references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("classes_identity_key").on(
      t.schoolId,
      t.normalizedName,
      t.normalizedTeacherName,
    ),
  ],
);

// ---------------------------------------------------------------------------
// Class memberships  (separate from the class record)
// ---------------------------------------------------------------------------

export const classMemberships = pgTable(
  "class_memberships",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    classId: uuid()
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    role: membershipRoleEnum().notNull().default("member"),
    status: membershipStatusEnum().notNull().default("active"),
    joinedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    /** advanced by the client when the user views the class feed */
    lastSeenAt: timestamp({ withTimezone: true }),
  },
  (t) => [
    uniqueIndex("class_memberships_user_class_key").on(t.userId, t.classId),
  ],
);

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

export const posts = pgTable("posts", {
  id: uuid().primaryKey().defaultRandom(),
  authorId: uuid()
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  classId: uuid()
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" }),
  type: postTypeEnum().notNull().default("post"),
  body: text().notNull(),
  visibility: visibilityEnum().notNull().default("class"),
  status: contentStatusEnum().notNull().default("active"),
  /** denormalized counters kept in sync by the service layer */
  helpfulCount: integer().notNull().default(0),
  commentCount: integer().notNull().default(0),
  ...timestamps,
});

// ---------------------------------------------------------------------------
// Comments  (threaded replies via parentCommentId)
// ---------------------------------------------------------------------------

export const comments = pgTable("comments", {
  id: uuid().primaryKey().defaultRandom(),
  postId: uuid()
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  authorId: uuid()
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  parentCommentId: uuid().references((): AnyPgColumn => comments.id, {
    onDelete: "cascade",
  }),
  body: text().notNull(),
  status: contentStatusEnum().notNull().default("active"),
  helpfulCount: integer().notNull().default(0),
  ...timestamps,
});

// ---------------------------------------------------------------------------
// Helpful votes  (one per user + target; pressing again removes it)
// ---------------------------------------------------------------------------

export const helpfulVotes = pgTable(
  "helpful_votes",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    targetType: helpfulTargetEnum().notNull(),
    targetId: uuid().notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("helpful_votes_user_target_key").on(
      t.userId,
      t.targetType,
      t.targetId,
    ),
  ],
);

// ---------------------------------------------------------------------------
// Follows
// ---------------------------------------------------------------------------

export const follows = pgTable(
  "follows",
  {
    id: uuid().primaryKey().defaultRandom(),
    followerUserId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    followingUserId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("follows_follower_following_key").on(
      t.followerUserId,
      t.followingUserId,
    ),
  ],
);

// ---------------------------------------------------------------------------
// Reports + blocks  (data model + hooks for future moderation)
// ---------------------------------------------------------------------------

export const reports = pgTable("reports", {
  id: uuid().primaryKey().defaultRandom(),
  reporterUserId: uuid()
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  targetType: reportTargetEnum().notNull(),
  targetId: uuid().notNull(),
  category: reportCategoryEnum().notNull(),
  details: text(),
  status: reportStatusEnum().notNull().default("open"),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});

export const blocks = pgTable(
  "blocks",
  {
    id: uuid().primaryKey().defaultRandom(),
    blockerUserId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    blockedUserId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("blocks_blocker_blocked_key").on(
      t.blockerUserId,
      t.blockedUserId,
    ),
  ],
);

// ---------------------------------------------------------------------------
// Messaging  (1:1 direct conversations + group chats, text only)
// ---------------------------------------------------------------------------

export const conversations = pgTable(
  "conversations",
  {
    id: uuid().primaryKey().defaultRandom(),
    kind: conversationKindEnum().notNull(),
    /** group chat name; null for direct conversations */
    title: text(),
    createdBy: uuid().references(() => users.id, { onDelete: "set null" }),
    /**
     * For direct conversations only: the two member ids sorted and joined as
     * `"<a>:<b>"`. Guarantees one conversation per pair. Null for groups
     * (Postgres lets a unique index hold many nulls).
     */
    directKey: text(),
    /** bumped on every send so conversation lists sort by recency cheaply */
    lastMessageAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    /** denormalized snippet of the most recent message for the list view */
    lastMessagePreview: text(),
    ...timestamps,
  },
  (t) => [uniqueIndex("conversations_direct_key_key").on(t.directKey)],
);

export const conversationMembers = pgTable(
  "conversation_members",
  {
    id: uuid().primaryKey().defaultRandom(),
    conversationId: uuid()
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: conversationMemberRoleEnum().notNull().default("member"),
    status: conversationMemberStatusEnum().notNull().default("active"),
    /** advanced when the user opens the thread; drives unread counts */
    lastReadAt: timestamp({ withTimezone: true }),
    joinedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("conversation_members_conversation_user_key").on(
      t.conversationId,
      t.userId,
    ),
  ],
);

export const messages = pgTable("messages", {
  id: uuid().primaryKey().defaultRandom(),
  conversationId: uuid()
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  senderId: uuid()
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  body: text().notNull(),
  status: messageStatusEnum().notNull().default("active"),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Attachments  (polymorphic: images + files on messages / posts / comments)
// ---------------------------------------------------------------------------

export const attachments = pgTable(
  "attachments",
  {
    id: uuid().primaryKey().defaultRandom(),
    /** which kind of row this hangs off */
    ownerType: attachmentOwnerEnum().notNull(),
    /** id of that message / post / comment (no FK — polymorphic) */
    ownerId: uuid().notNull(),
    uploaderId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: attachmentKindEnum().notNull(),
    /** public Blob URL */
    url: text().notNull(),
    /** Blob pathname — kept so the object can be deleted later */
    pathname: text().notNull(),
    /** original filename, shown in the UI */
    name: text().notNull(),
    contentType: text().notNull(),
    size: integer().notNull(),
    /** natural pixel size for images, so the UI can reserve space */
    width: integer(),
    height: integer(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("attachments_owner_idx").on(t.ownerType, t.ownerId)],
);

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const usersRelations = relations(users, ({ one, many }) => ({
  onboardingSchool: one(schools, {
    fields: [users.onboardingSchoolId],
    references: [schools.id],
  }),
  memberships: many(classMemberships),
  posts: many(posts),
  comments: many(comments),
}));

export const schoolsRelations = relations(schools, ({ many }) => ({
  teachers: many(teachers),
  classes: many(classes),
}));

export const teachersRelations = relations(teachers, ({ one, many }) => ({
  school: one(schools, {
    fields: [teachers.schoolId],
    references: [schools.id],
  }),
  classes: many(classes),
}));

export const classesRelations = relations(classes, ({ one, many }) => ({
  school: one(schools, {
    fields: [classes.schoolId],
    references: [schools.id],
  }),
  teacher: one(teachers, {
    fields: [classes.teacherId],
    references: [teachers.id],
  }),
  memberships: many(classMemberships),
  posts: many(posts),
}));

export const classMembershipsRelations = relations(
  classMemberships,
  ({ one }) => ({
    user: one(users, {
      fields: [classMemberships.userId],
      references: [users.id],
    }),
    class: one(classes, {
      fields: [classMemberships.classId],
      references: [classes.id],
    }),
  }),
);

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, { fields: [posts.authorId], references: [users.id] }),
  class: one(classes, { fields: [posts.classId], references: [classes.id] }),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
  author: one(users, { fields: [comments.authorId], references: [users.id] }),
  parent: one(comments, {
    fields: [comments.parentCommentId],
    references: [comments.id],
    relationName: "comment_thread",
  }),
  replies: many(comments, { relationName: "comment_thread" }),
}));

export const conversationsRelations = relations(
  conversations,
  ({ one, many }) => ({
    creator: one(users, {
      fields: [conversations.createdBy],
      references: [users.id],
    }),
    members: many(conversationMembers),
    messages: many(messages),
  }),
);

export const conversationMembersRelations = relations(
  conversationMembers,
  ({ one }) => ({
    conversation: one(conversations, {
      fields: [conversationMembers.conversationId],
      references: [conversations.id],
    }),
    user: one(users, {
      fields: [conversationMembers.userId],
      references: [users.id],
    }),
  }),
);

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type School = typeof schools.$inferSelect;
export type Teacher = typeof teachers.$inferSelect;
export type Class = typeof classes.$inferSelect;
export type ClassMembership = typeof classMemberships.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type HelpfulVote = typeof helpfulVotes.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type ConversationMember = typeof conversationMembers.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Attachment = typeof attachments.$inferSelect;

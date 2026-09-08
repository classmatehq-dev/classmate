import { relations } from "drizzle-orm";
import {
  type AnyPgColumn,
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
// Classes  (identified by school + teacher + name + optional period)
// ---------------------------------------------------------------------------

export const classes = pgTable(
  "classes",
  {
    id: uuid().primaryKey().defaultRandom(),
    schoolId: uuid()
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    teacherId: uuid()
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    name: text().notNull(),
    normalizedName: text().notNull(),
    courseLevel: text(),
    normalizedCourseLevel: text(),
    period: text(),
    /** "" when no period, so the uniqueness index below behaves */
    normalizedPeriod: text().notNull().default(""),
    status: listingStatusEnum().notNull().default("active"),
    createdBy: uuid().references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("classes_identity_key").on(
      t.schoolId,
      t.teacherId,
      t.normalizedName,
      t.normalizedPeriod,
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

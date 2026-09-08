import { and, eq, ne, sql } from "drizzle-orm";

import type { MeDto, MyClassDto } from "@/lib/contracts/me";
import type { AuthIdentity } from "@/server/auth/identity";
import { onboardingStep } from "@/server/auth/current-user";
import { db } from "@/server/db";
import {
  classMemberships,
  classes,
  posts,
  schools,
  teachers,
  users,
  type User,
} from "@/server/db/schema";
import { ApiError } from "@/server/http/errors";
import { normalizeUsername } from "@/server/lib/normalize";

export function toMeDto(user: User, email: string): MeDto {
  const step = onboardingStep(user);
  return {
    id: user.id,
    username: user.username,
    email,
    gradeLevel: user.gradeLevel,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    onboardingSchoolId: user.onboardingSchoolId,
    onboardingCompleted: user.onboardingCompletedAt != null,
    onboardingStep: step,
  };
}

async function assertUsernameAvailable(username: string, exceptUserId?: string) {
  const lower = normalizeUsername(username);
  const clash = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.usernameLower, lower),
  });
  if (clash && clash.id !== exceptUserId) {
    throw ApiError.conflict("That username is already taken.");
  }
}

export async function createProfile(
  identity: AuthIdentity,
  input: { username: string; gradeLevel: MeDto["gradeLevel"] },
): Promise<User> {
  const existing = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.clerkUserId, identity.clerkUserId),
  });
  if (existing) {
    throw ApiError.conflict("You already have a profile.");
  }

  await assertUsernameAvailable(input.username);

  const [row] = await db
    .insert(users)
    .values({
      clerkUserId: identity.clerkUserId,
      username: input.username.trim(),
      usernameLower: normalizeUsername(input.username),
      email: identity.email,
      gradeLevel: input.gradeLevel ?? null,
    })
    .returning();
  return row;
}

export async function updateProfile(
  user: User,
  patch: {
    username?: string;
    gradeLevel?: MeDto["gradeLevel"];
    bio?: string;
    avatarUrl?: string;
  },
): Promise<User> {
  if (patch.username && normalizeUsername(patch.username) !== user.usernameLower) {
    await assertUsernameAvailable(patch.username, user.id);
  }

  const [row] = await db
    .update(users)
    .set({
      username: patch.username?.trim() ?? user.username,
      usernameLower: patch.username
        ? normalizeUsername(patch.username)
        : user.usernameLower,
      gradeLevel: patch.gradeLevel ?? user.gradeLevel,
      bio: patch.bio !== undefined ? patch.bio || null : user.bio,
      avatarUrl:
        patch.avatarUrl !== undefined
          ? patch.avatarUrl || null
          : user.avatarUrl,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id))
    .returning();
  return row;
}

export async function setOnboardingSchool(
  user: User,
  schoolId: string,
): Promise<User> {
  const school = await db.query.schools.findFirst({
    where: (s, { eq }) => eq(s.id, schoolId),
  });
  if (!school || school.status === "hidden") {
    throw ApiError.validation("Choose a valid school.");
  }

  const [row] = await db
    .update(users)
    .set({ onboardingSchoolId: schoolId, updatedAt: new Date() })
    .where(eq(users.id, user.id))
    .returning();
  return row;
}

export async function completeOnboarding(user: User): Promise<User> {
  if (!user.onboardingSchoolId) {
    throw ApiError.forbidden("Choose your school first.");
  }
  if (user.onboardingCompletedAt) return user;

  const [row] = await db
    .update(users)
    .set({ onboardingCompletedAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, user.id))
    .returning();
  return row;
}

export async function listMyClasses(userId: string): Promise<MyClassDto[]> {
  const newPostCount = sql<number>`(
    select count(*)::int from ${posts} p
    where p.class_id = ${classes.id}
      and p.status = 'active'
      and p.author_id <> ${userId}
      and p.created_at > coalesce(${classMemberships.lastSeenAt}, ${classMemberships.joinedAt})
  )`;
  const postCount = sql<number>`(
    select count(*)::int from ${posts} p
    where p.class_id = ${classes.id} and p.status = 'active'
  )`;

  const rows = await db
    .select({
      id: classes.id,
      name: classes.name,
      teacherName: teachers.displayName,
      schoolName: schools.name,
      lastSeenAt: classMemberships.lastSeenAt,
      newPostCount,
      postCount,
    })
    .from(classMemberships)
    .innerJoin(classes, eq(classes.id, classMemberships.classId))
    .innerJoin(teachers, eq(teachers.id, classes.teacherId))
    .innerJoin(schools, eq(schools.id, classes.schoolId))
    .where(
      and(
        eq(classMemberships.userId, userId),
        eq(classMemberships.status, "active"),
        ne(classes.status, "hidden"),
      ),
    )
    .orderBy(teachers.displayName, classes.name);

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    teacherName: r.teacherName,
    schoolName: r.schoolName,
    newPostCount: r.newPostCount ?? 0,
    postCount: r.postCount ?? 0,
    lastSeenAt: r.lastSeenAt ? r.lastSeenAt.toISOString() : null,
  }));
}

/** used by the feed cursor + "mark class seen" */
export async function markClassSeen(userId: string, classId: string) {
  await db
    .update(classMemberships)
    .set({ lastSeenAt: new Date() })
    .where(
      and(
        eq(classMemberships.userId, userId),
        eq(classMemberships.classId, classId),
      ),
    );
}

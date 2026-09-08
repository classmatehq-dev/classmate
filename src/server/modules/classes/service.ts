import { and, asc, eq, ilike, or, sql } from "drizzle-orm";

import type { ClassDto } from "@/lib/contracts/classes";
import { db } from "@/server/db";
import {
  classMemberships,
  classes,
  schools,
  teachers,
} from "@/server/db/schema";
import { ApiError } from "@/server/http/errors";
import {
  normalizeOptional,
  normalizeName,
  normalizeText,
} from "@/server/lib/normalize";

const activeMemberCount = sql<number>`(
  select count(*)::int from ${classMemberships} m
  where m.class_id = ${classes.id} and m.status = 'active'
)`;

type ClassRow = {
  klass: typeof classes.$inferSelect;
  school: typeof schools.$inferSelect;
  teacher: typeof teachers.$inferSelect;
  memberCount: number;
};

function toDto(row: ClassRow): ClassDto {
  return {
    id: row.klass.id,
    school: {
      id: row.school.id,
      name: row.school.name,
      state: row.school.state,
      city: row.school.city,
      status: row.school.status,
    },
    teacher: { id: row.teacher.id, displayName: row.teacher.displayName },
    name: row.klass.name,
    courseLevel: row.klass.courseLevel,
    period: row.klass.period,
    memberCount: row.memberCount ?? 0,
    status: row.klass.status,
  };
}

const baseSelect = {
  klass: classes,
  school: schools,
  teacher: teachers,
  memberCount: activeMemberCount,
};

export async function listClasses(params: {
  schoolId: string;
  teacherId?: string;
  q?: string;
  limit: number;
}): Promise<ClassDto[]> {
  const filters = [
    eq(classes.schoolId, params.schoolId),
    or(eq(classes.status, "active"), eq(classes.status, "pending")),
  ];
  if (params.teacherId) filters.push(eq(classes.teacherId, params.teacherId));
  if (params.q && params.q.length > 0) {
    const like = `%${params.q}%`;
    filters.push(
      or(ilike(classes.name, like), ilike(teachers.displayName, like)),
    );
  }

  const rows = await db
    .select(baseSelect)
    .from(classes)
    .innerJoin(schools, eq(schools.id, classes.schoolId))
    .innerJoin(teachers, eq(teachers.id, classes.teacherId))
    .where(and(...filters))
    .orderBy(asc(teachers.displayName), asc(classes.name))
    .limit(params.limit);

  return rows.map(toDto);
}

export async function getClassDtoById(id: string): Promise<ClassDto | null> {
  const rows = await db
    .select(baseSelect)
    .from(classes)
    .innerJoin(schools, eq(schools.id, classes.schoolId))
    .innerJoin(teachers, eq(teachers.id, classes.teacherId))
    .where(eq(classes.id, id))
    .limit(1);
  return rows[0] ? toDto(rows[0]) : null;
}

async function resolveTeacher(opts: {
  schoolId: string;
  teacherId?: string;
  teacherName?: string;
}): Promise<string> {
  if (opts.teacherId) {
    const t = await db.query.teachers.findFirst({
      where: (tt, { and, eq }) =>
        and(eq(tt.id, opts.teacherId!), eq(tt.schoolId, opts.schoolId)),
    });
    if (!t) throw ApiError.validation("That teacher isn't at this school.");
    return t.id;
  }

  const displayName = (opts.teacherName ?? "").trim();
  const normalized = normalizeName(displayName);
  if (normalized.length < 2) {
    throw ApiError.validation("Enter a teacher name.");
  }

  const existing = await db.query.teachers.findFirst({
    where: (tt, { and, eq }) =>
      and(eq(tt.schoolId, opts.schoolId), eq(tt.normalizedName, normalized)),
  });
  if (existing) return existing.id;

  const [created] = await db
    .insert(teachers)
    .values({ schoolId: opts.schoolId, displayName, normalizedName: normalized })
    .returning();
  return created.id;
}

/**
 * Create a class, or return the existing one if an identical class already
 * exists (same school + teacher + name + period). `created` tells the caller
 * which happened so it can pick the right membership role.
 */
export async function createOrGetClass(
  input: {
    schoolId: string;
    teacherId?: string;
    teacherName?: string;
    name: string;
    courseLevel?: string;
    period?: string;
  },
  createdByUserId: string,
): Promise<{ klass: ClassDto; created: boolean }> {
  const school = await db.query.schools.findFirst({
    where: (s, { eq }) => eq(s.id, input.schoolId),
  });
  if (!school) throw ApiError.validation("Choose a valid school.");

  const teacherId = await resolveTeacher({
    schoolId: input.schoolId,
    teacherId: input.teacherId,
    teacherName: input.teacherName,
  });

  const normalizedNameValue = normalizeText(input.name);
  const normalizedPeriod = normalizeOptional(input.period);

  const existing = await db.query.classes.findFirst({
    where: (c, { and, eq }) =>
      and(
        eq(c.schoolId, input.schoolId),
        eq(c.teacherId, teacherId),
        eq(c.normalizedName, normalizedNameValue),
        eq(c.normalizedPeriod, normalizedPeriod),
      ),
  });
  if (existing) {
    const dto = await getClassDtoById(existing.id);
    return { klass: dto!, created: false };
  }

  const [row] = await db
    .insert(classes)
    .values({
      schoolId: input.schoolId,
      teacherId,
      name: input.name.trim(),
      normalizedName: normalizedNameValue,
      courseLevel: input.courseLevel?.trim() || null,
      normalizedCourseLevel: input.courseLevel
        ? normalizeText(input.courseLevel)
        : null,
      period: input.period?.trim() || null,
      normalizedPeriod,
      status: "active",
      createdBy: createdByUserId,
    })
    .returning();

  const dto = await getClassDtoById(row.id);
  return { klass: dto!, created: true };
}

// ---------------------------------------------------------------------------
// Membership
// ---------------------------------------------------------------------------

export async function joinClass(
  classId: string,
  userId: string,
  opts: { asRole?: "member" | "creator" } = {},
) {
  const klass = await db.query.classes.findFirst({
    where: (c, { eq }) => eq(c.id, classId),
  });
  if (!klass || klass.status === "hidden") {
    throw ApiError.notFound("We couldn't find that class.");
  }

  // Central entitlement hook (Classmate+ / "one free class" lives here later).
  await assertCanJoinClass(userId, classId);

  const existing = await db.query.classMemberships.findFirst({
    where: (m, { and, eq }) =>
      and(eq(m.userId, userId), eq(m.classId, classId)),
  });

  if (existing) {
    if (existing.status === "removed") {
      throw ApiError.forbidden("You were removed from this class.");
    }
    return existing;
  }

  const [membership] = await db
    .insert(classMemberships)
    .values({
      userId,
      classId,
      role: opts.asRole ?? "member",
      status: "active",
    })
    .returning();
  return membership;
}

/**
 * Central entitlement check. MVP: unlimited. Later this enforces
 * "one class free, more with Classmate+".
 */
export async function assertCanJoinClass(
  _userId: string,
  _classId: string,
): Promise<void> {
  return;
}

/** Throws unless the user is an active member of the class. */
export async function requireActiveMembership(userId: string, classId: string) {
  const membership = await db.query.classMemberships.findFirst({
    where: (m, { and, eq }) =>
      and(eq(m.userId, userId), eq(m.classId, classId)),
  });
  if (!membership || membership.status !== "active") {
    throw ApiError.forbidden("You must join this class first.");
  }
  return membership;
}

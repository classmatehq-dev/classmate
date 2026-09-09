import { and, asc, eq, ilike, ne, or, sql } from "drizzle-orm";

import type { ClassDto } from "@/lib/contracts/classes";
import { db } from "@/server/db";
import { classMemberships, classes, schools, teachers } from "@/server/db/schema";
import { ApiError } from "@/server/http/errors";
import { normalizeName, normalizeText } from "@/server/lib/normalize";

const activeMemberCount = sql<number>`(
  select count(*)::int from ${classMemberships} m
  where m.class_id = ${classes.id} and m.status = 'active'
)`;

type ClassRow = {
  klass: typeof classes.$inferSelect;
  school: typeof schools.$inferSelect;
  teacher: typeof teachers.$inferSelect | null;
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
    teacher: row.teacher
      ? { id: row.teacher.id, displayName: row.teacher.displayName }
      : null,
    name: row.klass.name,
    courseLevel: row.klass.courseLevel,
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
      or(ilike(classes.name, like), ilike(classes.teacherName, like)),
    );
  }

  const rows = await db
    .select(baseSelect)
    .from(classes)
    .innerJoin(schools, eq(schools.id, classes.schoolId))
    .leftJoin(teachers, eq(teachers.id, classes.teacherId))
    .where(and(...filters))
    // group by subject, general room first, then teacher sections alphabetically
    .orderBy(
      asc(classes.normalizedName),
      asc(classes.normalizedTeacherName),
    )
    .limit(params.limit);

  return rows.map(toDto);
}

export async function getClassDtoById(id: string): Promise<ClassDto | null> {
  const rows = await db
    .select(baseSelect)
    .from(classes)
    .innerJoin(schools, eq(schools.id, classes.schoolId))
    .leftJoin(teachers, eq(teachers.id, classes.teacherId))
    .where(eq(classes.id, id))
    .limit(1);
  return rows[0] ? toDto(rows[0]) : null;
}

/** teacher sections of the same subject at the same school (excluding `classId`) */
export async function listSiblingSections(classId: string): Promise<ClassDto[]> {
  const klass = await db.query.classes.findFirst({
    where: (c, { eq }) => eq(c.id, classId),
  });
  if (!klass) return [];

  const rows = await db
    .select(baseSelect)
    .from(classes)
    .innerJoin(schools, eq(schools.id, classes.schoolId))
    .leftJoin(teachers, eq(teachers.id, classes.teacherId))
    .where(
      and(
        eq(classes.schoolId, klass.schoolId),
        eq(classes.normalizedName, klass.normalizedName),
        ne(classes.id, classId),
        or(eq(classes.status, "active"), eq(classes.status, "pending")),
      ),
    )
    .orderBy(asc(classes.normalizedTeacherName))
    .limit(20);

  return rows.map(toDto);
}

/**
 * Resolve a teacher for a class. Returns null when no teacher was given (the
 * class is then the general room for everyone taking the subject).
 */
async function resolveTeacher(opts: {
  schoolId: string;
  teacherId?: string;
  teacherName?: string;
}): Promise<{ id: string; displayName: string } | null> {
  if (opts.teacherId) {
    const t = await db.query.teachers.findFirst({
      where: (tt, { and, eq }) =>
        and(eq(tt.id, opts.teacherId!), eq(tt.schoolId, opts.schoolId)),
    });
    if (!t) throw ApiError.validation("That teacher isn't at this school.");
    return { id: t.id, displayName: t.displayName };
  }

  const displayName = (opts.teacherName ?? "").trim();
  if (displayName.length === 0) return null;

  const normalized = normalizeName(displayName);
  const existing = await db.query.teachers.findFirst({
    where: (tt, { and, eq }) =>
      and(eq(tt.schoolId, opts.schoolId), eq(tt.normalizedName, normalized)),
  });
  if (existing) {
    return { id: existing.id, displayName: existing.displayName };
  }

  const [created] = await db
    .insert(teachers)
    .values({ schoolId: opts.schoolId, displayName, normalizedName: normalized })
    .returning();
  return { id: created.id, displayName: created.displayName };
}

/**
 * Create a class, or return the existing one identified by
 * (school + subject name + teacher). `created` tells the caller which happened.
 */
export async function createOrGetClass(
  input: {
    schoolId: string;
    teacherId?: string;
    teacherName?: string;
    name: string;
    courseLevel?: string;
  },
  createdByUserId: string,
): Promise<{ klass: ClassDto; created: boolean }> {
  const school = await db.query.schools.findFirst({
    where: (s, { eq }) => eq(s.id, input.schoolId),
  });
  if (!school) throw ApiError.validation("Choose a valid school.");

  const teacher = await resolveTeacher({
    schoolId: input.schoolId,
    teacherId: input.teacherId,
    teacherName: input.teacherName,
  });

  const normalizedNameValue = normalizeText(input.name);
  const normalizedTeacher = teacher ? normalizeName(teacher.displayName) : "";

  const existing = await db.query.classes.findFirst({
    where: (c, { and, eq }) =>
      and(
        eq(c.schoolId, input.schoolId),
        eq(c.normalizedName, normalizedNameValue),
        eq(c.normalizedTeacherName, normalizedTeacher),
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
      teacherId: teacher?.id ?? null,
      teacherName: teacher?.displayName ?? null,
      normalizedTeacherName: normalizedTeacher,
      name: input.name.trim(),
      normalizedName: normalizedNameValue,
      courseLevel: input.courseLevel?.trim() || null,
      normalizedCourseLevel: input.courseLevel
        ? normalizeText(input.courseLevel)
        : null,
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

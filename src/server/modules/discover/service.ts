import { and, desc, eq, ilike, ne, or, sql } from "drizzle-orm";

import type { DiscoverResponse } from "@/lib/contracts/discover";
import { db } from "@/server/db";
import {
  classMemberships,
  classes,
  schools,
  teachers,
  users,
} from "@/server/db/schema";

const activeMemberCount = sql<number>`(
  select count(*)::int from ${classMemberships} m
  where m.class_id = ${classes.id} and m.status = 'active'
)`;

const helpfulReceived = sql<number>`(
  coalesce((select sum(helpful_count) from posts where author_id = ${users.id} and status <> 'deleted'), 0)
  + coalesce((select sum(helpful_count) from comments where author_id = ${users.id} and status <> 'deleted'), 0)
)::int`;

export async function discover(
  q: string | undefined,
  viewerId: string,
): Promise<DiscoverResponse> {
  const query = (q ?? "").trim();

  // Empty query → show a sample of active classes + a few helpful students.
  const classFilter =
    query.length > 0
      ? and(
          eq(classes.status, "active"),
          or(
            ilike(classes.name, `%${query}%`),
            ilike(teachers.displayName, `%${query}%`),
            ilike(schools.name, `%${query}%`),
          ),
        )
      : eq(classes.status, "active");

  const classRows = await db
    .select({
      id: classes.id,
      name: classes.name,
      teacherName: teachers.displayName,
      schoolName: schools.name,
      state: schools.state,
      memberCount: activeMemberCount,
    })
    .from(classes)
    .innerJoin(teachers, eq(teachers.id, classes.teacherId))
    .innerJoin(schools, eq(schools.id, classes.schoolId))
    .where(classFilter)
    .orderBy(desc(activeMemberCount), classes.name)
    .limit(12);

  const studentRows = await db
    .select({
      id: users.id,
      username: users.username,
      avatarUrl: users.avatarUrl,
      gradeLevel: users.gradeLevel,
      helpfulReceived,
    })
    .from(users)
    .where(
      query.length > 0
        ? and(
            ne(users.id, viewerId),
            ilike(users.username, `%${query}%`),
          )
        : ne(users.id, viewerId),
    )
    .orderBy(desc(helpfulReceived), users.username)
    .limit(12);

  return {
    query,
    classes: classRows.map((r) => ({
      ...r,
      memberCount: r.memberCount ?? 0,
    })),
    students: studentRows.map((r) => ({
      id: r.id,
      username: r.username,
      avatarUrl: r.avatarUrl,
      gradeLevel: r.gradeLevel,
      helpfulReceived: r.helpfulReceived ?? 0,
    })),
  };
}

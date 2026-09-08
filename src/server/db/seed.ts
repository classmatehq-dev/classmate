import { eq } from "drizzle-orm";

import {
  normalizeName,
  normalizeOptional,
  normalizeText,
  normalizeUsername,
} from "@/server/lib/normalize";
import { db } from "./index";
import {
  classMemberships,
  classes,
  comments,
  posts,
  schools,
  teachers,
  users,
} from "./schema";

/**
 * Idempotent demo data. Safe to run repeatedly.
 * Fictional school / teachers / students only.
 */

async function upsertSchool() {
  const name = "Marble Falls High School";
  const state = "Texas";
  const normalizedName = normalizeText(name);
  const existing = await db.query.schools.findFirst({
    where: (s, { and, eq }) =>
      and(eq(s.normalizedName, normalizedName), eq(s.state, state)),
  });
  if (existing) return existing;
  const [row] = await db
    .insert(schools)
    .values({
      name,
      normalizedName,
      state,
      city: "Marble Falls",
      status: "active",
    })
    .returning();
  return row;
}

async function upsertTeacher(schoolId: string, displayName: string) {
  const normalizedName = normalizeName(displayName);
  const existing = await db.query.teachers.findFirst({
    where: (t, { and, eq }) =>
      and(eq(t.schoolId, schoolId), eq(t.normalizedName, normalizedName)),
  });
  if (existing) return existing;
  const [row] = await db
    .insert(teachers)
    .values({ schoolId, displayName, normalizedName })
    .returning();
  return row;
}

async function upsertUser(opts: {
  username: string;
  email: string;
  clerkUserId: string;
  onboardingSchoolId: string;
}) {
  const usernameLower = normalizeUsername(opts.username);
  const existing = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.usernameLower, usernameLower),
  });
  if (existing) return existing;
  const [row] = await db
    .insert(users)
    .values({
      username: opts.username,
      usernameLower,
      email: opts.email,
      clerkUserId: opts.clerkUserId,
      gradeLevel: "high_school",
      onboardingSchoolId: opts.onboardingSchoolId,
      onboardingCompletedAt: new Date(),
    })
    .returning();
  return row;
}

async function upsertClass(opts: {
  schoolId: string;
  teacherId: string;
  name: string;
  courseLevel?: string;
  period?: string;
  createdBy: string;
}) {
  const normalizedNameValue = normalizeText(opts.name);
  const normalizedPeriod = normalizeOptional(opts.period);
  const existing = await db.query.classes.findFirst({
    where: (c, { and, eq }) =>
      and(
        eq(c.schoolId, opts.schoolId),
        eq(c.teacherId, opts.teacherId),
        eq(c.normalizedName, normalizedNameValue),
        eq(c.normalizedPeriod, normalizedPeriod),
      ),
  });
  if (existing) return existing;
  const [row] = await db
    .insert(classes)
    .values({
      schoolId: opts.schoolId,
      teacherId: opts.teacherId,
      name: opts.name,
      normalizedName: normalizedNameValue,
      courseLevel: opts.courseLevel ?? null,
      normalizedCourseLevel: opts.courseLevel
        ? normalizeText(opts.courseLevel)
        : null,
      period: opts.period ?? null,
      normalizedPeriod,
      status: "active",
      createdBy: opts.createdBy,
    })
    .returning();
  return row;
}

async function ensureMembership(
  userId: string,
  classId: string,
  role: "member" | "creator" | "moderator",
) {
  const existing = await db.query.classMemberships.findFirst({
    where: (m, { and, eq }) =>
      and(eq(m.userId, userId), eq(m.classId, classId)),
  });
  if (existing) return existing;
  const [row] = await db
    .insert(classMemberships)
    .values({ userId, classId, role, status: "active" })
    .returning();
  return row;
}

async function ensurePost(opts: {
  authorId: string;
  classId: string;
  type: "post" | "question";
  body: string;
}) {
  const existing = await db.query.posts.findFirst({
    where: (p, { and, eq }) =>
      and(eq(p.authorId, opts.authorId), eq(p.classId, opts.classId), eq(p.body, opts.body)),
  });
  if (existing) return existing;
  const [row] = await db
    .insert(posts)
    .values({
      authorId: opts.authorId,
      classId: opts.classId,
      type: opts.type,
      body: opts.body,
      visibility: "class",
      status: "active",
    })
    .returning();
  return row;
}

async function main() {
  const school = await upsertSchool();
  console.log(`school: ${school.name} (${school.id})`);

  const smith = await upsertTeacher(school.id, "Mrs. Smith");
  const johnson = await upsertTeacher(school.id, "Mr. Johnson");
  const davis = await upsertTeacher(school.id, "Mrs. Davis");

  const sarah = await upsertUser({
    username: "Sarah",
    email: "sarah@example.com",
    clerkUserId: "dev_seed_sarah",
    onboardingSchoolId: school.id,
  });
  const jacob = await upsertUser({
    username: "Jacob",
    email: "jacob@example.com",
    clerkUserId: "dev_seed_jacob",
    onboardingSchoolId: school.id,
  });
  const maria = await upsertUser({
    username: "Maria",
    email: "maria@example.com",
    clerkUserId: "dev_seed_maria",
    onboardingSchoolId: school.id,
  });

  const biology = await upsertClass({
    schoolId: school.id,
    teacherId: smith.id,
    name: "Biology",
    courseLevel: "11th Grade",
    period: "3rd Period",
    createdBy: sarah.id,
  });
  const algebra = await upsertClass({
    schoolId: school.id,
    teacherId: johnson.id,
    name: "Algebra II",
    courseLevel: "11th Grade",
    createdBy: jacob.id,
  });
  const english = await upsertClass({
    schoolId: school.id,
    teacherId: davis.id,
    name: "English III",
    courseLevel: "11th Grade",
    createdBy: maria.id,
  });

  await ensureMembership(sarah.id, biology.id, "creator");
  await ensureMembership(jacob.id, biology.id, "member");
  await ensureMembership(maria.id, biology.id, "member");
  await ensureMembership(jacob.id, algebra.id, "creator");
  await ensureMembership(sarah.id, algebra.id, "member");
  await ensureMembership(maria.id, english.id, "creator");

  const p1 = await ensurePost({
    authorId: sarah.id,
    classId: biology.id,
    type: "post",
    body: "I made a study guide for Unit 3 if anyone needs it. Covers cell respiration + photosynthesis.",
  });
  await ensurePost({
    authorId: jacob.id,
    classId: biology.id,
    type: "question",
    body: "Does anyone understand the difference between mitosis and meiosis for the quiz Friday?",
  });
  await ensurePost({
    authorId: jacob.id,
    classId: algebra.id,
    type: "question",
    body: "How do you know when to use the quadratic formula vs factoring?",
  });

  // one comment thread on p1
  const existingComment = await db.query.comments.findFirst({
    where: (c, { eq }) => eq(c.postId, p1.id),
  });
  if (!existingComment) {
    const [c1] = await db
      .insert(comments)
      .values({
        postId: p1.id,
        authorId: jacob.id,
        body: "This is really helpful, thanks Sarah!",
      })
      .returning();
    await db.insert(comments).values({
      postId: p1.id,
      authorId: sarah.id,
      parentCommentId: c1.id,
      body: "No problem — let me know if anything is unclear.",
    });
    await db
      .update(posts)
      .set({ commentCount: 2 })
      .where(eq(posts.id, p1.id));
  }

  console.log("seed complete");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

import { and, eq, sql } from "drizzle-orm";

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
  helpfulVotes,
  posts,
  schools,
  teachers,
  users,
} from "./schema";

/**
 * Rich demo data for Marble Falls High School — realistic academic content so a
 * new student lands in a lively class, not an empty feed.
 *
 * Idempotent-ish: safe to re-run, but `npm run db:reset` first for a clean slate.
 * All fictional. No real student information.
 */

const now = Date.now();
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const ago = (days: number, hours = 0) => new Date(now - days * DAY - hours * HOUR);

// ---------------------------------------------------------------------------

async function getOrCreateSchool() {
  const name = "Marble Falls High School";
  const state = "Texas";
  const normalizedName = normalizeText(name);
  const existing = await db.query.schools.findFirst({
    where: and(
      eq(schools.normalizedName, normalizedName),
      eq(schools.state, state),
    ),
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

async function getOrCreateTeacher(schoolId: string, displayName: string) {
  const normalizedName = normalizeName(displayName);
  const existing = await db.query.teachers.findFirst({
    where: and(
      eq(teachers.schoolId, schoolId),
      eq(teachers.normalizedName, normalizedName),
    ),
  });
  if (existing) return existing;
  const [row] = await db
    .insert(teachers)
    .values({ schoolId, displayName, normalizedName })
    .returning();
  return row;
}

async function getOrCreateUser(opts: {
  username: string;
  bio?: string;
  schoolId: string;
}) {
  const usernameLower = normalizeUsername(opts.username);
  const existing = await db.query.users.findFirst({
    where: eq(users.usernameLower, usernameLower),
  });
  if (existing) return existing;
  const [row] = await db
    .insert(users)
    .values({
      username: opts.username,
      usernameLower,
      email: `${usernameLower}@demo.classmate.app`,
      clerkUserId: `demo_${usernameLower}`,
      gradeLevel: "high_school",
      bio: opts.bio ?? null,
      onboardingSchoolId: opts.schoolId,
      onboardingCompletedAt: ago(20),
    })
    .returning();
  return row;
}

async function getOrCreateClass(opts: {
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
    where: and(
      eq(classes.schoolId, opts.schoolId),
      eq(classes.teacherId, opts.teacherId),
      eq(classes.normalizedName, normalizedNameValue),
      eq(classes.normalizedPeriod, normalizedPeriod),
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
      createdAt: ago(21),
      updatedAt: ago(21),
    })
    .returning();
  return row;
}

async function ensureMembership(
  userId: string,
  classId: string,
  role: "member" | "creator" | "moderator" = "member",
) {
  const existing = await db.query.classMemberships.findFirst({
    where: and(
      eq(classMemberships.userId, userId),
      eq(classMemberships.classId, classId),
    ),
  });
  if (existing) return existing;
  const [row] = await db
    .insert(classMemberships)
    .values({ userId, classId, role, status: "active", joinedAt: ago(19) })
    .returning();
  return row;
}

async function addPost(opts: {
  authorId: string;
  classId: string;
  type: "post" | "question";
  body: string;
  at: Date;
  helpful?: number;
}) {
  const [row] = await db
    .insert(posts)
    .values({
      authorId: opts.authorId,
      classId: opts.classId,
      type: opts.type,
      body: opts.body,
      visibility: "class",
      status: "active",
      helpfulCount: opts.helpful ?? 0,
      createdAt: opts.at,
      updatedAt: opts.at,
    })
    .returning();
  return row;
}

async function addComment(opts: {
  postId: string;
  authorId: string;
  body: string;
  at: Date;
  parentCommentId?: string;
  helpful?: number;
}) {
  const [row] = await db
    .insert(comments)
    .values({
      postId: opts.postId,
      authorId: opts.authorId,
      parentCommentId: opts.parentCommentId ?? null,
      body: opts.body,
      status: "active",
      helpfulCount: opts.helpful ?? 0,
      createdAt: opts.at,
      updatedAt: opts.at,
    })
    .returning();
  return row;
}

/** spread `count` helpful votes across the given members for a target */
async function spreadHelpful(
  targetType: "post" | "comment",
  targetId: string,
  voterIds: string[],
  count: number,
) {
  const voters = voterIds.slice(0, count);
  for (const userId of voters) {
    await db
      .insert(helpfulVotes)
      .values({ userId, targetType, targetId })
      .onConflictDoNothing();
  }
}

// ---------------------------------------------------------------------------

async function main() {
  const school = await getOrCreateSchool();

  const smith = await getOrCreateTeacher(school.id, "Mrs. Smith");
  const johnson = await getOrCreateTeacher(school.id, "Mr. Johnson");
  const davis = await getOrCreateTeacher(school.id, "Mrs. Davis");
  const lee = await getOrCreateTeacher(school.id, "Mr. Lee");
  const nguyen = await getOrCreateTeacher(school.id, "Ms. Nguyen");

  const sarah = await getOrCreateUser({
    username: "Sarah",
    bio: "11th grade. I take way too many notes — happy to share.",
    schoolId: school.id,
  });
  const jacob = await getOrCreateUser({ username: "Jacob", schoolId: school.id });
  const maria = await getOrCreateUser({
    username: "Maria",
    bio: "Debate team. Ask me about essays.",
    schoolId: school.id,
  });
  const devon = await getOrCreateUser({ username: "Devon", schoolId: school.id });
  const priya = await getOrCreateUser({ username: "Priya", schoolId: school.id });
  const marcus = await getOrCreateUser({ username: "Marcus", schoolId: school.id });
  const emma = await getOrCreateUser({
    username: "Emma",
    bio: "Flashcard enthusiast.",
    schoolId: school.id,
  });
  const chris = await getOrCreateUser({ username: "Chris", schoolId: school.id });

  const everyone = [sarah, jacob, maria, devon, priya, marcus, emma, chris];
  const voterIds = everyone.map((u) => u.id);

  // --- classes ---
  const biology = await getOrCreateClass({
    schoolId: school.id,
    teacherId: smith.id,
    name: "Biology",
    courseLevel: "11th Grade",
    period: "3rd Period",
    createdBy: sarah.id,
  });
  const chemistry = await getOrCreateClass({
    schoolId: school.id,
    teacherId: lee.id,
    name: "Chemistry",
    courseLevel: "10th Grade",
    period: "2nd Period",
    createdBy: marcus.id,
  });
  const algebra = await getOrCreateClass({
    schoolId: school.id,
    teacherId: johnson.id,
    name: "Algebra II",
    courseLevel: "11th Grade",
    createdBy: jacob.id,
  });
  const english = await getOrCreateClass({
    schoolId: school.id,
    teacherId: davis.id,
    name: "English III",
    courseLevel: "11th Grade",
    period: "1st Period",
    createdBy: maria.id,
  });
  const history = await getOrCreateClass({
    schoolId: school.id,
    teacherId: nguyen.id,
    name: "US History",
    courseLevel: "11th Grade",
    period: "5th Period",
    createdBy: emma.id,
  });

  // --- memberships ---
  const roster: Record<string, typeof everyone> = {
    [biology.id]: [sarah, jacob, maria, devon, priya, emma, chris],
    [chemistry.id]: [marcus, maria, priya, devon, chris],
    [algebra.id]: [jacob, sarah, devon, marcus, emma],
    [english.id]: [maria, priya, sarah, chris],
    [history.id]: [emma, marcus, jacob, devon, priya, chris],
  };
  for (const [classId, members] of Object.entries(roster)) {
    for (const m of members) {
      const isCreator =
        (classId === biology.id && m.id === sarah.id) ||
        (classId === chemistry.id && m.id === marcus.id) ||
        (classId === algebra.id && m.id === jacob.id) ||
        (classId === english.id && m.id === maria.id) ||
        (classId === history.id && m.id === emma.id);
      await ensureMembership(m.id, classId, isCreator ? "creator" : "member");
    }
  }

  // --- posts + threads ---
  const p1 = await addPost({
    authorId: sarah.id,
    classId: biology.id,
    type: "post",
    body: "I made a study guide for Unit 3 (cellular respiration + photosynthesis). Covers everything from the lecture — link in the comments.",
    at: ago(6),
    helpful: 24,
  });
  await spreadHelpful("post", p1.id, voterIds, 24 % voterIds.length || voterIds.length);
  const c1 = await addComment({
    postId: p1.id,
    authorId: jacob.id,
    body: "This is really helpful, thank you Sarah!",
    at: ago(5, 20),
    helpful: 3,
  });
  await addComment({
    postId: p1.id,
    authorId: sarah.id,
    parentCommentId: c1.id,
    body: "No problem — let me know if anything's unclear.",
    at: ago(5, 18),
  });
  const c2 = await addComment({
    postId: p1.id,
    authorId: priya.id,
    body: "Saved. Do you have anything for Unit 2 as well?",
    at: ago(4),
  });
  await addComment({
    postId: p1.id,
    authorId: sarah.id,
    parentCommentId: c2.id,
    body: "Not yet, but I'll try to put one together this weekend.",
    at: ago(3, 22),
  });

  const p2 = await addPost({
    authorId: jacob.id,
    classId: biology.id,
    type: "question",
    body: "Can someone explain the difference between mitosis and meiosis? I keep mixing them up and the quiz is Friday.",
    at: ago(5),
    helpful: 4,
  });
  await spreadHelpful("post", p2.id, voterIds, 4);
  const c3 = await addComment({
    postId: p2.id,
    authorId: sarah.id,
    body: "Mitosis = one division, two identical cells, used for growth and repair. Meiosis = two divisions, four cells with half the chromosomes, used to make egg/sperm cells. That's the short version.",
    at: ago(4, 20),
    helpful: 7,
  });
  await spreadHelpful("comment", c3.id, voterIds, 7);
  await addComment({
    postId: p2.id,
    authorId: jacob.id,
    parentCommentId: c3.id,
    body: "Okay that actually makes sense now. Thanks!",
    at: ago(4, 19),
  });
  await addComment({
    postId: p2.id,
    authorId: devon.id,
    body: "Mrs. Smith also said to focus on prophase I of meiosis because of crossing over.",
    at: ago(4, 10),
    helpful: 2,
  });

  await addPost({
    authorId: devon.id,
    classId: biology.id,
    type: "post",
    body: "Heads up: Mrs. Smith confirmed the Friday quiz only covers 8.1–8.4, not 8.5.",
    at: ago(3),
    helpful: 11,
  }).then((p) => spreadHelpful("post", p.id, voterIds, 11 % voterIds.length || 7));

  await addPost({
    authorId: priya.id,
    classId: biology.id,
    type: "question",
    body: "What's the actual difference between the light reactions and the Calvin cycle? I understand them separately but not how they connect.",
    at: ago(1, 4),
    helpful: 2,
  });

  const pFlash = await addPost({
    authorId: emma.id,
    classId: biology.id,
    type: "post",
    body: "Made a Quizlet with all the Unit 3 vocab if it helps anyone before Friday — link below.",
    at: ago(0, 5),
    helpful: 6,
  });
  await spreadHelpful("post", pFlash.id, voterIds, 6);
  await addComment({
    postId: pFlash.id,
    authorId: devon.id,
    body: "You're a lifesaver, thanks Emma",
    at: ago(0, 3),
  });

  // Chemistry
  const pRedox = await addPost({
    authorId: marcus.id,
    classId: chemistry.id,
    type: "question",
    body: "How do you balance redox equations? I'm stuck on problem 14 on the review sheet.",
    at: ago(4),
    helpful: 3,
  });
  const cRedox = await addComment({
    postId: pRedox.id,
    authorId: maria.id,
    body: "Split it into two half-reactions first, balance the atoms, then balance the charge by adding electrons. Combine at the end.",
    at: ago(3, 20),
    helpful: 5,
  });
  await spreadHelpful("comment", cRedox.id, voterIds, 5);
  await addComment({
    postId: pRedox.id,
    authorId: marcus.id,
    parentCommentId: cRedox.id,
    body: "Trying that now — think I've got it.",
    at: ago(3, 18),
  });

  await addPost({
    authorId: maria.id,
    classId: chemistry.id,
    type: "post",
    body: "Mr. Lee's review sheet answer key (he handed it out in class but a lot of people were out). Photos in the comments.",
    at: ago(2),
    helpful: 15,
  }).then((p) => spreadHelpful("post", p.id, voterIds, 15 % voterIds.length || 5));

  await addPost({
    authorId: chris.id,
    classId: chemistry.id,
    type: "question",
    body: "Is the molar mass test open-note or no?",
    at: ago(0, 7),
  });

  // Algebra II
  const pQuad = await addPost({
    authorId: jacob.id,
    classId: algebra.id,
    type: "question",
    body: "How do you know when to use the quadratic formula vs. just factoring?",
    at: ago(7),
    helpful: 9,
  });
  await spreadHelpful("post", pQuad.id, voterIds, 9 % voterIds.length || 5);
  await addComment({
    postId: pQuad.id,
    authorId: sarah.id,
    body: "Try factoring first — if the numbers aren't clean in like 20 seconds, switch to the formula. The formula always works, factoring is just faster when it's nice.",
    at: ago(6, 20),
    helpful: 6,
  }).then((c) => spreadHelpful("comment", c.id, voterIds, 6));

  await addPost({
    authorId: sarah.id,
    classId: algebra.id,
    type: "post",
    body: "Desmos trick: type your equation in and it shows the roots. Quick way to check if your factoring is right.",
    at: ago(5),
    helpful: 12,
  }).then((p) => spreadHelpful("post", p.id, voterIds, 12 % voterIds.length || 6));

  await addPost({
    authorId: devon.id,
    classId: algebra.id,
    type: "question",
    body: "Homework 5.3 #12 — I keep getting a negative under the square root. Is that supposed to happen or am I doing something wrong?",
    at: ago(2),
    helpful: 1,
  });

  // English III
  const pThesis = await addPost({
    authorId: maria.id,
    classId: english.id,
    type: "post",
    body: "Thesis statements Mrs. Davis marked as strong on the last essay, with her margin comments. Good to model the Gatsby one after.",
    at: ago(4),
    helpful: 8,
  });
  await spreadHelpful("post", pThesis.id, voterIds, 8);
  await addPost({
    authorId: priya.id,
    classId: english.id,
    type: "question",
    body: "For the Gatsby essay do we need outside sources or just the book?",
    at: ago(1),
    helpful: 2,
  }).then(async (p) => {
    await addComment({
      postId: p.id,
      authorId: maria.id,
      body: "Just the book — she said no outside sources this time.",
      at: ago(0, 20),
      helpful: 3,
    });
  });

  // US History
  await addPost({
    authorId: emma.id,
    classId: history.id,
    type: "post",
    body: "Color-coded timeline of the whole Progressive Era for the test — presidents in blue, amendments in green, court cases in red.",
    at: ago(3),
    helpful: 18,
  }).then((p) => spreadHelpful("post", p.id, voterIds, 18 % voterIds.length || 6));

  await addPost({
    authorId: marcus.id,
    classId: history.id,
    type: "question",
    body: "Does anyone have notes from Tuesday? I was out sick and Ms. Nguyen went fast apparently.",
    at: ago(2),
    helpful: 1,
  });

  // reconcile denormalized counters from the rows we actually inserted
  await db.execute(sql`
    update posts p set
      helpful_count = (select count(*) from helpful_votes v where v.target_type = 'post' and v.target_id = p.id),
      comment_count = (select count(*) from comments c where c.post_id = p.id and c.status = 'active')
  `);
  await db.execute(sql`
    update comments c set
      helpful_count = (select count(*) from helpful_votes v where v.target_type = 'comment' and v.target_id = c.id)
  `);

  console.log(
    "seed complete: Marble Falls High School — 5 classes, 8 students, activity across the past week",
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

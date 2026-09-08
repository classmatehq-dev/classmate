import { z } from "zod";

import { limitParam, listingStatus } from "./common";
import { schoolDto } from "./schools";

export const listClassesQuery = z.object({
  schoolId: z.string().uuid("A school is required."),
  teacherId: z.string().uuid().optional(),
  q: z.string().trim().max(120).optional(),
  limit: limitParam,
});
export type ListClassesQuery = z.infer<typeof listClassesQuery>;

export const teacherDto = z.object({
  id: z.string().uuid(),
  displayName: z.string(),
});
export type TeacherDto = z.infer<typeof teacherDto>;

export const classDto = z.object({
  id: z.string().uuid(),
  school: schoolDto,
  teacher: teacherDto,
  name: z.string(),
  courseLevel: z.string().nullable(),
  period: z.string().nullable(),
  memberCount: z.number().int().nonnegative(),
  status: listingStatus,
});
export type ClassDto = z.infer<typeof classDto>;

export const listClassesResponse = z.array(classDto);

export const createClassBody = z
  .object({
    schoolId: z.string().uuid(),
    teacherId: z.string().uuid().optional(),
    teacherName: z.string().trim().min(2).max(80).optional(),
    name: z.string().trim().min(2, "Enter the class name.").max(80),
    courseLevel: z.string().trim().max(60).optional(),
    period: z.string().trim().max(40).optional(),
  })
  .refine((v) => v.teacherId != null || (v.teacherName != null && v.teacherName.length > 0), {
    message: "Choose a teacher or enter a teacher name.",
    path: ["teacherName"],
  });
export type CreateClassBody = z.infer<typeof createClassBody>;

export const classMembershipDto = z.object({
  classId: z.string().uuid(),
  role: z.enum(["member", "creator", "moderator"]),
  status: z.enum(["active", "pending", "removed"]),
  joinedAt: z.string(),
});
export type ClassMembershipDto = z.infer<typeof classMembershipDto>;

export const joinClassResponse = z.object({
  membership: classMembershipDto,
  class: classDto,
});
export type JoinClassResponse = z.infer<typeof joinClassResponse>;

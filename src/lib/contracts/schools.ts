import { z } from "zod";

import { limitParam, listingStatus } from "./common";

export const listSchoolsQuery = z.object({
  state: z.string().trim().min(1).max(60).optional(),
  q: z.string().trim().max(120).optional(),
  limit: limitParam,
});
export type ListSchoolsQuery = z.infer<typeof listSchoolsQuery>;

export const schoolDto = z.object({
  id: z.string().uuid(),
  name: z.string(),
  state: z.string(),
  city: z.string().nullable(),
  status: listingStatus,
});
export type SchoolDto = z.infer<typeof schoolDto>;

export const listSchoolsResponse = z.array(schoolDto);

export const createSchoolBody = z.object({
  name: z.string().trim().min(2, "Enter the school name.").max(120),
  state: z.string().trim().min(2, "Choose a state.").max(60),
  city: z.string().trim().max(80).optional(),
});
export type CreateSchoolBody = z.infer<typeof createSchoolBody>;

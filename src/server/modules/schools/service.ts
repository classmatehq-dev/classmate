import { and, asc, eq, ilike, or, sql } from "drizzle-orm";

import type { SchoolDto } from "@/lib/contracts/schools";
import { db } from "@/server/db";
import { schools } from "@/server/db/schema";
import { ApiError } from "@/server/http/errors";
import { normalizeText } from "@/server/lib/normalize";

function toDto(row: typeof schools.$inferSelect): SchoolDto {
  return {
    id: row.id,
    name: row.name,
    state: row.state,
    city: row.city,
    status: row.status,
  };
}

export async function listSchools(params: {
  state?: string;
  q?: string;
  limit: number;
}): Promise<SchoolDto[]> {
  const filters = [
    // never surface hidden schools
    or(eq(schools.status, "active"), eq(schools.status, "pending")),
  ];
  if (params.state) filters.push(eq(schools.state, params.state));
  if (params.q && params.q.length > 0) {
    filters.push(
      or(
        ilike(schools.name, `%${params.q}%`),
        ilike(schools.normalizedName, `%${normalizeText(params.q)}%`),
      ),
    );
  }

  const rows = await db
    .select()
    .from(schools)
    .where(and(...filters))
    // active before pending, then alphabetical
    .orderBy(sql`case when ${schools.status} = 'active' then 0 else 1 end`, asc(schools.name))
    .limit(params.limit);

  return rows.map(toDto);
}

export async function getSchoolById(id: string): Promise<SchoolDto | null> {
  const row = await db.query.schools.findFirst({
    where: (s, { eq }) => eq(s.id, id),
  });
  return row ? toDto(row) : null;
}

/**
 * Create a "missing school" request. Idempotent on (normalizedName, state):
 * if one already exists we return it rather than erroring, so the onboarding
 * flow can just proceed.
 */
export async function requestSchool(input: {
  name: string;
  state: string;
  city?: string;
}): Promise<SchoolDto> {
  const normalizedName = normalizeText(input.name);
  if (normalizedName.length < 2) {
    throw ApiError.validation("Enter the school name.");
  }

  const existing = await db.query.schools.findFirst({
    where: and(
      eq(schools.normalizedName, normalizedName),
      eq(schools.state, input.state),
    ),
  });
  if (existing) return toDto(existing);

  const [row] = await db
    .insert(schools)
    .values({
      name: input.name.trim(),
      normalizedName,
      state: input.state.trim(),
      city: input.city?.trim() || null,
      status: "pending",
    })
    .returning();

  return toDto(row);
}

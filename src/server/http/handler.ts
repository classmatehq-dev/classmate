import { NextResponse } from "next/server";
import { type z, ZodError, type ZodType } from "zod";

import {
  getAuthContext,
  getCurrentUser,
} from "@/server/auth/current-user";
import type { User } from "@/server/db/schema";
import { ApiError } from "./errors";

/**
 * Wrap a route handler so every failure returns a consistent JSON body:
 *   { error: { code, message, details? } }
 * and unexpected errors are logged server-side but never leaked to the client.
 */
export function handleRoute<T>(
  fn: () => Promise<T>,
): Promise<NextResponse> {
  return fn()
    .then((data) =>
      data instanceof NextResponse ? data : NextResponse.json(data),
    )
    .catch((err: unknown) => {
      if (err instanceof ApiError) {
        return NextResponse.json(
          { error: { code: err.code, message: err.message, details: err.details } },
          { status: err.status },
        );
      }
      if (err instanceof ZodError) {
        return NextResponse.json(
          {
            error: {
              code: "validation",
              message: "Please check the form and try again.",
              details: err.flatten(),
            },
          },
          { status: 422 },
        );
      }
      console.error("[api] unhandled error:", err);
      return NextResponse.json(
        { error: { code: "internal", message: "Something went wrong. Please try again." } },
        { status: 500 },
      );
    });
}

/** Parse + validate a JSON request body. Throws ApiError.validation on failure. */
export async function readJson<S extends ZodType>(
  req: Request,
  schema: S,
): Promise<z.infer<S>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw ApiError.validation("Expected a JSON body.");
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw ApiError.validation(
      "Please check the form and try again.",
      parsed.error.flatten(),
    );
  }
  return parsed.data;
}

/** Validate URL search params against a schema. */
export function readQuery<S extends ZodType>(
  req: Request,
  schema: S,
): z.infer<S> {
  const url = new URL(req.url);
  const obj = Object.fromEntries(url.searchParams.entries());
  const parsed = schema.safeParse(obj);
  if (!parsed.success) {
    throw ApiError.validation(
      "Invalid request parameters.",
      parsed.error.flatten(),
    );
  }
  return parsed.data;
}

/** Require a signed-in user with a Classmate profile. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw ApiError.unauthorized();
  return user;
}

/** Require a user who has finished onboarding (has a school + completed flag). */
export async function requireOnboardedUser(): Promise<User> {
  const user = await requireUser();
  if (!user.onboardingSchoolId) {
    throw ApiError.forbidden("Finish setting up your school first.");
  }
  return user;
}

export { getAuthContext };

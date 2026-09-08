import { z } from "zod";

/**
 * Central environment-variable validation. Import `env` anywhere on the server.
 * Fails fast at startup if something required is missing / malformed.
 */

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // Database (Neon Postgres). Required for anything that touches the DB.
  DATABASE_URL: z.string().url().optional(),

  // Auth. When AUTH_DEV_BYPASS === "1" the app issues a local fake session and
  // Clerk keys are not required (local development only).
  AUTH_DEV_BYPASS: z
    .enum(["0", "1"])
    .default("0"),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
  CLERK_SECRET_KEY: z.string().optional(),

  // Allowed clock difference (ms) between this machine and Clerk's servers when
  // verifying session tokens. Clerk's default is 5000. Bump this locally if your
  // machine clock drifts; on a correctly-timed server the default is fine.
  CLERK_CLOCK_SKEW_MS: z.coerce.number().int().min(0).max(3_600_000).default(5000),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:",
    z.treeifyError(parsed.error),
  );
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;

export const authDevBypass = env.AUTH_DEV_BYPASS === "1";

export const clerkConfigured = Boolean(
  env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && env.CLERK_SECRET_KEY,
);

/** "dev" = local fake session; "clerk" = real Clerk auth. */
export const authMode: "dev" | "clerk" = authDevBypass ? "dev" : "clerk";

if (authMode === "clerk" && !clerkConfigured) {
  throw new Error(
    "AUTH_DEV_BYPASS is off but Clerk keys are missing. Set " +
      "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY, or set AUTH_DEV_BYPASS=1.",
  );
}

export function requireDatabaseUrl(): string {
  if (!env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Add it to .env.local (see docs/SETUP.md).",
    );
  }
  return env.DATABASE_URL;
}

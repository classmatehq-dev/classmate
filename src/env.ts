import { z } from "zod";

/**
 * Central environment-variable validation. Import `env` anywhere on the server.
 * Fails fast if something required is missing / malformed.
 */

/** Treat empty strings (common in hosting UIs) as "not set". */
function clean(value: string | undefined): string | undefined {
  if (value == null) return undefined;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

const raw = {
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: clean(process.env.DATABASE_URL),
  AUTH_DEV_BYPASS: clean(process.env.AUTH_DEV_BYPASS),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: clean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  ),
  CLERK_SECRET_KEY: clean(process.env.CLERK_SECRET_KEY),
  CLERK_CLOCK_SKEW_MS: clean(process.env.CLERK_CLOCK_SKEW_MS),
};

const schema = z.object({
  NODE_ENV: z.string().optional(),
  DATABASE_URL: z.string().min(1).optional(),
  // "1" (or "true") turns on the local fake session so the app runs without Clerk.
  AUTH_DEV_BYPASS: z
    .enum(["0", "1", "true", "false"])
    .optional()
    .transform((v) => (v === "1" || v === "true" ? "1" : "0")),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1).optional(),
  CLERK_SECRET_KEY: z.string().min(1).optional(),
  CLERK_CLOCK_SKEW_MS: z
    .string()
    .optional()
    .transform((v) => {
      const n = v == null ? 5000 : Number(v);
      return Number.isFinite(n) && n >= 0 && n <= 3_600_000 ? n : 5000;
    }),
});

const parsed = schema.safeParse(raw);

if (!parsed.success) {
  const flat = z.flattenError(parsed.error);
  console.error("❌ Invalid environment variables:", flat.fieldErrors);
  throw new Error(
    "Invalid environment variables: " +
      Object.keys(flat.fieldErrors).join(", "),
  );
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
    "AUTH_DEV_BYPASS is not 1 but Clerk keys are missing. Set " +
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

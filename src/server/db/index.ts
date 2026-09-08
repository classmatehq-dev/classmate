import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { requireDatabaseUrl } from "@/env";
import * as schema from "./schema";

/**
 * Single shared connection pool + Drizzle client.
 *
 * In dev, Next.js hot-reload would otherwise create a new pool on every edit,
 * so we stash it on `globalThis`.
 */

const globalForDb = globalThis as unknown as {
  __classmatePool?: Pool;
};

function makePool() {
  const url = new URL(requireDatabaseUrl());
  // Let node-postgres manage TLS explicitly instead of parsing `sslmode` from
  // the URL (which emits a noisy deprecation warning on every boot).
  const sslmode = url.searchParams.get("sslmode");
  url.searchParams.delete("sslmode");
  url.searchParams.delete("channel_binding");
  return new Pool({
    connectionString: url.toString(),
    ssl: sslmode && sslmode !== "disable" ? { rejectUnauthorized: true } : undefined,
    max: 5,
  });
}

const pool = globalForDb.__classmatePool ?? makePool();

if (process.env.NODE_ENV !== "production") {
  globalForDb.__classmatePool = pool;
}

export const db = drizzle({ client: pool, schema, casing: "snake_case" });

export { schema };
export * from "./schema";

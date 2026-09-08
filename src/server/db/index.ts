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

const pool =
  globalForDb.__classmatePool ??
  new Pool({
    connectionString: requireDatabaseUrl(),
    max: 5,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__classmatePool = pool;
}

export const db = drizzle({ client: pool, schema, casing: "snake_case" });

export { schema };
export * from "./schema";

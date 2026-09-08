import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Next.js keeps local secrets in .env.local; load that for the drizzle-kit CLI.
config({ path: ".env.local" });
config({ path: ".env" });

export default defineConfig({
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  verbose: true,
  strict: true,
});

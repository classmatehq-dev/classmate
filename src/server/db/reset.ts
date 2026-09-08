import { sql } from "drizzle-orm";

import { db } from "./index";

/**
 * Wipes all application data. Destructive — used before a fresh seed.
 * Order doesn't matter with CASCADE + a single TRUNCATE.
 */
async function main() {
  await db.execute(sql`
    truncate table
      helpful_votes, comments, posts, class_memberships, classes,
      teachers, schools, follows, reports, blocks, users
    restart identity cascade
  `);
  console.log("database wiped");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

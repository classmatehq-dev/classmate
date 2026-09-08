import { sql } from "drizzle-orm";

import type {
  LeaderboardEntry,
  LeaderboardResponse,
} from "@/lib/contracts/leaderboard";
import { db } from "@/server/db";

type Row = {
  id: string;
  username: string;
  avatar_url: string | null;
  value: number | string;
};

function toEntries(rows: Row[], viewerId: string): LeaderboardEntry[] {
  return rows.map((r, i) => ({
    rank: i + 1,
    userId: r.id,
    username: r.username,
    avatarUrl: r.avatar_url,
    value: Number(r.value),
    isViewer: r.id === viewerId,
  }));
}

export async function getLeaderboard(
  viewerId: string,
): Promise<LeaderboardResponse> {
  const helpful = await db.execute<Row>(sql`
    select u.id, u.username, u.avatar_url,
      coalesce(sum(x.cnt), 0)::int as value
    from users u
    left join (
      select author_id, helpful_count as cnt from posts where status <> 'deleted'
      union all
      select author_id, helpful_count as cnt from comments where status <> 'deleted'
    ) x on x.author_id = u.id
    group by u.id
    having coalesce(sum(x.cnt), 0) > 0
    order by value desc, u.username asc
    limit 20
  `);

  const followed = await db.execute<Row>(sql`
    select u.id, u.username, u.avatar_url, count(f.id)::int as value
    from users u
    left join follows f on f.following_user_id = u.id
    group by u.id
    having count(f.id) > 0
    order by value desc, u.username asc
    limit 20
  `);

  return {
    mostHelpful: toEntries(helpful.rows, viewerId),
    mostFollowed: toEntries(followed.rows, viewerId),
  };
}

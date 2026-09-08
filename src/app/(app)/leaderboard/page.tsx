import { requireCompletedUser } from "@/server/auth/guards";
import { LeaderboardView } from "./leaderboard-view";

export default async function LeaderboardPage() {
  await requireCompletedUser();
  return <LeaderboardView />;
}

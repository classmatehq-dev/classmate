import { requireCompletedUser } from "@/server/auth/guards";
import { Card, EmptyState } from "@/components/ui";

export default async function LeaderboardPage() {
  await requireCompletedUser();
  return (
    <div className="px-4 py-4 md:px-0">
      <h1 className="text-xl font-extrabold text-navy">Leaderboard</h1>
      <p className="mt-1 text-sm text-muted">
        Most Helpful and Most Followed students — by class, school, state, and all
        of Classmate.
      </p>
      <div className="mt-4 grid gap-3">
        <Card>
          <p className="font-semibold text-navy">Most Helpful</p>
          <p className="text-sm text-muted">Ranked by Helpful votes received.</p>
        </Card>
        <Card>
          <p className="font-semibold text-navy">Most Followed</p>
          <p className="text-sm text-muted">Ranked by follower count.</p>
        </Card>
      </div>
      <div className="mt-6">
        <EmptyState title="Rankings unlock once more students join" />
      </div>
    </div>
  );
}

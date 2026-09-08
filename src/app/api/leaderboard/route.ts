import { handleRoute, requireUser } from "@/server/http/handler";
import { getLeaderboard } from "@/server/modules/leaderboard/service";

export function GET() {
  return handleRoute(async () => {
    const user = await requireUser();
    return getLeaderboard(user.id);
  });
}

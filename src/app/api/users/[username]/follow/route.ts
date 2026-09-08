import type { NextRequest } from "next/server";

import { handleRoute, requireUser } from "@/server/http/handler";
import { toggleFollow } from "@/server/modules/profile/public-service";

export function POST(
  _req: NextRequest,
  ctx: RouteContext<"/api/users/[username]/follow">,
) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { username } = await ctx.params;
    return toggleFollow(username, user.id);
  });
}

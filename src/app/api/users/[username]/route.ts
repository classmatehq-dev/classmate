import type { NextRequest } from "next/server";

import { handleRoute, requireUser } from "@/server/http/handler";
import { getPublicProfile } from "@/server/modules/profile/public-service";

export function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/users/[username]">,
) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { username } = await ctx.params;
    return getPublicProfile(username, user.id);
  });
}

import type { NextRequest } from "next/server";

import { handleRoute, requireUser } from "@/server/http/handler";
import {
  listClassMemberUsers,
  requireActiveMembership,
} from "@/server/modules/classes/service";

export function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/classes/[id]/members">,
) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    await requireActiveMembership(user.id, id);
    return listClassMemberUsers(id);
  });
}

import type { NextRequest } from "next/server";

import { handleRoute, requireUser } from "@/server/http/handler";
import { leaveConversation } from "@/server/modules/messages/service";

export function POST(
  _req: NextRequest,
  ctx: RouteContext<"/api/conversations/[id]/leave">,
) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    return leaveConversation(id, user.id);
  });
}

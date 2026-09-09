import type { NextRequest } from "next/server";

import { handleRoute, requireUser } from "@/server/http/handler";
import { getConversationDto } from "@/server/modules/messages/service";

export function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/conversations/[id]">,
) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    return getConversationDto(id, user.id);
  });
}

import type { NextRequest } from "next/server";

import { handleRoute, requireUser } from "@/server/http/handler";
import { markRead } from "@/server/modules/messages/service";

export function POST(
  _req: NextRequest,
  ctx: RouteContext<"/api/conversations/[id]/read">,
) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    return markRead(id, user.id);
  });
}

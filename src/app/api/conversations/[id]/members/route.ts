import type { NextRequest } from "next/server";

import { addMembersBody } from "@/lib/contracts/messages";
import { handleRoute, readJson, requireUser } from "@/server/http/handler";
import { rateLimit } from "@/server/http/rate-limit";
import { addMembers } from "@/server/modules/messages/service";

export function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/conversations/[id]/members">,
) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    rateLimit("startConversation", user.id);
    const { usernames } = await readJson(req, addMembersBody);
    return addMembers(id, user.id, usernames);
  });
}

import type { NextRequest } from "next/server";

import {
  handleRoute,
  requireOnboardedUser,
} from "@/server/http/handler";
import { rateLimit } from "@/server/http/rate-limit";
import { getClassDtoById, joinClass } from "@/server/modules/classes/service";

export function POST(
  _req: NextRequest,
  ctx: RouteContext<"/api/classes/[id]/join">,
) {
  return handleRoute(async () => {
    const user = await requireOnboardedUser();
    const { id } = await ctx.params;
    rateLimit("joinClass", user.id);

    const membership = await joinClass(id, user.id);
    const klass = await getClassDtoById(id);

    return {
      membership: {
        classId: membership.classId,
        role: membership.role,
        status: membership.status,
        joinedAt: membership.joinedAt.toISOString(),
      },
      class: klass,
    };
  });
}

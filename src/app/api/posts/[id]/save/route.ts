import type { NextRequest } from "next/server";

import { handleRoute, requireUser } from "@/server/http/handler";
import { toggleSave } from "@/server/modules/saves/service";

export function POST(
  _req: NextRequest,
  ctx: RouteContext<"/api/posts/[id]/save">,
) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    return toggleSave(user.id, id);
  });
}

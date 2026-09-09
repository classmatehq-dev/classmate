import type { NextRequest } from "next/server";

import { handleRoute, requireUser } from "@/server/http/handler";
import { listSiblingSections } from "@/server/modules/classes/service";

export function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/classes/[id]/sections">,
) {
  return handleRoute(async () => {
    await requireUser();
    const { id } = await ctx.params;
    return listSiblingSections(id);
  });
}

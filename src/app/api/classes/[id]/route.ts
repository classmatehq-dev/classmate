import type { NextRequest } from "next/server";

import { handleRoute, requireUser } from "@/server/http/handler";
import { ApiError } from "@/server/http/errors";
import { getClassDtoById } from "@/server/modules/classes/service";

export function GET(_req: NextRequest, ctx: RouteContext<"/api/classes/[id]">) {
  return handleRoute(async () => {
    await requireUser();
    const { id } = await ctx.params;
    const klass = await getClassDtoById(id);
    if (!klass || klass.status === "hidden") {
      throw ApiError.notFound("We couldn't find that class.");
    }
    return klass;
  });
}

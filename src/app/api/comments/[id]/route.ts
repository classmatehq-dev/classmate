import type { NextRequest } from "next/server";

import { updateCommentBody } from "@/lib/contracts/interactions";
import {
  handleRoute,
  readJson,
  requireUser,
} from "@/server/http/handler";
import {
  deleteComment,
  updateComment,
} from "@/server/modules/comments/service";

export function PATCH(
  req: NextRequest,
  ctx: RouteContext<"/api/comments/[id]">,
) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const { body } = await readJson(req, updateCommentBody);
    return updateComment(id, user.id, body);
  });
}

export function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/comments/[id]">,
) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    return deleteComment(id, user.id);
  });
}

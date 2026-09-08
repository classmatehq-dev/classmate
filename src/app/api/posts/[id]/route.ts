import type { NextRequest } from "next/server";

import { updatePostBody } from "@/lib/contracts/interactions";
import {
  handleRoute,
  readJson,
  requireUser,
} from "@/server/http/handler";
import {
  deletePost,
  getPostDto,
  updatePost,
} from "@/server/modules/posts/service";

export function GET(_req: NextRequest, ctx: RouteContext<"/api/posts/[id]">) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    return getPostDto(id, user.id);
  });
}

export function PATCH(req: NextRequest, ctx: RouteContext<"/api/posts/[id]">) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const body = await readJson(req, updatePostBody);
    return updatePost(id, user.id, body);
  });
}

export function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/posts/[id]">,
) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    return deletePost(id, user.id);
  });
}

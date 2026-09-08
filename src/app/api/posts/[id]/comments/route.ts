import type { NextRequest } from "next/server";

import { createCommentBody } from "@/lib/contracts/interactions";
import {
  handleRoute,
  readJson,
  requireUser,
} from "@/server/http/handler";
import { rateLimit } from "@/server/http/rate-limit";
import {
  createComment,
  listComments,
} from "@/server/modules/comments/service";

export function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/posts/[id]/comments">,
) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    return listComments(id, user.id);
  });
}

export function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/posts/[id]/comments">,
) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    rateLimit("createComment", user.id);
    const body = await readJson(req, createCommentBody);
    return createComment(id, user.id, body);
  });
}

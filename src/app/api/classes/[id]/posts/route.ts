import type { NextRequest } from "next/server";

import { createPostBody, listPostsQuery } from "@/lib/contracts/interactions";
import {
  handleRoute,
  readJson,
  readQuery,
  requireUser,
} from "@/server/http/handler";
import { rateLimit } from "@/server/http/rate-limit";
import { createPost, listClassPosts } from "@/server/modules/posts/service";

export function GET(
  req: NextRequest,
  ctx: RouteContext<"/api/classes/[id]/posts">,
) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const query = readQuery(req, listPostsQuery);
    return listClassPosts(id, user.id, query);
  });
}

export function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/classes/[id]/posts">,
) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    rateLimit("createPost", user.id);
    const body = await readJson(req, createPostBody);
    return createPost(id, user.id, body);
  });
}

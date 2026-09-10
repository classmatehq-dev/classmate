import type { NextRequest } from "next/server";

import { listPostsQuery } from "@/lib/contracts/interactions";
import { handleRoute, readQuery, requireUser } from "@/server/http/handler";
import { listSavedPosts } from "@/server/modules/saves/service";

export function GET(req: NextRequest) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { limit, cursor } = readQuery(req, listPostsQuery);
    return listSavedPosts(user.id, { limit, cursor });
  });
}

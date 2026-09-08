import type { NextRequest } from "next/server";

import { feedQuery } from "@/lib/contracts/feed";
import {
  handleRoute,
  readQuery,
  requireUser,
} from "@/server/http/handler";
import { getHomeFeed } from "@/server/modules/feed/service";

export function GET(req: NextRequest) {
  return handleRoute(async () => {
    const user = await requireUser();
    const query = readQuery(req, feedQuery);
    return getHomeFeed(user.id, query);
  });
}

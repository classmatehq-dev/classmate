import type { NextRequest } from "next/server";

import { helpfulBody } from "@/lib/contracts/interactions";
import {
  handleRoute,
  readJson,
  requireUser,
} from "@/server/http/handler";
import { rateLimit } from "@/server/http/rate-limit";
import { toggleHelpful } from "@/server/modules/interactions/service";

export function POST(req: NextRequest) {
  return handleRoute(async () => {
    const user = await requireUser();
    rateLimit("helpfulVote", user.id);
    const { targetType, targetId } = await readJson(req, helpfulBody);
    return toggleHelpful(user.id, targetType, targetId);
  });
}

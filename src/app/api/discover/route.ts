import type { NextRequest } from "next/server";

import { discoverQuery } from "@/lib/contracts/discover";
import {
  handleRoute,
  readQuery,
  requireUser,
} from "@/server/http/handler";
import { discover } from "@/server/modules/discover/service";

export function GET(req: NextRequest) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { q } = readQuery(req, discoverQuery);
    return discover(q, user.id);
  });
}

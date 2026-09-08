import type { NextRequest } from "next/server";

import { reportBody } from "@/lib/contracts/interactions";
import {
  handleRoute,
  readJson,
  requireUser,
} from "@/server/http/handler";
import { rateLimit } from "@/server/http/rate-limit";
import { createReport } from "@/server/modules/interactions/service";

export function POST(req: NextRequest) {
  return handleRoute(async () => {
    const user = await requireUser();
    rateLimit("report", user.id);
    const body = await readJson(req, reportBody);
    return createReport(user.id, body);
  });
}

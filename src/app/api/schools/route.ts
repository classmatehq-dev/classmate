import type { NextRequest } from "next/server";

import { createSchoolBody, listSchoolsQuery } from "@/lib/contracts/schools";
import {
  handleRoute,
  readJson,
  readQuery,
  requireUser,
} from "@/server/http/handler";
import { rateLimit } from "@/server/http/rate-limit";
import { listSchools, requestSchool } from "@/server/modules/schools/service";

export function GET(req: NextRequest) {
  return handleRoute(async () => {
    await requireUser();
    const query = readQuery(req, listSchoolsQuery);
    return listSchools(query);
  });
}

export function POST(req: NextRequest) {
  return handleRoute(async () => {
    const user = await requireUser();
    rateLimit("createSchool", user.id);
    const body = await readJson(req, createSchoolBody);
    return requestSchool(body);
  });
}

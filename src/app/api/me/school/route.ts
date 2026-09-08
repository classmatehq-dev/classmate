import type { NextRequest } from "next/server";

import { setSchoolBody } from "@/lib/contracts/me";
import { getAuthContext } from "@/server/auth/current-user";
import {
  handleRoute,
  readJson,
  requireUser,
} from "@/server/http/handler";
import { setOnboardingSchool, toMeDto } from "@/server/modules/profile/service";

/** Persist the school chosen in onboarding step 1. */
export function PUT(req: NextRequest) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { identity } = await getAuthContext();
    const { schoolId } = await readJson(req, setSchoolBody);
    const updated = await setOnboardingSchool(user, schoolId);
    return toMeDto(updated, identity?.email ?? user.email);
  });
}

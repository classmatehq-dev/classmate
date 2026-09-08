import type { NextRequest } from "next/server";

import { createProfileBody, updateProfileBody } from "@/lib/contracts/me";
import { getAuthContext } from "@/server/auth/current-user";
import { ApiError } from "@/server/http/errors";
import {
  handleRoute,
  readJson,
  requireUser,
} from "@/server/http/handler";
import { rateLimit } from "@/server/http/rate-limit";
import {
  createProfile,
  toMeDto,
  updateProfile,
} from "@/server/modules/profile/service";

/** Current auth + profile state. Always 200 so the client can route on it. */
export function GET() {
  return handleRoute(async () => {
    const { identity, user } = await getAuthContext();
    return {
      authenticated: identity != null,
      profile: user && identity ? toMeDto(user, identity.email) : null,
    };
  });
}

export function POST(req: NextRequest) {
  return handleRoute(async () => {
    const { identity } = await getAuthContext();
    if (!identity) throw ApiError.unauthorized();
    rateLimit("signup", identity.clerkUserId);

    const body = await readJson(req, createProfileBody);
    const user = await createProfile(identity, body);
    return toMeDto(user, identity.email);
  });
}

export function PATCH(req: NextRequest) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { identity } = await getAuthContext();
    const body = await readJson(req, updateProfileBody);
    const updated = await updateProfile(user, body);
    return toMeDto(updated, identity?.email ?? user.email);
  });
}

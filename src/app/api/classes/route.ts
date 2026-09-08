import type { NextRequest } from "next/server";

import { createClassBody, listClassesQuery } from "@/lib/contracts/classes";
import {
  handleRoute,
  readJson,
  readQuery,
  requireUser,
} from "@/server/http/handler";
import { rateLimit } from "@/server/http/rate-limit";
import {
  createOrGetClass,
  joinClass,
  listClasses,
} from "@/server/modules/classes/service";
import { getClassDtoById } from "@/server/modules/classes/service";

export function GET(req: NextRequest) {
  return handleRoute(async () => {
    await requireUser();
    const query = readQuery(req, listClassesQuery);
    return listClasses(query);
  });
}

export function POST(req: NextRequest) {
  return handleRoute(async () => {
    const user = await requireUser();
    rateLimit("createClass", user.id);
    const body = await readJson(req, createClassBody);

    const { klass, created } = await createOrGetClass(body, user.id);
    const membership = await joinClass(klass.id, user.id, {
      asRole: created ? "creator" : "member",
    });

    return {
      class: (await getClassDtoById(klass.id)) ?? klass,
      created,
      membership: {
        classId: membership.classId,
        role: membership.role,
        status: membership.status,
        joinedAt: membership.joinedAt.toISOString(),
      },
    };
  });
}

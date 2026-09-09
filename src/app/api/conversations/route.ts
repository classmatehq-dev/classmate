import type { NextRequest } from "next/server";
import { z } from "zod";

import { createGroupBody, startDirectBody } from "@/lib/contracts/messages";
import { handleRoute, readJson, requireUser } from "@/server/http/handler";
import { rateLimit } from "@/server/http/rate-limit";
import {
  createGroup,
  listConversations,
  startDirect,
} from "@/server/modules/messages/service";

export function GET() {
  return handleRoute(async () => {
    const user = await requireUser();
    return listConversations(user.id);
  });
}

const createBody = z.discriminatedUnion("kind", [
  startDirectBody.extend({ kind: z.literal("direct") }),
  createGroupBody.extend({ kind: z.literal("group") }),
]);

export function POST(req: NextRequest) {
  return handleRoute(async () => {
    const user = await requireUser();
    rateLimit("startConversation", user.id);
    const body = await readJson(req, createBody);
    return body.kind === "direct"
      ? startDirect(user.id, body.username)
      : createGroup(user.id, {
          title: body.title,
          usernames: body.usernames,
        });
  });
}

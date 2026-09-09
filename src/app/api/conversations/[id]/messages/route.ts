import type { NextRequest } from "next/server";

import { listMessagesQuery, sendMessageBody } from "@/lib/contracts/messages";
import {
  handleRoute,
  readJson,
  readQuery,
  requireUser,
} from "@/server/http/handler";
import { rateLimit } from "@/server/http/rate-limit";
import { listMessages, sendMessage } from "@/server/modules/messages/service";

export function GET(
  req: NextRequest,
  ctx: RouteContext<"/api/conversations/[id]/messages">,
) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const { limit, cursor } = readQuery(req, listMessagesQuery);
    return listMessages(id, user.id, { limit, cursor });
  });
}

export function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/conversations/[id]/messages">,
) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    rateLimit("sendMessage", user.id);
    const { body, attachments } = await readJson(req, sendMessageBody);
    return sendMessage(id, user.id, body, attachments);
  });
}

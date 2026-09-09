import type { NextRequest } from "next/server";

import { listNotificationsQuery } from "@/lib/contracts/notifications";
import { handleRoute, readQuery, requireUser } from "@/server/http/handler";
import { listNotifications } from "@/server/modules/notifications/service";

export function GET(req: NextRequest) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { limit, cursor } = readQuery(req, listNotificationsQuery);
    return listNotifications(user.id, { limit, cursor });
  });
}

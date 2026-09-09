import { handleRoute, requireUser } from "@/server/http/handler";
import { markNotificationsRead } from "@/server/modules/notifications/service";

export function POST() {
  return handleRoute(async () => {
    const user = await requireUser();
    return markNotificationsRead(user.id);
  });
}

import { handleRoute, requireUser } from "@/server/http/handler";
import { unreadNotificationCount } from "@/server/modules/notifications/service";

export function GET() {
  return handleRoute(async () => {
    const user = await requireUser();
    return { count: await unreadNotificationCount(user.id) };
  });
}

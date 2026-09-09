import { handleRoute, requireUser } from "@/server/http/handler";
import { unreadTotal } from "@/server/modules/messages/service";

export function GET() {
  return handleRoute(async () => {
    const user = await requireUser();
    return { count: await unreadTotal(user.id) };
  });
}

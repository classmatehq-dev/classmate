import { handleRoute, requireUser } from "@/server/http/handler";
import { listMyClasses } from "@/server/modules/profile/service";

export function GET() {
  return handleRoute(async () => {
    const user = await requireUser();
    return listMyClasses(user.id);
  });
}

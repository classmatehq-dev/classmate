import { getAuthContext } from "@/server/auth/current-user";
import { handleRoute, requireUser } from "@/server/http/handler";
import { completeOnboarding, toMeDto } from "@/server/modules/profile/service";

export function POST() {
  return handleRoute(async () => {
    const user = await requireUser();
    const { identity } = await getAuthContext();
    const updated = await completeOnboarding(user);
    return toMeDto(updated, identity?.email ?? user.email);
  });
}

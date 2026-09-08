import { redirect } from "next/navigation";

import { requireCompletedUser } from "@/server/auth/guards";

export default async function ProfileRedirectPage() {
  const user = await requireCompletedUser();
  redirect(`/u/${user.username}`);
}

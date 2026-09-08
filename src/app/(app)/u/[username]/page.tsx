import { authMode } from "@/env";
import { requireCompletedUser } from "@/server/auth/guards";
import { ProfileView } from "./profile-view";

export default async function UserProfilePage({
  params,
}: PageProps<"/u/[username]">) {
  await requireCompletedUser();
  const { username } = await params;
  return <ProfileView username={username} authMode={authMode} />;
}

import { requireCompletedUser } from "@/server/auth/guards";
import { HomeView } from "./home-view";

export default async function HomePage() {
  const user = await requireCompletedUser();
  return <HomeView username={user.username} />;
}

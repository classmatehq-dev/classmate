import { requireCompletedUser } from "@/server/auth/guards";
import { DiscoverView } from "./discover-view";

export default async function DiscoverPage({
  searchParams,
}: PageProps<"/discover">) {
  await requireCompletedUser();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  return <DiscoverView initialQuery={q} />;
}

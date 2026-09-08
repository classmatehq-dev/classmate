import { requireCompletedUser } from "@/server/auth/guards";
import { CreatePostView } from "./create-post-view";

export default async function CreatePage() {
  await requireCompletedUser();
  return <CreatePostView />;
}

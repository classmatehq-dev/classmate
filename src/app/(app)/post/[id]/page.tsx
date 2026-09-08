import { requireCompletedUser } from "@/server/auth/guards";
import { PostView } from "./post-view";

export default async function PostPage({ params }: PageProps<"/post/[id]">) {
  await requireCompletedUser();
  const { id } = await params;
  return <PostView postId={id} />;
}

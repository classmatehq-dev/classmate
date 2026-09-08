import { requireCompletedUser } from "@/server/auth/guards";
import { ClassView } from "./class-view";

export default async function ClassPage({
  params,
}: PageProps<"/class/[id]">) {
  await requireCompletedUser();
  const { id } = await params;
  return <ClassView classId={id} />;
}

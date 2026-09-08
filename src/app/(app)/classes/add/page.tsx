import { requireCompletedUser } from "@/server/auth/guards";
import { AddClassView } from "./add-class-view";

export default async function AddClassPage() {
  const user = await requireCompletedUser();
  return <AddClassView schoolId={user.onboardingSchoolId!} />;
}

import { AppNav } from "@/components/app-nav";
import { authMode } from "@/env";
import { requireCompletedUser } from "@/server/auth/guards";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireCompletedUser();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 md:gap-6 md:px-4">
      <AppNav username={user.username} authMode={authMode} />
      <div className="w-full flex-1 pb-20 md:pb-8 md:pt-4">{children}</div>
    </div>
  );
}

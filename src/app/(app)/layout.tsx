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
      <div className="w-full min-w-0 flex-1 pt-12 pb-24 md:pt-4 md:pb-8">
        {children}
      </div>
    </div>
  );
}

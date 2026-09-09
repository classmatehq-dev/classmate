import { AppNav } from "@/components/app-nav";
import { AppRail } from "@/components/app-rail";
import { authMode } from "@/env";
import { requireCompletedUser } from "@/server/auth/guards";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireCompletedUser();

  return (
    <div className="mx-auto flex w-full max-w-[1180px] md:gap-6 md:px-4 lg:gap-8">
      <AppNav username={user.username} authMode={authMode} />

      {/* Context panels on the left, next to the nav */}
      <AppRail />

      <main className="w-full min-w-0 flex-1 pt-12 pb-24 md:pt-4 md:pb-10 lg:max-w-[640px]">
        {children}
      </main>
    </div>
  );
}

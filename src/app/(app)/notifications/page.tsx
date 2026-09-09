import type { Metadata } from "next";

import { requireCompletedUser } from "@/server/auth/guards";
import { NotificationsView } from "./notifications-view";

export const metadata: Metadata = {
  title: "Notifications",
  robots: { index: false },
};

export default async function NotificationsPage() {
  await requireCompletedUser();
  return <NotificationsView />;
}

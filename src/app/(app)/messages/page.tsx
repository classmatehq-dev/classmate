import type { Metadata } from "next";

import { requireCompletedUser } from "@/server/auth/guards";
import { MessagesView } from "./messages-view";

export const metadata: Metadata = {
  title: "Messages",
  robots: { index: false },
};

export default async function MessagesPage() {
  await requireCompletedUser();
  return <MessagesView />;
}

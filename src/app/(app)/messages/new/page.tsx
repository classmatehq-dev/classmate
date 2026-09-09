import type { Metadata } from "next";

import { requireCompletedUser } from "@/server/auth/guards";
import { NewChatView } from "./new-chat-view";

export const metadata: Metadata = {
  title: "New message",
  robots: { index: false },
};

export default async function NewChatPage() {
  await requireCompletedUser();
  return <NewChatView />;
}

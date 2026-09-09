import type { Metadata } from "next";

import { requireCompletedUser } from "@/server/auth/guards";
import { ConversationView } from "./conversation-view";

export const metadata: Metadata = {
  title: "Conversation",
  robots: { index: false },
};

export default async function ConversationPage({
  params,
}: PageProps<"/messages/[id]">) {
  await requireCompletedUser();
  const { id } = await params;
  return <ConversationView conversationId={id} />;
}

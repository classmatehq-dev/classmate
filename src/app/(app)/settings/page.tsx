import type { Metadata } from "next";

import { authMode } from "@/env";
import { requireCompletedUser } from "@/server/auth/guards";
import { SettingsView } from "./settings-view";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false },
};

export default async function SettingsPage() {
  await requireCompletedUser();
  return <SettingsView authMode={authMode} />;
}

import { cookies } from "next/headers";

import { authDevBypass } from "@/env";

export type AuthIdentity = {
  /** Clerk user id, or a `dev_*` id under AUTH_DEV_BYPASS */
  clerkUserId: string;
  email: string;
};

export const DEV_IDENTITY_COOKIE = "classmate_dev_clerk_id";
const DEV_DEFAULT_ID = "dev_local";

/**
 * Resolve the authenticated identity for the current request.
 *
 * - Dev bypass: read a cookie so multiple fake accounts can be tested; default
 *   to a single local user.
 * - Clerk: use the real session (requires clerkMiddleware once keys are set).
 */
export async function getAuthIdentity(): Promise<AuthIdentity | null> {
  if (authDevBypass) {
    const store = await cookies();
    const id = store.get(DEV_IDENTITY_COOKIE)?.value?.trim() || DEV_DEFAULT_ID;
    return { clerkUserId: id, email: `${id}@classmate.local` };
  }

  // Clerk path — imported lazily so the dev-bypass build never loads it.
  const { auth, currentUser } = await import("@clerk/nextjs/server");
  const { userId } = await auth();
  if (!userId) return null;

  const clerkUser = await currentUser();
  const email =
    clerkUser?.primaryEmailAddress?.emailAddress ??
    clerkUser?.emailAddresses?.[0]?.emailAddress ??
    "";

  return { clerkUserId: userId, email };
}

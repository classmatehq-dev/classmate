import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { authDevBypass, env } from "@/env";

/**
 * Dev-bypass mode: pass-through (no real auth).
 * Clerk mode (AUTH_DEV_BYPASS=0): clerkMiddleware attaches the auth context that
 * `auth()` / `currentUser()` read in server code. Route protection itself lives
 * in the page/route guards, not here.
 */
export default authDevBypass
  ? function middleware() {
      return NextResponse.next();
    }
  : clerkMiddleware({ clockSkewInMs: env.CLERK_CLOCK_SKEW_MS });

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

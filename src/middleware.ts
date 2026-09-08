import { NextResponse } from "next/server";

import { authDevBypass } from "@/env";

/**
 * Dev-bypass mode: pass-through (no real auth).
 * Clerk mode (AUTH_DEV_BYPASS=0): run clerkMiddleware so `auth()` /
 * `currentUser()` work in server code. Route protection lives in the page/route
 * guards, not here.
 */
type MiddlewareFn = (
  req: Request,
  evt: unknown,
) => Response | Promise<Response>;

let clerkHandler: MiddlewareFn | undefined;

export default async function middleware(req: Request, evt: unknown) {
  if (authDevBypass) return NextResponse.next();
  if (!clerkHandler) {
    const { clerkMiddleware } = await import("@clerk/nextjs/server");
    clerkHandler = clerkMiddleware() as MiddlewareFn;
  }
  return clerkHandler(req, evt);
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
};

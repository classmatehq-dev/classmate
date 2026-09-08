# Classmate — Build Plan

## Architecture (fresh build)

Single deployable **Next.js (App Router)** application — a modular monolith, no microservices.

```
classmate/
  src/
    app/                      # routes (pages + API route handlers)
      (marketing)/            # welcome / login / signup (public)
      (app)/                  # authenticated app shell w/ nav
      onboarding/
      api/                    # REST route handlers under /api/*
    server/                   # backend modules (the "monolith" internals)
      db/                     # Drizzle schema + client
      auth/                   # Clerk bridge + dev bypass + getCurrentUser
      modules/
        schools/              # service + validation per domain
        classes/
        memberships/
        posts/
        comments/
        helpful/
        profiles/
        reports/
      http/                   # shared request helpers, error mapping, rate limiting
    lib/                      # shared client+server: zod contracts, api client hooks
    components/               # UI
    styles/
  drizzle/                    # generated SQL migrations
```

- **DB:** Neon Postgres + Drizzle ORM. `DATABASE_URL` env.
- **Auth:** Clerk for identity only. Our `users` table holds username/gradeLevel/bio/avatar, keyed by `clerkUserId`. Dev bypass (`AUTH_DEV_BYPASS=1`) issues a fake session so the app runs before Clerk keys exist.
- **Contracts:** Zod schemas in `src/lib/contracts/*` shared by route handlers (input/output validation) and typed client hooks (React Query). No codegen step.
- **Authorization:** every protected route resolves the current user server-side, then checks membership/ownership/visibility in the service layer. Never trust the client.

## Sequence

| # | Step | Status |
|---|------|--------|
| 0 | Install Node, scaffold Next.js, brand/design system, app shell + nav | ✅ scaffold + brand + welcome page done; app shell/nav next |
| 1 | DB schema (users, schools, teachers, classes, classMemberships, posts, comments, helpfulVotes, follows, reports, blocks) + migrations | ✅ schema + first migration generated; needs a DB to apply |
| 2 | Auth bridge: Clerk + dev bypass, `getCurrentUser`, profile creation | ✅ |
| 3 | Welcome / signup / login / email verify | ✅ (dev + Clerk both wired; Clerk needs keys — see docs/CLERK.md) |
| 4 | School onboarding: `GET/POST /api/schools`, persist selection to profile | ✅ |
| 5 | Class onboarding: `GET/POST /api/classes`, `GET /api/classes/:id`, `POST /api/classes/:id/join` | ✅ |
| 6 | Membership persistence + `canUserJoinClass` entitlement stub | ✅ |
| 7 | `GET /api/me/classes` | ✅ |
| 8 | `GET /api/home/feed` | ✅ |
| 9 | Home render: My Classes, feed, empty states | ✅ (+ Hot Today, notification bell) |
| 10 | Class page + tabs (Posts live; others placeholder) | ✅ |
| 11 | Posts: `GET/POST /api/classes/:id/posts`, `PATCH/DELETE /api/posts/:id` | ✅ |
| 12 | Comments + replies: `GET/POST /api/posts/:id/comments`, `PATCH/DELETE /api/comments/:id` | ✅ |
| 13 | Helpful votes: `POST /api/helpful` toggle, counts on posts/comments | ✅ |
| 14 | Profiles: `GET /api/users/:username`, stats | ✅ (+ follow toggle) |
| 15 | Basic reporting: `POST /api/reports`, blocks | ✅ reports (blocks: table only) |
| 16 | Mobile pass + multi-account permission testing | ✅ verified in-browser |
| 17 | Deploy to Vercel | pending |

## External accounts the user must create (guided)

1. **Neon** (database) — free. Provides `DATABASE_URL`.
2. **Clerk** (auth) — free. Provides publishable + secret keys. Can be deferred; dev bypass covers local dev.
3. **Vercel** (hosting) — free. For deployment at step 17.
4. **GitHub** (optional but recommended) — to connect Vercel for auto-deploys.

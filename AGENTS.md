<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Classmate — project conventions

**What this is:** a student social-learning platform. Core hierarchy State → School → Teacher → Class. Core loop: sign up → pick school → join/create class → class feed → post → comment → mark "Helpful". Full spec lives with the product owner; `docs/PLAN.md` has the architecture + build sequence.

**Stack:** Next.js 16 (App Router) as a single deployable modular monolith — no microservices. Postgres (Neon) + Drizzle ORM. Clerk for auth identity only; `AUTH_DEV_BYPASS=1` gives a local fake session so the app runs without Clerk keys. Deploy target: Vercel. React Query on the client. Zod for all input/output validation.

**Layout:**
- `src/app/` — routes. `(marketing)` public, `(app)` authed shell, `onboarding/`, `api/` REST handlers under `/api/*`.
- `src/server/` — backend internals. `db/` (Drizzle schema + client), `auth/` (Clerk bridge + `getCurrentUser`), `modules/<domain>/` (service + validation per domain), `http/` (request helpers, error mapping, rate limiting).
- `src/lib/` — code shared by client + server: Zod contracts, typed API client hooks.
- `src/components/` — UI.

**Rules:**
- Every protected API route resolves the current user server-side, then checks membership / ownership / visibility in the service layer. Never trust the client.
- DB is snake_case, code is camelCase (drizzle `casing: "snake_case"`). After changing `src/server/db/schema.ts` run `npm run db:generate` then `npm run db:migrate`.
- Classmate profile fields (username, gradeLevel, bio, avatar) live in our `users` table keyed by `clerkUserId` — never sent to Clerk signup.
- "Helpful", never "Like". Content status: `active | hidden | deleted | under_review`.
- Brand: blue `#1557D6` (dominant), yellow `#FFC928` (accent only), navy `#0B1F44`, light blue `#EAF2FF`. Mobile-first, rounded, bottom nav on mobile. Tokens in `src/app/globals.css`.
- Design system: page headers use the `.bg-hero` blue gradient + `.bg-hero-dots` texture, white text, one yellow accent (glow / greeting). `shadow-card` on cards, `shadow-blue` / `shadow-blue-sm` for lift. Sections use the `SectionHeading` pattern (blue or yellow accent bar). Classes get a deterministic blue-shade colour via `classColor(id)` in `src/lib/class-color.ts` — use it for class chips/cards/headers. `.animate-rise` on top-level page containers. Keep it blue-dominant with gold as the single warm accent.
- Run `npm run build` (typechecks too) after meaningful changes.

**Next 16 note:** breaking changes vs. older Next. Check `node_modules/next/dist/docs/` before using route/params/cookies APIs — `params`, `searchParams`, `cookies()`, `headers()` are async.

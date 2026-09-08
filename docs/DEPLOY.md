# Deploying Classmate to Vercel

## One-time setup

### 1. GitHub (code backup + auto-deploy)

1. If you don't have an account: **https://github.com** → Sign up (use classmatehq@gmail.com).
2. Create a new repository:
   - **https://github.com/new**
   - Name: `classmate`
   - **Private**
   - Do **NOT** add a README, .gitignore, or license (the repo already has them)
   - Click **Create repository**
3. Copy the repo URL it shows (looks like `https://github.com/<you>/classmate.git`) and
   paste it in the chat. Claude will push the code.

### 2. Vercel (hosting)

1. **https://vercel.com** → **Sign Up** → **Continue with GitHub** (one click, reuses the account above).
2. **Add New… → Project**.
3. Find `classmate` in the list → **Import**.
4. **Framework Preset**: Next.js (auto-detected — leave it).
5. Expand **Environment Variables** and add these four (names exactly as shown):

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | the Neon **pooled** connection string (from `.env.local`) |
   | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_…` (from `.env.local`) |
   | `CLERK_SECRET_KEY` | `sk_test_…` (from `.env.local`) |
   | `AUTH_DEV_BYPASS` | `0` |

   Do **not** add `CLERK_CLOCK_SKEW_MS` — Vercel's servers have a correct clock.

6. Click **Deploy**. First build takes ~2 minutes.
7. You get a URL like `https://classmate-xxxx.vercel.app`.

### 3. Point Clerk at the live URL

1. Clerk dashboard → your app → **Configure → Domains** (or it may prompt on first
   external request).
2. Add the Vercel URL to allowed origins if sign-in throws an origin error.

That's it. The Clerk **development** instance works on the Vercel URL, with a
"development mode" badge and a 100-user cap — fine for testing. Moving to a
Clerk **production** instance needs a custom domain and is a later step.

## Pushing updates

Once GitHub + Vercel are linked, every `git push` to `main`/`master` auto-deploys.
Claude can push; you just watch the deploy in the Vercel dashboard.

## Database migrations on deploy

The Neon database is shared between local and production. When the schema
changes, run `npm run db:migrate` locally (it points at the same Neon DB) — the
deployed app picks up the new schema immediately. A separate production database
is a later hardening step.

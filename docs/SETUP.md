# Classmate — Local Setup

## Prerequisites (already installed on this machine)

- Node.js 24 LTS
- npm 11

## 1. Install dependencies

```bash
npm install
```

## 2. Environment file

Copy `.env.example` to `.env.local` (already done — the file exists, values are blank):

```
DATABASE_URL=            # filled in during Neon setup (step 3)
AUTH_DEV_BYPASS=1        # run without Clerk locally
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
```

## 3. Database — Neon (free, no install)  ← guided walkthrough

1. Go to **https://neon.com** and click **Sign up** (use the Google button with
   classmatehq@gmail.com, or GitHub).
2. It will offer to create your first project. Name it **classmate**, leave the
   region default, click **Create project**.
3. On the project page you'll see a **Connection string** box. Make sure the
   toggle says **Pooled connection**. Click the copy icon.
4. Paste it into `.env.local` as the value of `DATABASE_URL=` (one line, no quotes).
5. Back in the terminal:

   ```bash
   npm run db:migrate     # creates all the tables
   npm run db:seed        # loads the demo school / teachers / classes
   ```

## 4. Run the app

```bash
npm run dev
```

Open http://localhost:3000

## 5. Auth — Clerk (do this later)

While `AUTH_DEV_BYPASS=1`, the app signs you in as a local test user and Clerk is
not contacted. When you're ready for real accounts, see `docs/CLERK.md` (added at
that step).

## Useful commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the app in dev mode |
| `npm run build` | Production build (also typechecks) |
| `npm run typecheck` | TypeScript check only |
| `npm run db:generate` | Create a migration file after changing the schema |
| `npm run db:migrate` | Apply pending migrations to the database |
| `npm run db:studio` | Open a visual DB browser |
| `npm run db:seed` | Insert demo data |

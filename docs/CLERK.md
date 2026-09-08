# Turning on real accounts (Clerk)

Until you do this, the app runs in **dev mode**: the `/login` page has a fake
account switcher and there's no email/password or verification. Everything else
(classes, posts, comments, Helpful, profiles) works the same.

When you're ready for real student accounts:

## 1. Create a Clerk account

1. Go to **https://clerk.com** → **Sign up** (Google button, classmatehq@gmail.com).
2. **Create application**:
   - Name: **Classmate**
   - Sign-in options: turn ON **Email** and **Password**. Turn OFF the rest
     (Google, phone, etc.) unless you want them.
   - Click **Create application**.

## 2. Copy the keys

On the next screen ("API Keys"), you'll see two values. Copy both into
`.env.local`:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
```

## 3. Switch off dev mode

In `.env.local` change:

```
AUTH_DEV_BYPASS=0
```

## 4. Restart

```bash
npm run dev
```

Now `/signup` and `/login` show Clerk's real forms. After a student signs up and
verifies their email, they land on `/onboarding/profile` to pick a username and
grade, then continue into school → classes as before.

## How it fits together

- **Clerk** owns identity: email, password, verification, sessions.
- **Our `users` table** owns the Classmate profile: username, grade, bio, avatar —
  linked by `clerkUserId`. Username is **never** sent to Clerk (that was the
  original bug).
- `src/server/auth/identity.ts` reads the Clerk session server-side; everything
  downstream is unchanged.

## For deployment (later)

Add the same three env vars in the Vercel project settings. For production you'll
generate **production** API keys in Clerk (pk_live_ / sk_live_) and set an
allowed domain — covered in `docs/DEPLOY.md` when we get there.

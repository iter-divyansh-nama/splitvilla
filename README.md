# Splitr — a Splitwise-style expense splitter

A modern, mobile-first web app for splitting shared expenses with friends and
groups, built with **Next.js 14 (App Router)** and **Supabase**, deployable to
**Vercel**, and installable as a **PWA** on phones and desktops.

Users are managed by you directly in **Supabase Auth** (there is no public
sign-up) — the app is **login only**. Everyone you create in Supabase Auth
automatically becomes selectable as a group member.

---

## Features

- **Email + password login** (no public signup — you create users in Supabase).
- **Groups** with emoji icons and members picked from your Supabase users.
- **Add expenses** with category, payer, date, and three split modes:
  **equally**, **exact amounts**, or **percentages**.
- **Balances** per group, plus **simplified "who pays whom"** suggestions.
- **Settle up** — record payments between members.
- **Activity feed** across all your groups.
- **Profile editing** (display name + avatar URL) and sign-out.
- **Installable PWA** — works as an app on iOS, Android, and desktop.
- Splitwise-inspired teal design, fully responsive and touch-friendly.

---

## Tech stack

| Area        | Choice                                            |
| ----------- | ------------------------------------------------- |
| Framework   | Next.js 14 (App Router, TypeScript)               |
| Auth + DB   | Supabase (Postgres, Row Level Security, Auth)     |
| Auth bridge | `@supabase/ssr` (cookie-based sessions)           |
| Styling     | Tailwind CSS                                      |
| Icons       | lucide-react                                      |
| Hosting     | Vercel                                            |

---

## 1. Prerequisites

- **Node.js 18.17+** (or 20+) and npm.
- A free **Supabase** project — <https://supabase.com>.
- A **Vercel** account for deployment (optional for local dev).

---

## 2. Set up Supabase

### a. Create the project
Create a new project in the Supabase dashboard. Wait for it to finish
provisioning.

### b. Run the database migration
Open **SQL Editor** in the Supabase dashboard, paste the entire contents of
[`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql), and
run it. This creates all tables, indexes, Row Level Security policies, and the
triggers that:

- automatically create a `profiles` row whenever you add a user in Supabase
  Auth, and
- automatically add the creator as the first member of any new group.

> Using the Supabase CLI instead? Run `supabase db push` (or
> `supabase db reset` locally) with this file in your `supabase/migrations`
> folder.

### c. Create your users
Because there is no public signup, you add people yourself:

1. Go to **Authentication → Users → Add user**.
2. Enter an email and password, and (recommended) tick **Auto Confirm User** so
   they can log in immediately.
3. (Optional) Add a `full_name` under user metadata — otherwise the part of the
   email before `@` is used as their name. Users can edit their own name later
   on the Account screen.

Every confirmed user instantly appears as a selectable group member in the app.

### d. Get your API keys
Go to **Project Settings → API** and copy:

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 3. Run locally

```bash
# install dependencies
npm install

# create your env file and fill in the two values from step 2d
cp .env.local.example .env.local

# start the dev server
npm run dev
```

Open <http://localhost:3000> and log in with a user you created in Supabase.

Your `.env.local` should look like:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

---

## 4. Deploy to Vercel

1. Push this project to a GitHub/GitLab/Bitbucket repository.
2. In Vercel, **Add New → Project** and import the repo. Vercel auto-detects
   Next.js — no build settings to change.
3. Under **Settings → Environment Variables**, add the same two variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy. Your app will be live at `https://your-app.vercel.app`.

### Point Supabase at your deployed URL
In Supabase, go to **Authentication → URL Configuration** and set:

- **Site URL**: `https://your-app.vercel.app`
- **Redirect URLs**: add `https://your-app.vercel.app/auth/callback`

This is only needed if you later enable email-link flows; password login works
without it, but setting it now avoids surprises.

---

## 5. Install as an app (PWA)

Once deployed (PWAs need HTTPS, which Vercel provides automatically):

- **iPhone / iPad (Safari):** open the site → **Share** → **Add to Home
  Screen**.
- **Android (Chrome):** open the site → menu (⋮) → **Install app** / **Add to
  Home screen**.
- **Desktop (Chrome/Edge):** click the **install** icon in the address bar.

The app launches full-screen with its own icon and a teal theme.

> Local PWA note: service workers also work on `http://localhost`. On other
> local network addresses browsers may block installation because it isn't
> HTTPS — this is expected and does not affect the Vercel deployment.

---

## Project structure

```
src/
  app/
    (app)/                 # authenticated, bottom-nav shell
      dashboard/           # groups overview + overall balance
      groups/new/          # create a group
      groups/[id]/         # group detail (expenses, balances, settle, members)
      expense/new/         # add expense (equal / exact / percentage)
      activity/            # activity feed across all groups
      account/             # profile + sign out
    auth/callback/         # Supabase auth code exchange
    login/                 # email + password login
    layout.tsx, page.tsx   # root layout + redirect
  components/              # UI: GroupView, ExpenseForm, Avatar, BottomNav, ...
  lib/
    supabase/              # browser + server clients, session middleware
    balances.ts            # net balances + greedy debt simplification
    data.ts                # batched workspace loader
    utils.ts, types.ts, categories.ts
  middleware.ts            # auth gate
public/
  manifest.json, sw.js     # PWA manifest + service worker
  icon-*.png, icons/       # app icons
supabase/
  migrations/0001_init.sql # schema + RLS + triggers
```

---

## How balances work

- Paying for an expense credits you the full amount; your split debits you your
  share. A settlement moves the payer's balance up and the payee's down.
- A **positive** net means you are **owed** money; **negative** means you
  **owe**.
- The "who pays whom" list uses a greedy algorithm in integer cents, so the
  suggested payments always reconcile exactly with no rounding drift.

---

## Notes & customisation

- **Currency**: the UI shows Indian Rupees (₹) by default. Change the default in
  `src/lib/utils.ts` (`formatMoney`) and the `currency` column default in the
  migration if you want another currency.
- **Strictness**: `next.config.mjs` ignores type/lint errors during builds so
  deploys never get blocked. Once you have a local toolchain, you can remove
  those two flags for stricter CI.
- **Security**: every table is protected by Row Level Security; users can only
  read and write data for groups they belong to, and can only edit their own
  profile.

Enjoy splitting! 🧾

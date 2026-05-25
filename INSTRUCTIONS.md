# PaperTrade Pro — Setup Instructions

This guide takes you from a fresh clone to a fully working app with Supabase as the backend.

---

## Prerequisites

- Node.js 20+ (avoid odd-numbered versions in production)
- npm 11+
- A free [Supabase](https://supabase.com) account

---

## 1. Create a Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and click **New project**.
2. Choose a name (e.g. `papertrade-pro`), set a strong database password, and pick a region close to you.
3. Wait ~2 minutes for the project to provision.

---

## 2. Run the database schema

1. In the Supabase dashboard, go to **SQL Editor → New query**.
2. Open `supabase/schema.sql` from this repo and paste the full contents.
3. Click **Run**. You should see a success message with no errors.

This creates the following tables (all with Row Level Security enabled):

| Table | Purpose |
|---|---|
| `profiles` | User display name and cash balance |
| `positions` | Open holdings per user |
| `trades` | Full order history |
| `watchlist` | Saved symbols |
| `price_alerts` | Price notification rules |
| `notifications` | In-app activity feed |
| `user_settings` | Trading defaults, notification prefs, appearance |

A trigger (`handle_new_user`) auto-creates a profile and settings row for every new signup.

---

## 3. Create the demo user

1. In the Supabase dashboard, go to **Authentication → Users → Add user**.
2. Fill in:
   - **Email:** `demo@papertrade.pro`
   - **Password:** `Demo1234!`
   - Tick **"Auto Confirm User"** (skips the confirmation email)
3. Click **Create user**.
4. Copy the **UUID** shown in the users table (looks like `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`).

---

## 4. Seed the demo user's data

1. Open `supabase/seed.sql`.
2. On **line 9**, replace the placeholder UUID:
   ```sql
   uid UUID := '00000000-0000-0000-0000-000000000000'; -- ← replace this
   ```
   with the real UUID you copied in step 3.
3. Go back to **SQL Editor → New query**, paste the edited seed SQL, and click **Run**.

This inserts seed positions (AAPL, NVDA, MSFT, BTC-USD, SPY), 7 historical trades, a watchlist, price alerts, and notifications for the demo account.

---

## 5. Get your API credentials

1. In the Supabase dashboard, go to **Project Settings → API**.
2. Copy:
   - **Project URL** — looks like `https://xxxxxxxxxxxx.supabase.co`
   - **anon / public key** — a long JWT string

---

## 6. Configure the Angular app

Open `src/environments/environment.ts` and replace the placeholder values:

```ts
export const environment = {
  production: false,
  supabaseUrl:  'https://xxxxxxxxxxxx.supabase.co',   // ← your Project URL
  supabaseKey:  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',  // ← your anon key
};
```

Do the same in `src/environments/environment.prod.ts` for production builds.

> **Never commit real credentials to git.** Add `src/environments/environment.ts` to `.gitignore`, or use environment variables injected at build time in your CI pipeline.

---

## 7. Install dependencies and run

```bash
npm install
npm start
```

The app will be available at [http://localhost:4200](http://localhost:4200).

Log in with:
- **Email:** `demo@papertrade.pro`
- **Password:** `Demo1234!`

---

## 8. Run the test suite

```bash
npm test
```

24 tests across 6 files. All should pass (no Supabase credentials needed for tests — services are mocked).

---

## How the Supabase integration works

### Authentication

`AuthService` wraps `@supabase/supabase-js` auth. On app load it calls `getSession()` to restore an existing session from localStorage. Login/register/logout are all async and update an Angular signal (`_user`).

An `authGuard` protects all app-shell routes and redirects unauthenticated users to `/auth/login`. A `guestGuard` on the auth routes redirects already-authenticated users to `/dashboard`.

### Data services

Each data service (`PortfolioService`, `WatchlistService`, `AlertsService`, `NotificationsService`, `SettingsService`) uses an Angular `effect()` that watches `auth.user()`. When the user logs in, it fetches that user's data from Supabase. When they log out, it resets to empty state.

Writes are **optimistic** — the signal updates immediately for instant UI feedback, and the Supabase upsert/insert happens in the background. This keeps the UI fast while ensuring data persists.

### SSR safety

All browser-only APIs (`localStorage`, Supabase auth session) are guarded with `isPlatformBrowser()`. During SSR prerendering, services start with empty state and the `SupabaseService` uses a stub client (no real network calls). The auth guard always returns `true` on the server.

---

## Supabase Dashboard — Backoffice

Once the app is running you can manage all data directly in the Supabase dashboard:

| Section | What you can do |
|---|---|
| **Authentication → Users** | View all users, reset passwords, disable accounts |
| **Table Editor → trades** | Browse every trade, filter by user, export CSV |
| **Table Editor → positions** | See open holdings per user |
| **Table Editor → profiles** | Adjust cash balance, display name |
| **Table Editor → notifications** | Manage in-app notifications |
| **SQL Editor** | Run ad-hoc queries, generate reports |
| **Logs → API** | See every request in real time |

---

## Production deployment

1. Build the app:
   ```bash
   npm run build
   ```
2. The output is in `dist/carteira-trading/`. Serve with Node:
   ```bash
   node dist/carteira-trading/server/server.mjs
   ```
3. Set `environment.prod.ts` with production credentials before building, or inject them via environment variables and update `environment.prod.ts` to read from `window.__env` or a similar runtime config pattern.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `Invalid supabaseUrl` in browser console | You haven't filled in `environment.ts` yet |
| Login returns "Invalid login credentials" | Check the user exists in Auth → Users and the password matches |
| Data doesn't load after login | Check the browser Network tab for 4xx errors; RLS may be blocking rows if the user UUID doesn't match |
| `ng build` prerender errors | Usually means the Supabase placeholder client is failing — ensure `supabaseUrl` starts with `https://` |
| Tests fail with "Cannot find module" | Run `npm install` — a dependency may be missing |

# DTI0-4 Sign-in design

Story: M1 · Authentication_Sign-in · Sign in with FSD credentials (Jira DTI0-4, due 2026-11-13).
Branch: `dti0-4-sign-in`, cut from `main` after PR #1 (DTI0-20) merged.

## Goal

An FSD officer signs in with email and password and only reaches the modules their role allows.
Sign-in also makes the existing Row Level Security (RLS) policies (`TO authenticated`) usable, which unblocks the Supabase work for the proposal builder (DTI0-20 follow-ups).

## Decisions

1. **Supabase Auth is the source of truth for passwords and sessions.** `user_accounts` is linked to the Supabase user and keeps the role and account status. The app does not check `password_hash` itself.
2. **Role-to-module access** (confirmed by Leon, still to confirm with the team, decision D-8):

   | Role | Modules | Lands on |
   |---|---|---|
   | Conversion Officer | Donor Conversion | first tab of Donor Conversion |
   | Retention Officer | Donor Retention | first tab of Donor Retention |
   | Donor Care Officer | Donor Care | first tab of Donor Care |
   | Division Head | Dashboard, Donor Conversion, Donor Retention, Donor Care | Dashboard |
   | System Administrator | all of the above (admin area is a later story) | Dashboard |

   Everyone also gets the shared pages (Notifications, Preferences). The rules live in one file, `src/lib/access.ts`.
3. **Accounts are created by hand for now.** Users are created in the Supabase dashboard (Authentication → Users). A seed SQL file adds the matching `user_accounts` rows. No sign-up page.
4. **Real account plus test accounts.** One real account for the developer, and test accounts: one per role and one Suspended. Test accounts use `@example.test` emails and strong passwords, and are deleted before real use.

## Data (supabase/schema.sql, supabase/seeds)

- `user_accounts.auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE`.
- `user_accounts.password_hash` becomes nullable (Supabase holds the password). The column stays unused and is dropped later.
- `supabase/seeds/accounts-seed.sql`: for each email, look up the Supabase user and insert the matching `user_accounts` row with role and status. Safe to re-run. Contains emails and roles only, never passwords.
- Existing RLS policies stay. They let any signed-in user read every `user_accounts` row, which is acceptable now and flagged for tightening later.
- The same SQL is run once in the Supabase SQL editor (the live project does not have it yet).

## Login screen

- Route `/login` (`src/app/login/page.tsx`), without the navbar.
- Email and password, both required. Password masked, with a show/hide toggle.
- Wrong credentials: one generic error above the form, never naming the field (Figma 01.1).
- Suspended account: signed out again, with a message to contact the System Administrator.
- Success: redirect to the role's home page from `access.ts`.
- Sign-in runs as a server action: Supabase `signInWithPassword`, then read the `user_accounts` row by `auth_user_id`, then check `account_status`.
- Where the Figma screens (01 Sign in, 01.1 error state) and the code differ, the code wins. Figma is a target, not a strict 1:1.

## Enforcement

- **Proxy (`src/proxy.ts`)** checks only "is someone signed in?". Not signed in goes to `/login`. Signed in and visiting `/login` goes to their home. Public paths: `/login`, `/forgot-password`, `/reset-password`, the auth callback, static files. The proxy stays cheap because it runs on every request.
- **Role checks** happen in each module layout (`donor-conv`, `donor-retn`, `donor-care`, dashboard) through a server helper that reads the user's role and redirects when the module is not allowed.
- **Logout**: the navbar's existing Logout item calls a sign-out server action and returns to `/login`.

## Navbar

- A server helper `getCurrentUser()` returns the user's name (`officer_profiles.full_name`, falling back to the email) and role.
- The navbar replaces the hard-coded "User Profile" with the real user, and shows only the modules `access.ts` allows.

## Forgot password

- `/forgot-password` takes an email and calls Supabase `resetPasswordForEmail`.
- The emailed link opens `/reset-password`, where the user sets a new password (`updateUser`).
- One-time Supabase dashboard setting: add `http://localhost:3000/**` under Authentication → URL Configuration → Redirect URLs. The built-in email sender is rate limited, which is fine for testing.

## Build order (one small step at a time, each reviewed before the next)

1. Schema change, seed file, and the SQL to run in Supabase.
2. `src/lib/access.ts`.
3. Login page and sign-in server action.
4. Proxy redirect to `/login`, and logout.
5. Role guards in each module layout.
6. Navbar with the real user.
7. Forgot and reset password.

## Testing

No test runner exists, so none is added for this story. After each step: `tsc`, ESLint on the changed files, and a check in the Docker app. At the end, sign in with every test account: each role lands on its home page, other modules are blocked, the Suspended message shows, a wrong password shows the generic error, logout works, and the reset email arrives.

## Out of scope

Sign-up page, admin screen for creating accounts, dropping `password_hash`, tightening RLS policies, Row Level Security by role, and the DTI0-20 follow-ups (reading prospects from Supabase, saving on Generate, Send).

## Open items

- The role-to-module table (D-8) needs confirmation from the team. It is one file to change.
- Real account details (which email and role the developer's own account uses) are chosen when the seed file is written.

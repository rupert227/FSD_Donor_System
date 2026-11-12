-- PR #3 review: proposals policies must not fail when the sign-in token has no role.
-- Run once in the Supabase SQL editor, AFTER 2026-11-12-proposals-backend.sql. Safe to run again.
-- Only replaces one function; no table, policy or row changes.

-- The signed-in user's role. Reads the token first (no database call). If the token has no
-- role (for example the account was set up without the seed script), it falls back to the
-- role stored in user_accounts, but only for an Active account.
-- SECURITY DEFINER so the lookup works whatever the user_accounts policies allow;
-- it only ever returns the caller's own role.
CREATE OR REPLACE FUNCTION public.jwt_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    auth.jwt() -> 'app_metadata' ->> 'user_role',
    (SELECT ua.user_role::text
       FROM user_accounts ua
      WHERE ua.auth_user_id = auth.uid()
        AND ua.account_status = 'Active')
  )
$$;

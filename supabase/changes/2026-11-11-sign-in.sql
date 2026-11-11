-- DTI0-4: link user_accounts to Supabase Auth, and let Supabase keep the password.
-- Run once in the Supabase SQL editor. Safe to run again.
-- Only adds a nullable column and relaxes a NOT NULL: nothing existing is renamed or removed.
ALTER TABLE user_accounts
  ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE user_accounts
  ALTER COLUMN password_hash DROP NOT NULL;

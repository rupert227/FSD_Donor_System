-- DTI0-4 test accounts. Emails and roles only, never passwords.
-- Before running: create each user in the Supabase dashboard
-- (Authentication > Users > Add user > Create new user, tick "Auto Confirm User").
-- Safe to run again. Run it again after changing a role.

INSERT INTO user_accounts (email_address, user_role, account_status, auth_user_id)
SELECT v.email, v.role::user_role_enum, v.status::account_status_enum, u.id
FROM (VALUES
  ('conversion.officer@example.test', 'Conversion Officer',  'Active'),
  ('retention.officer@example.test',  'Retention Officer',   'Active'),
  ('donorcare.officer@example.test',  'Donor Care Officer',  'Active'),
  ('division.head@example.test',      'Division Head',       'Active'),
  ('sys.admin@example.test',          'System Administrator','Active'),
  ('suspended.officer@example.test',  'Conversion Officer',  'Suspended')
) AS v(email, role, status)
JOIN auth.users u ON u.email = v.email
ON CONFLICT (email_address) DO UPDATE
  SET user_role = EXCLUDED.user_role,
      account_status = EXCLUDED.account_status,
      auth_user_id = EXCLUDED.auth_user_id;

-- Copy each role into the Supabase user's metadata, so the app can read it from the sign-in token.
-- user_accounts.user_role stays the source of truth.
UPDATE auth.users u
SET raw_app_meta_data = COALESCE(u.raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object('user_role', ua.user_role::text)
FROM user_accounts ua
WHERE ua.auth_user_id = u.id;

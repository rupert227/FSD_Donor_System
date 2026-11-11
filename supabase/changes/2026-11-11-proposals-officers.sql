-- DTI0-20: the proposals and officer_profiles tables, for the live Supabase project.
-- They exist in supabase/schema.sql but were never run on the live project.
-- Run once in the Supabase SQL editor, AFTER 2026-11-11-sign-in.sql. Safe to run again.
-- Do not re-run the whole schema.sql instead: its CREATE POLICY lines fail when a policy already exists.

-- Proposal letter status
DO $$ BEGIN
  CREATE TYPE proposal_status_enum AS ENUM ('Generated', 'Sent');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- officer_profiles (staff details used in letters; separate from sign-in credentials)
CREATE TABLE IF NOT EXISTS officer_profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  full_name VARCHAR(100) NOT NULL,
  job_title VARCHAR(100),
  phone_number VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- proposals (generated proposal letters: final text and dispatch details)
CREATE TABLE IF NOT EXISTS proposals (
  id BIGSERIAL PRIMARY KEY,
  prospect_id BIGINT NOT NULL REFERENCES lead_prospects(id) ON DELETE RESTRICT,
  template_id VARCHAR(50) NOT NULL,
  letter_date DATE NOT NULL,
  signatory_name VARCHAR(100) NOT NULL,
  signatory_title VARCHAR(100),
  letter_text TEXT NOT NULL,
  status proposal_status_enum NOT NULL DEFAULT 'Generated',
  delivery_preference delivery_preference_enum,
  dispatched_at TIMESTAMPTZ,
  created_by BIGINT REFERENCES user_accounts(id) ON DELETE SET NULL,
  file_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Link prospects to the assigned officer's profile.
ALTER TABLE lead_prospects
  ADD COLUMN IF NOT EXISTS assigned_officer_id BIGINT
  REFERENCES officer_profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_proposals_prospect_id ON proposals(prospect_id);
CREATE INDEX IF NOT EXISTS idx_lead_prospects_assigned_officer_id ON lead_prospects(assigned_officer_id);

-- Keep updated_at current
DROP TRIGGER IF EXISTS trigger_update_proposals ON proposals;
CREATE TRIGGER trigger_update_proposals
  BEFORE UPDATE ON proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_officer_profiles ON officer_profiles;
CREATE TRIGGER trigger_update_officer_profiles
  BEFORE UPDATE ON officer_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security: signed-in staff only (same rule as the other tables)
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE officer_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users full access to proposals" ON proposals;
CREATE POLICY "Allow authenticated users full access to proposals"
  ON proposals FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users full access to officer_profiles" ON officer_profiles;
CREATE POLICY "Allow authenticated users full access to officer_profiles"
  ON officer_profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

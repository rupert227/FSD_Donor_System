-- ==============================================================================
-- FSD Donor System - Supabase Schema Migration
-- Based on docs/01-schema.md
-- Caritas Manila - Fundraising and Stewardship Division
-- ==============================================================================

-- 0. Enable UUID and utility extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. ENUM TYPE DEFINITIONS
-- ==============================================================================

-- Calendar Month
DO $$ BEGIN
  CREATE TYPE month_enum AS ENUM ('JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Record Status
DO $$ BEGIN
  CREATE TYPE record_status_enum AS ENUM ('Active', 'Inactive', 'Archived');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Donor Type
DO $$ BEGIN
  CREATE TYPE donor_type_enum AS ENUM ('individual', 'corporate', 'community', 'international');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Lead Source Origin
DO $$ BEGIN
  CREATE TYPE lead_source_origin_enum AS ENUM ('Referral', 'Research', 'Booths', 'Direct Call', 'Walk-in');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Target Campaign / Program
DO $$ BEGIN
  CREATE TYPE target_campaign_enum AS ENUM (
    'Youth Servant Leadership',
    'Health and Disaster Relief',
    'In-Kind Social Enterprise',
    'At-Risk Restorative Justice',
    'Institute for Stewardship'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Pipeline Status (Prospect Conversion)
DO $$ BEGIN
  CREATE TYPE pipeline_status_enum AS ENUM (
    'New Lead',
    'Under Research',
    'Outreach Started',
    'Proposal Sent',
    'Secured Donor'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Engagement Status (Donor Retention)
DO $$ BEGIN
  CREATE TYPE engagement_status_enum AS ENUM (
    'Uncontacted',
    'Followed-up',
    'Renewal Started',
    'Recommitted',
    'Lapsed Donor'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Donor Tenure Loyalty
DO $$ BEGIN
  CREATE TYPE donor_tenure_enum AS ENUM (
    '3+ Years Loyal',
    '2 Years Retained',
    '1 Year Retained',
    'New Renewal'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Source of Funds
DO $$ BEGIN
  CREATE TYPE source_of_funds_enum AS ENUM (
    'Corporate Partners',
    'Direct (Individual)',
    'Church Institutions',
    'Community/Association',
    'Social Enterprise'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Payment Method
DO $$ BEGIN
  CREATE TYPE payment_method_enum AS ENUM (
    'Bank Transfer',
    'Check Payment',
    'Direct Deposit',
    'Cash'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Treasury Clearance Workflow Status
DO $$ BEGIN
  CREATE TYPE treasury_clearance_status_enum AS ENUM (
    'Receipt Verification',
    'Certificate Creation',
    'Dispatch Prepared',
    'Transaction Finalized'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Document Delivery Preference
DO $$ BEGIN
  CREATE TYPE delivery_preference_enum AS ENUM (
    'Email PDF (Softcopy)',
    'Postal Mail',
    'Hand Delivered'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- System User Roles
DO $$ BEGIN
  CREATE TYPE user_role_enum AS ENUM (
    'Conversion Officer',
    'Retention Officer',
    'Donor Care Officer',
    'Division Head',
    'System Administrator'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- User Account Status
DO $$ BEGIN
  CREATE TYPE account_status_enum AS ENUM ('Active', 'Suspended');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Proposal Letter Status
DO $$ BEGIN
  CREATE TYPE proposal_status_enum AS ENUM ('Generated', 'Sent');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 2. HELPER FUNCTIONS
-- ==============================================================================

-- Trigger function for updating updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 3. TABLES DEFINITIONS
-- ==============================================================================

-- 3.1 lead_prospects (Pipeline conversion steps prior to commitment)
CREATE TABLE IF NOT EXISTS lead_prospects (
  id BIGSERIAL PRIMARY KEY,
  month month_enum,
  status record_status_enum DEFAULT 'Active',
  prospect_name VARCHAR(100) NOT NULL,
  donor_type donor_type_enum NOT NULL,
  lead_source_origin lead_source_origin_enum NOT NULL,
  primary_contact_person VARCHAR(100) NOT NULL,
  title_designation VARCHAR(100),
  email_address VARCHAR(150),
  phone_number VARCHAR(50) NOT NULL,
  street_address VARCHAR(255),
  city_province VARCHAR(100),
  target_campaign target_campaign_enum NOT NULL,
  target_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  pipeline_status pipeline_status_enum NOT NULL DEFAULT 'New Lead',
  probability_score INTEGER NOT NULL DEFAULT 20 CHECK (probability_score >= 0 AND probability_score <= 100),
  assigned_officer VARCHAR(100) NOT NULL,
  target_followup_date DATE,
  next_step_action_plan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.2 donor_profiles (Active donor records, loyalty metrics, contact details)
CREATE TABLE IF NOT EXISTS donor_profiles (
  id BIGSERIAL PRIMARY KEY,
  donor_name VARCHAR(150) NOT NULL,
  donor_type donor_type_enum NOT NULL,
  primary_contact_person VARCHAR(100) NOT NULL,
  title_designation VARCHAR(100),
  email_address VARCHAR(150) NOT NULL,
  mobile_number VARCHAR(50) NOT NULL,
  tax_id VARCHAR(50),
  delivery_address TEXT NOT NULL,
  target_campaign target_campaign_enum NOT NULL,
  engagement_status engagement_status_enum NOT NULL DEFAULT 'Uncontacted',
  donor_tenure donor_tenure_enum NOT NULL DEFAULT 'New Renewal',
  assigned_officer VARCHAR(100) NOT NULL,
  converted_from_lead_id BIGINT REFERENCES lead_prospects(id) ON DELETE SET NULL,
  last_contact_date DATE,
  target_followup_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.3 transactions (Remittance ledgers, deposit records, clearance workflows)
CREATE TABLE IF NOT EXISTS transactions (
  id BIGSERIAL PRIMARY KEY,
  donor_id BIGINT NOT NULL REFERENCES donor_profiles(id) ON DELETE RESTRICT,
  source_of_funds source_of_funds_enum NOT NULL,
  campaign_name target_campaign_enum NOT NULL,
  amount_pledge DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  amount_collected DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  transaction_date DATE NOT NULL,
  payment_method payment_method_enum NOT NULL,
  deposit_bank VARCHAR(100) NOT NULL,
  bank_reference_no VARCHAR(100) NOT NULL,
  official_receipt_no VARCHAR(50) UNIQUE NOT NULL,
  tax_certificate_no VARCHAR(50),
  cod_requested BOOLEAN NOT NULL DEFAULT FALSE,
  treasury_clearance_status treasury_clearance_status_enum NOT NULL DEFAULT 'Receipt Verification',
  deposit_clearance_date DATE,
  fulfillment_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.4 certificate_of_donation (Certified tax deduction documents)
CREATE TABLE IF NOT EXISTS certificate_of_donation (
  id BIGSERIAL PRIMARY KEY,
  certificate_no VARCHAR(50) UNIQUE NOT NULL,
  transaction_id BIGINT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  donor_id BIGINT NOT NULL REFERENCES donor_profiles(id) ON DELETE RESTRICT,
  certified_amount DECIMAL(14,2) NOT NULL,
  issuance_date DATE NOT NULL,
  delivery_preference delivery_preference_enum NOT NULL DEFAULT 'Email PDF (Softcopy)',
  dispatch_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.5 user_accounts (Division access, authentication credentials, permissions)
CREATE TABLE IF NOT EXISTS user_accounts (
  id BIGSERIAL PRIMARY KEY,
  email_address VARCHAR(150) UNIQUE NOT NULL,
  -- Supabase Auth keeps the real password. This column is unused and can be dropped later.
  password_hash VARCHAR(255),
  -- The Supabase Auth user this account belongs to.
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  user_role user_role_enum NOT NULL,
  account_status account_status_enum NOT NULL DEFAULT 'Active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.6 proposals (Generated proposal letters, final text and dispatch details)
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

-- 3.7 officer_profiles (Staff details used in letters; separate from sign-in credentials)
CREATE TABLE IF NOT EXISTS officer_profiles (
  id BIGSERIAL PRIMARY KEY,
  -- NULL for a person with no sign-in account (for example a signatory).
  user_id BIGINT UNIQUE REFERENCES user_accounts(id) ON DELETE CASCADE,
  full_name VARCHAR(100) NOT NULL,
  job_title VARCHAR(100),
  phone_number VARCHAR(50),
  -- true = appears in the letter Signatory dropdown.
  is_signatory BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Link prospects to the assigned officer's profile. Added with ALTER because
-- lead_prospects is defined before officer_profiles. The older free-text
-- assigned_officer column stays until every page reads this link.
ALTER TABLE lead_prospects
  ADD COLUMN IF NOT EXISTS assigned_officer_id BIGINT
  REFERENCES officer_profiles(id) ON DELETE SET NULL;

-- 3.8 lead_outreach_activities (Multi-touch outreach history and action plans)
CREATE TABLE IF NOT EXISTS lead_outreach_activities (
  id BIGSERIAL PRIMARY KEY,
  prospect_id BIGINT NOT NULL REFERENCES lead_prospects(id) ON DELETE CASCADE,
  status pipeline_status_enum NOT NULL,
  followup_date DATE,
  notes TEXT NOT NULL,
  recorded_by BIGINT REFERENCES user_accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.9 notifications (System notifications, cross-module workflow alerts, reminders)
CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  module VARCHAR(50) NOT NULL,
  type VARCHAR(50) NOT NULL,
  is_alert BOOLEAN NOT NULL DEFAULT FALSE,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  assigned_officer VARCHAR(100),
  link_url TEXT,
  user_id BIGINT REFERENCES user_accounts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 4. PERFORMANCE INDEXES
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_lead_prospects_pipeline_status ON lead_prospects(pipeline_status);
CREATE INDEX IF NOT EXISTS idx_lead_prospects_assigned_officer ON lead_prospects(assigned_officer);
CREATE INDEX IF NOT EXISTS idx_donor_profiles_engagement_status ON donor_profiles(engagement_status);
CREATE INDEX IF NOT EXISTS idx_donor_profiles_donor_type ON donor_profiles(donor_type);
CREATE INDEX IF NOT EXISTS idx_donor_profiles_assigned_officer ON donor_profiles(assigned_officer);
CREATE INDEX IF NOT EXISTS idx_transactions_donor_id ON transactions(donor_id);
CREATE INDEX IF NOT EXISTS idx_transactions_clearance_status ON transactions(treasury_clearance_status);
CREATE INDEX IF NOT EXISTS idx_transactions_official_receipt_no ON transactions(official_receipt_no);
CREATE INDEX IF NOT EXISTS idx_cod_transaction_id ON certificate_of_donation(transaction_id);
CREATE INDEX IF NOT EXISTS idx_cod_donor_id ON certificate_of_donation(donor_id);
CREATE INDEX IF NOT EXISTS idx_user_accounts_email ON user_accounts(email_address);
CREATE INDEX IF NOT EXISTS idx_proposals_prospect_id ON proposals(prospect_id);
CREATE INDEX IF NOT EXISTS idx_lead_prospects_assigned_officer_id ON lead_prospects(assigned_officer_id);
CREATE INDEX IF NOT EXISTS idx_donor_profiles_converted_from ON donor_profiles(converted_from_lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_outreach_prospect_id ON lead_outreach_activities(prospect_id);
CREATE INDEX IF NOT EXISTS idx_lead_outreach_created_at ON lead_outreach_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_module ON notifications(module);
CREATE INDEX IF NOT EXISTS idx_notifications_assigned_officer ON notifications(assigned_officer);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- ==============================================================================
-- 5. UPDATED_AT TRIGGERS
-- ==============================================================================

DROP TRIGGER IF EXISTS trigger_update_lead_prospects ON lead_prospects;
CREATE TRIGGER trigger_update_lead_prospects
  BEFORE UPDATE ON lead_prospects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_donor_profiles ON donor_profiles;
CREATE TRIGGER trigger_update_donor_profiles
  BEFORE UPDATE ON donor_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_transactions ON transactions;
CREATE TRIGGER trigger_update_transactions
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_certificate_of_donation ON certificate_of_donation;
CREATE TRIGGER trigger_update_certificate_of_donation
  BEFORE UPDATE ON certificate_of_donation
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_user_accounts ON user_accounts;
CREATE TRIGGER trigger_update_user_accounts
  BEFORE UPDATE ON user_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_proposals ON proposals;
CREATE TRIGGER trigger_update_proposals
  BEFORE UPDATE ON proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_officer_profiles ON officer_profiles;
CREATE TRIGGER trigger_update_officer_profiles
  BEFORE UPDATE ON officer_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_lead_outreach_activities ON lead_outreach_activities;
CREATE TRIGGER trigger_update_lead_outreach_activities
  BEFORE UPDATE ON lead_outreach_activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_notifications ON notifications;
CREATE TRIGGER trigger_update_notifications
  BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE lead_prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE donor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_of_donation ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE officer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_outreach_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Allow authenticated service operations / staff by default:
CREATE POLICY "Allow authenticated users full access to lead_prospects"
  ON lead_prospects FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to donor_profiles"
  ON donor_profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to transactions"
  ON transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to certificate_of_donation"
  ON certificate_of_donation FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to user_accounts"
  ON user_accounts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- proposals: only the Conversion module's roles. The role comes from the token (set at sign-in).
CREATE OR REPLACE FUNCTION public.jwt_user_role()
RETURNS TEXT LANGUAGE sql STABLE SET search_path = public
AS $$ SELECT auth.jwt() -> 'app_metadata' ->> 'user_role' $$;

-- created_by is set by the database from the signed-in user, so the browser cannot fake it.
CREATE OR REPLACE FUNCTION public.set_proposal_created_by()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    NEW.created_by := (SELECT id FROM user_accounts WHERE auth_user_id = auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_proposal_created_by ON proposals;
CREATE TRIGGER trigger_set_proposal_created_by
  BEFORE INSERT ON proposals
  FOR EACH ROW EXECUTE FUNCTION public.set_proposal_created_by();

CREATE POLICY "Conversion roles can read proposals"
  ON proposals FOR SELECT TO authenticated
  USING (public.jwt_user_role() IN ('Conversion Officer', 'Division Head', 'System Administrator'));

-- A new proposal always starts as Generated; it becomes Sent only through send_proposal().
CREATE POLICY "Conversion roles can create proposals"
  ON proposals FOR INSERT TO authenticated
  WITH CHECK (
    public.jwt_user_role() IN ('Conversion Officer', 'Division Head', 'System Administrator')
    AND status = 'Generated'
    AND dispatched_at IS NULL
  );

CREATE POLICY "Conversion roles can update proposals"
  ON proposals FOR UPDATE TO authenticated
  USING (public.jwt_user_role() IN ('Conversion Officer', 'Division Head', 'System Administrator'))
  WITH CHECK (public.jwt_user_role() IN ('Conversion Officer', 'Division Head', 'System Administrator'));
-- No DELETE policy on purpose: saved letters are records and cannot be deleted from the app.

-- Send: mark the proposal Sent and move the prospect to Proposal Sent in ONE transaction.
-- Runs as the caller, so the policies above decide who may use it.
CREATE OR REPLACE FUNCTION public.send_proposal(
  p_proposal_id BIGINT,
  p_delivery delivery_preference_enum
)
RETURNS proposals
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  sent proposals;
BEGIN
  UPDATE proposals
  SET status = 'Sent', delivery_preference = p_delivery, dispatched_at = NOW()
  WHERE id = p_proposal_id AND status = 'Generated'
  RETURNING * INTO sent;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Proposal % was not found, was already sent, or you are not allowed to send it', p_proposal_id;
  END IF;

  -- Only move forward: a prospect already at Proposal Sent or Secured Donor stays where it is.
  UPDATE lead_prospects
  SET pipeline_status = 'Proposal Sent'
  WHERE id = sent.prospect_id
    AND pipeline_status IN ('New Lead', 'Under Research', 'Outreach Started');

  RETURN sent;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.send_proposal(BIGINT, delivery_preference_enum) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_proposal(BIGINT, delivery_preference_enum) TO authenticated;

CREATE POLICY "Allow authenticated users full access to officer_profiles"
  ON officer_profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to lead_outreach_activities"
  ON lead_outreach_activities FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to notifications"
  ON notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);

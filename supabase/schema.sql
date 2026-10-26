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
  password_hash VARCHAR(255) NOT NULL,
  user_role user_role_enum NOT NULL,
  account_status account_status_enum NOT NULL DEFAULT 'Active',
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

-- ==============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE lead_prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE donor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_of_donation ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;

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

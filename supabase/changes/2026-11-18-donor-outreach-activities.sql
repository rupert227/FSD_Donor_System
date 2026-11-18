-- ==============================================================================
-- FSD Donor System - Donor Outreach Activities Migration
-- File: supabase/changes/2026-11-18-donor-outreach-activities.sql
-- Run in Supabase SQL editor on existing databases. Safe and idempotent.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS donor_outreach_activities (
  id BIGSERIAL PRIMARY KEY,
  donor_id BIGINT NOT NULL REFERENCES donor_profiles(id) ON DELETE CASCADE,
  status engagement_status_enum NOT NULL,
  followup_date DATE,
  notes TEXT NOT NULL DEFAULT '',
  author_officer VARCHAR(100) DEFAULT 'System Admin',
  recorded_by BIGINT REFERENCES user_accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_donor_outreach_donor_id ON donor_outreach_activities(donor_id);
CREATE INDEX IF NOT EXISTS idx_donor_outreach_created_at ON donor_outreach_activities(created_at DESC);

ALTER TABLE donor_outreach_activities ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Allow authenticated users full access to donor_outreach_activities"
    ON donor_outreach_activities FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

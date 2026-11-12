-- ==============================================================================
-- FSD Donor System - Outreach Timeline & Notifications Migration
-- File: supabase/changes/2026-11-12-outreach-and-notifications.sql
-- Run in Supabase SQL editor on existing databases. Safe and idempotent.
-- ==============================================================================

-- 1. Link active donor profiles back to their originating lead prospect
ALTER TABLE donor_profiles
  ADD COLUMN IF NOT EXISTS converted_from_lead_id BIGINT
  REFERENCES lead_prospects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_donor_profiles_converted_from
  ON donor_profiles(converted_from_lead_id);

-- 2. Outreach Activities & Multi-Touch History Timeline
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

CREATE INDEX IF NOT EXISTS idx_lead_outreach_prospect_id
  ON lead_outreach_activities(prospect_id);
CREATE INDEX IF NOT EXISTS idx_lead_outreach_created_at
  ON lead_outreach_activities(created_at DESC);

DROP TRIGGER IF EXISTS trigger_update_lead_outreach_activities ON lead_outreach_activities;
CREATE TRIGGER trigger_update_lead_outreach_activities
  BEFORE UPDATE ON lead_outreach_activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE lead_outreach_activities ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Allow authenticated users full access to lead_outreach_activities"
    ON lead_outreach_activities FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 3. System Notifications & Cross-Module Workflow Alerts
CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  module VARCHAR(50) NOT NULL, -- 'Donor Conversion', 'Donor Retention', 'Donor Care'
  type VARCHAR(50) NOT NULL,   -- 'prospect', 'proposal', 'recommitted', 'care_notice', 'receipt', 'followup_due', 'overdue'
  is_alert BOOLEAN NOT NULL DEFAULT FALSE,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  assigned_officer VARCHAR(100), -- Specific officer recipient or NULL for broadcast
  link_url TEXT,                 -- Target URL route
  user_id BIGINT REFERENCES user_accounts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_module
  ON notifications(module);
CREATE INDEX IF NOT EXISTS idx_notifications_assigned_officer
  ON notifications(assigned_officer);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read
  ON notifications(is_read);

DROP TRIGGER IF EXISTS trigger_update_notifications ON notifications;
CREATE TRIGGER trigger_update_notifications
  BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Allow authenticated users full access to notifications"
    ON notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

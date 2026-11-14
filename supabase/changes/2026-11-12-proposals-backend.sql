-- DTI0-20 backend: officers and signatories, locked-down proposals, and the Send function.
-- Run once in the Supabase SQL editor, AFTER 2026-11-11-proposals-officers.sql. Safe to run again.
-- Additive only: nothing is dropped, and all existing rows are kept.

-- ------------------------------------------------------------------
-- 1. officer_profiles: a profile can exist without a sign-in account,
--    and can be marked as someone who signs letters (the "sender").
-- ------------------------------------------------------------------
-- Some people named on prospects (and the letter signatory) have no login.
ALTER TABLE officer_profiles ALTER COLUMN user_id DROP NOT NULL;

-- Only profiles with is_signatory = true appear in the Signatory dropdown.
ALTER TABLE officer_profiles
  ADD COLUMN IF NOT EXISTS is_signatory BOOLEAN NOT NULL DEFAULT false;

-- Profiles for the officer names already used on the sample prospects.
-- full_name matches lead_prospects.assigned_officer exactly so the link below can be filled in.
INSERT INTO officer_profiles (full_name, job_title)
SELECT v.full_name, v.job_title
FROM (VALUES
  ('Officer J. Reyes', 'Senior Stewardship Officer'),
  ('Officer A. Tan', NULL),
  ('Officer M. Cruz', NULL)
) AS v(full_name, job_title)
WHERE NOT EXISTS (SELECT 1 FROM officer_profiles o WHERE o.full_name = v.full_name);

-- Fill in the officer link on prospects that only have the old text name.
UPDATE lead_prospects lp
SET assigned_officer_id = op.id
FROM officer_profiles op
WHERE lp.assigned_officer_id IS NULL
  AND op.full_name = lp.assigned_officer;

-- Division Heads and System Administrators can sign letters. Fill a missing title with their role.
UPDATE officer_profiles op
SET is_signatory = true,
    job_title = COALESCE(op.job_title, ua.user_role::text)
FROM user_accounts ua
WHERE ua.id = op.user_id
  AND ua.user_role IN ('Division Head', 'System Administrator');

-- The signatory carried over from the old sample list (has no login).
INSERT INTO officer_profiles (full_name, job_title, is_signatory)
SELECT 'Fr. Anton C.T. Pascual', 'Executive Director', true
WHERE NOT EXISTS (
  SELECT 1 FROM officer_profiles WHERE full_name = 'Fr. Anton C.T. Pascual'
);

-- ------------------------------------------------------------------
-- 2. proposals: only the Conversion module's roles can read or write.
--    (The proxy already blocks the pages; this protects the data itself.)
-- ------------------------------------------------------------------
-- The signed-in user's role, copied into the token at sign-in.
CREATE OR REPLACE FUNCTION public.jwt_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT auth.jwt() -> 'app_metadata' ->> 'user_role'
$$;

-- created_by is set by the database from the signed-in user, so the browser cannot fake it.
CREATE OR REPLACE FUNCTION public.set_proposal_created_by()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
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

DROP POLICY IF EXISTS "Allow authenticated users full access to proposals" ON proposals;
DROP POLICY IF EXISTS "Conversion roles can read proposals" ON proposals;
DROP POLICY IF EXISTS "Conversion roles can create proposals" ON proposals;
DROP POLICY IF EXISTS "Conversion roles can update proposals" ON proposals;

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

-- ------------------------------------------------------------------
-- 3. Send: mark the proposal Sent and move the prospect to Proposal Sent in ONE transaction.
--    Called by the dispatch panel (DTI0-35): supabase.rpc('send_proposal', {...}).
--    Runs as the caller, so the policies above decide who may use it.
-- ------------------------------------------------------------------
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

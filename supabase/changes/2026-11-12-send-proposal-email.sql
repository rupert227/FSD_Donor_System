-- DTI0-35: keep the email that was sent with a proposal.
-- Run once in the Supabase SQL editor, AFTER 2026-11-12-proposals-backend.sql. Safe to run again.

-- The subject and message the officer sent with the PDF (empty for Postal Mail / Hand Delivered).
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS email_subject VARCHAR(200);
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS email_body TEXT;

-- send_proposal now also stores the subject and message. The two new inputs are optional,
-- so a call with just the id and the delivery choice still works.
DROP FUNCTION IF EXISTS public.send_proposal(BIGINT, delivery_preference_enum);

CREATE OR REPLACE FUNCTION public.send_proposal(
  p_proposal_id BIGINT,
  p_delivery delivery_preference_enum,
  p_email_subject TEXT DEFAULT NULL,
  p_email_body TEXT DEFAULT NULL
)
RETURNS proposals
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  sent proposals;
BEGIN
  UPDATE proposals
  SET status = 'Sent',
      delivery_preference = p_delivery,
      dispatched_at = NOW(),
      email_subject = p_email_subject,
      email_body = p_email_body
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

REVOKE EXECUTE ON FUNCTION public.send_proposal(BIGINT, delivery_preference_enum, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_proposal(BIGINT, delivery_preference_enum, TEXT, TEXT) TO authenticated;

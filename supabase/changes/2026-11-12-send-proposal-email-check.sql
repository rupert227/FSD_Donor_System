-- DTI0-35 / PR #3 review: send_proposal refuses email delivery when the prospect has no valid email.
-- Run once in the Supabase SQL editor, AFTER 2026-11-12-send-proposal-email.sql. Safe to run again.
-- Same signature as the live function (id, delivery, subject, body), so it replaces it
-- and does not create a second overload. Nothing else changes.

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
  prospect_email TEXT;
BEGIN
  -- An emailed PDF needs an address to go to. Checked first, so nothing is changed.
  -- Same pattern as isValidEmail() in the app: name@domain.tld with no spaces.
  IF p_delivery = 'Email PDF (Softcopy)' THEN
    SELECT lp.email_address INTO prospect_email
    FROM proposals p
    JOIN lead_prospects lp ON lp.id = p.prospect_id
    WHERE p.id = p_proposal_id;

    IF prospect_email IS NULL OR prospect_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' THEN
      RAISE EXCEPTION 'This prospect has no valid email address. Add one on the prospect record, or choose Postal Mail or Hand Delivered.';
    END IF;
  END IF;

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

-- CREATE OR REPLACE keeps the existing grants; this just states them again.
REVOKE EXECUTE ON FUNCTION public.send_proposal(BIGINT, delivery_preference_enum, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_proposal(BIGINT, delivery_preference_enum, TEXT, TEXT) TO authenticated;

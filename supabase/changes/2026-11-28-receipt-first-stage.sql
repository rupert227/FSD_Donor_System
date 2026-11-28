-- ==============================================================================
-- Donor Care clearance stages: the DR/OR comes first
--
-- The Caritas interviews (07-08, 07-14) and the project document both say
-- Treasury verifies the deposit and issues the donation/official receipt in one
-- step, before any certificate. So the receipt number now ends Receipt
-- Verification, and the bank reference no. / deposit clearance date are kept as
-- records but no longer decide the stage. The Edit Transaction screen uses the
-- same rule (stageOf in TransactionForm.tsx).
--
--   Receipt Verification  -> DR/OR no. (a PENDING- placeholder doesn't count)
--   Certificate Creation  -> COD no. + COD issuance date (skipped if not requested)
--                            (shown to staff as "COD with Finance")
--   Dispatch Preparation  -> fulfillment date
--   Transaction Finalized
--
-- Run after 2026-11-27-dispatch-preparation-stage.sql. Safe to run more than once.
-- ==============================================================================

BEGIN;

WITH latest_certificate AS (
  SELECT DISTINCT ON (transaction_id) transaction_id, issuance_date
  FROM certificate_of_donation
  ORDER BY transaction_id, id DESC
),
derived AS (
  SELECT t.id,
    CASE
      WHEN COALESCE(t.official_receipt_no, '') = ''
        OR t.official_receipt_no LIKE 'PENDING-%'
        THEN 'Receipt Verification'
      WHEN t.cod_requested
        AND (COALESCE(t.tax_certificate_no, '') = '' OR c.issuance_date IS NULL)
        THEN 'Certificate Creation'
      WHEN t.fulfillment_date IS NULL
        THEN 'Dispatch Preparation'
      ELSE 'Transaction Finalized'
    END::treasury_clearance_status_enum AS stage
  FROM transactions t
  LEFT JOIN latest_certificate c ON c.transaction_id = t.id
)
UPDATE transactions t
SET treasury_clearance_status = d.stage
FROM derived d
WHERE d.id = t.id
  AND t.treasury_clearance_status <> d.stage;

COMMIT;

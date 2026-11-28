-- ==============================================================================
-- Donor Care clearance stages
--
-- Each stage is a number plus its date, and a date only counts once its number
-- is in. The Edit Transaction screen uses the same rule (stageOf).
--
--   Receipt Verification  -> bank reference no. + deposit clearance date
--                            (cash has no bank reference: the date alone)
--   Certificate Creation  -> COD no. + COD issuance date (skipped if not requested)
--   Dispatch Preparation  -> OR no. + fulfillment date
--   Transaction Finalized
--
-- Safe to run more than once.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. Rename the third stage: "Dispatch Prepared" -> "Dispatch Preparation"
--    (skipped if it has already been renamed)
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'treasury_clearance_status_enum'
      AND e.enumlabel = 'Dispatch Prepared'
  ) THEN
    ALTER TYPE treasury_clearance_status_enum
      RENAME VALUE 'Dispatch Prepared' TO 'Dispatch Preparation';
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 2. No certificate requested means no certificate number
-- ------------------------------------------------------------------------------
UPDATE transactions
SET tax_certificate_no = NULL
WHERE NOT cod_requested
  AND tax_certificate_no IS NOT NULL;

DELETE FROM certificate_of_donation c
USING transactions t
WHERE c.transaction_id = t.id
  AND NOT t.cod_requested;

-- ------------------------------------------------------------------------------
-- 3. Cash never goes through a bank: clear its bank details
--    (the columns don't allow NULL, so they become empty text)
-- ------------------------------------------------------------------------------
UPDATE transactions
SET deposit_bank = '',
    bank_reference_no = ''
WHERE payment_method = 'Cash'
  AND (deposit_bank <> '' OR bank_reference_no <> '');

-- ------------------------------------------------------------------------------
-- 4. Every issued certificate needs a certificate record with its issuance date.
--    The seed data has COD numbers but no certificate records, so their issuance
--    date is set to the deposit clearance date (the earliest it could have been
--    issued). These dates are placeholders for sample data, not real records.
-- ------------------------------------------------------------------------------
INSERT INTO certificate_of_donation (
  certificate_no, transaction_id, donor_id, certified_amount, issuance_date
)
SELECT
  t.tax_certificate_no,
  t.id,
  t.donor_id,
  t.amount_collected,
  COALESCE(t.deposit_clearance_date, t.transaction_date)
FROM transactions t
WHERE t.cod_requested
  AND COALESCE(t.tax_certificate_no, '') <> ''
  AND NOT EXISTS (
    SELECT 1 FROM certificate_of_donation c WHERE c.transaction_id = t.id
  );

-- ------------------------------------------------------------------------------
-- 5. Set every stage from the transaction's numbers and dates
-- ------------------------------------------------------------------------------
WITH latest_certificate AS (
  SELECT DISTINCT ON (transaction_id) transaction_id, issuance_date
  FROM certificate_of_donation
  ORDER BY transaction_id, id DESC
),
derived AS (
  SELECT t.id,
    CASE
      WHEN t.deposit_clearance_date IS NULL
        OR (t.payment_method <> 'Cash' AND COALESCE(t.bank_reference_no, '') = '')
        THEN 'Receipt Verification'
      WHEN t.cod_requested
        AND (COALESCE(t.tax_certificate_no, '') = '' OR c.issuance_date IS NULL)
        THEN 'Certificate Creation'
      WHEN t.official_receipt_no LIKE 'PENDING-%'
        OR COALESCE(t.official_receipt_no, '') = ''
        OR t.fulfillment_date IS NULL
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

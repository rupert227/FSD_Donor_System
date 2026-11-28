-- ==============================================================================
-- Remove the "Direct Deposit" payment method
--
-- Direct Deposit overlaps with Bank Transfer and is no longer offered. Existing
-- Direct Deposit transactions become Bank Transfer (their bank and reference
-- no. are kept), then the value is dropped from payment_method_enum.
-- schema.sql and the seeds already leave it out; this brings an existing
-- database in line.
--
-- Postgres can't drop a value from an enum, so the type is rebuilt.
-- Only transactions.payment_method uses it. Safe to run more than once.
-- ==============================================================================

BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'payment_method_enum'
      AND e.enumlabel = 'Direct Deposit'
  ) THEN
    UPDATE transactions
    SET payment_method = 'Bank Transfer'
    WHERE payment_method = 'Direct Deposit';

    ALTER TYPE payment_method_enum RENAME TO payment_method_enum_old;
    CREATE TYPE payment_method_enum AS ENUM ('Bank Transfer', 'Check Payment', 'Cash');
    ALTER TABLE transactions
      ALTER COLUMN payment_method TYPE payment_method_enum
      USING payment_method::TEXT::payment_method_enum;
    DROP TYPE payment_method_enum_old;
  END IF;
END $$;

COMMIT;

-- ==============================================================================
-- Migration: Capitalize donor_type_enum values to Title Case
-- Date: 2026-11-18
--
-- Renames the PostgreSQL enum values in `donor_type_enum` to match the Title Case
-- formatting used across all other system enums (e.g. LeadSourceOriginEnum,
-- PipelineStatusEnum, EngagementStatusEnum).
--
-- Safe migration: ALTER TYPE ... RENAME VALUE modifies the enum in-place
-- without rewriting tables or invalidating foreign keys / indexes.
-- ==============================================================================

DO $$
BEGIN
  -- 1. Rename 'individual' -> 'Individual'
  IF EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'donor_type_enum'::regtype AND enumlabel = 'individual'
  ) THEN
    ALTER TYPE donor_type_enum RENAME VALUE 'individual' TO 'Individual';
  END IF;

  -- 2. Rename 'corporate' -> 'Corporate'
  IF EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'donor_type_enum'::regtype AND enumlabel = 'corporate'
  ) THEN
    ALTER TYPE donor_type_enum RENAME VALUE 'corporate' TO 'Corporate';
  END IF;

  -- 3. Rename 'community' -> 'Community'
  IF EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'donor_type_enum'::regtype AND enumlabel = 'community'
  ) THEN
    ALTER TYPE donor_type_enum RENAME VALUE 'community' TO 'Community';
  END IF;

  -- 4. Rename 'international' -> 'International'
  IF EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'donor_type_enum'::regtype AND enumlabel = 'international'
  ) THEN
    ALTER TYPE donor_type_enum RENAME VALUE 'international' TO 'International';
  END IF;
END $$;

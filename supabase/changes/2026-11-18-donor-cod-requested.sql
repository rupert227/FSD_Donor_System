-- Migration: Add cod_requested to donor_profiles to record BIR Certificate of Donation requests
-- Author: Caritas Manila FSD Donor System
-- Date: 2026-11-18

ALTER TABLE donor_profiles ADD COLUMN IF NOT EXISTS cod_requested BOOLEAN DEFAULT FALSE;

-- Migration: Extend pay_schedules
-- Add is_active flag and enforce frequency values including one_off.

ALTER TABLE pay_schedules
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE pay_schedules
  ADD CONSTRAINT pay_schedules_frequency_check
  CHECK (frequency IN ('weekly', 'fortnightly', 'monthly', 'one_off'));

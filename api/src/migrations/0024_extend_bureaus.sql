-- Migration: Extend bureaus table with contact and operational fields.
-- New columns are all nullable so existing rows are unaffected.
-- metadata JSONB provides a schema-free escape hatch for future fields
-- without requiring additional migrations.

ALTER TABLE bureaus
  ADD COLUMN IF NOT EXISTS country      TEXT,          -- 'NZ' | 'AU' | 'BOTH'
  ADD COLUMN IF NOT EXISTS admin_email  TEXT,
  ADD COLUMN IF NOT EXISTS phone        TEXT,
  ADD COLUMN IF NOT EXISTS website      TEXT,
  ADD COLUMN IF NOT EXISTS metadata     JSONB NOT NULL DEFAULT '{}';

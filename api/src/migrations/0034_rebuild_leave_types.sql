-- Migration: Rebuild leave_types to v0.3 schema
--
-- WHAT CHANGED (v0.3):
--   Old schema: composite PK (code, jurisdiction), column "label", rule config in JSONB.
--   New schema: UUID PK, column "name", explicit boolean flags (is_paid, accrues,
--               counts_as_worked_time, is_active), UNIQUE (code, jurisdiction).
--               Rule/accrual logic moves to the rules engine — not stored here.
--
-- PROCEDURE:
--   1. Drop FK on leave_profile_rules that references the old leave_types PK
--   2. Drop old leave_types table (no live payroll data exists yet)
--   3. Recreate leave_types with new schema
--   4. Restore FK on leave_profile_rules (references the new UNIQUE constraint)
--   5. Reseed NZ and AU leave types
--
-- CODE CHANGES REQUIRED AFTER THIS MIGRATION:
--   Any application code that reads leave_types.label must be updated to read leave_types.name.
--   Any code that reads leave_types.definition JSONB for rule config must be updated to
--   read from the rules engine instead.

-- Step 1: Drop existing FK from leave_profile_rules
ALTER TABLE leave_profile_rules
  DROP CONSTRAINT IF EXISTS leave_profile_rules_leave_type_code_jurisdiction_fkey;

-- Step 2: Drop old leave_types table
DROP TABLE IF EXISTS leave_types;

-- Step 3: Recreate with v0.3 schema
CREATE TABLE leave_types (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code                  TEXT        NOT NULL,
  name                  TEXT        NOT NULL,
  jurisdiction          TEXT        NOT NULL REFERENCES jurisdictions(code),
  is_paid               BOOLEAN     NOT NULL DEFAULT TRUE,
  accrues               BOOLEAN     NOT NULL DEFAULT TRUE,
  counts_as_worked_time BOOLEAN     NOT NULL DEFAULT FALSE,
  is_active             BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (code, jurisdiction)
);

CREATE INDEX ON leave_types(jurisdiction, is_active);

-- Step 4: Restore FK on leave_profile_rules (now references the UNIQUE constraint)
ALTER TABLE leave_profile_rules
  ADD CONSTRAINT leave_profile_rules_leave_type_code_jurisdiction_fkey
  FOREIGN KEY (leave_type_code, jurisdiction) REFERENCES leave_types(code, jurisdiction);

-- Step 5a: Seed NZ leave types
-- Source: Holidays Act 2003
INSERT INTO leave_types (code, name, jurisdiction, is_paid, accrues, counts_as_worked_time) VALUES
  ('ANNUAL',            'Annual Leave',            'NZ', TRUE,  TRUE,  TRUE),
  ('SICK',              'Sick Leave',              'NZ', TRUE,  TRUE,  FALSE),
  ('BEREAVEMENT',       'Bereavement Leave',       'NZ', TRUE,  FALSE, FALSE),
  ('PUBLIC_HOLIDAY',    'Public Holiday',          'NZ', TRUE,  FALSE, FALSE),
  ('ALTERNATIVE',       'Alternative Holiday',     'NZ', TRUE,  TRUE,  FALSE),
  ('PARENTAL',          'Parental Leave',          'NZ', FALSE, FALSE, FALSE),
  ('DOMESTIC_VIOLENCE', 'Domestic Violence Leave', 'NZ', TRUE,  FALSE, FALSE),
  ('UNPAID',            'Unpaid Leave',            'NZ', FALSE, FALSE, FALSE);

-- Step 5b: Seed AU leave types
-- Source: Fair Work Act 2009
INSERT INTO leave_types (code, name, jurisdiction, is_paid, accrues, counts_as_worked_time) VALUES
  ('ANNUAL',            'Annual Leave',              'AU', TRUE,  TRUE,  TRUE),
  ('PERSONAL_SICK',     'Personal/Sick Leave',       'AU', TRUE,  TRUE,  FALSE),
  ('COMPASSIONATE',     'Compassionate Leave',       'AU', TRUE,  FALSE, FALSE),
  ('PUBLIC_HOLIDAY',    'Public Holiday',            'AU', TRUE,  FALSE, FALSE),
  ('LONG_SERVICE',      'Long Service Leave',        'AU', TRUE,  TRUE,  FALSE),
  ('PARENTAL',          'Parental Leave',            'AU', TRUE,  FALSE, FALSE),
  ('COMMUNITY_SERVICE', 'Community Service Leave',   'AU', TRUE,  FALSE, FALSE),
  ('UNPAID',            'Unpaid Leave',              'AU', FALSE, FALSE, FALSE);

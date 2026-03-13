-- Migration: Pay Item Types (NEW v0.3)
-- Registry of every valid earning, allowance, deduction, and reimbursement type.
-- Platform-managed. Tenants customise via tenant_pay_items (migration 0033).
-- All variable_pay_items must reference a row in this table.

CREATE TABLE pay_item_types (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code             TEXT        NOT NULL UNIQUE,
  name             TEXT        NOT NULL,
  category         TEXT        NOT NULL,           -- earning|allowance|deduction|reimbursement
  is_taxable       BOOLEAN     NOT NULL DEFAULT TRUE,
  is_employer_cost BOOLEAN     NOT NULL DEFAULT FALSE,
  jurisdiction     TEXT        NOT NULL DEFAULT 'BOTH', -- NZ|AU|BOTH
  is_active        BOOLEAN     NOT NULL DEFAULT TRUE,
  sort_order       INT         NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ON pay_item_types(jurisdiction, category, is_active);

-- ── NZ Pay Item Types ────────────────────────────────────────────────────────

INSERT INTO pay_item_types (code, name, category, is_taxable, is_employer_cost, jurisdiction, sort_order) VALUES
  ('NZ_ORDINARY',              'Ordinary Time',               'earning',        TRUE,  FALSE, 'NZ', 10),
  ('NZ_OVERTIME',              'Overtime',                    'earning',        TRUE,  FALSE, 'NZ', 20),
  ('NZ_ANNUAL_LEAVE',          'Annual Leave',                'earning',        TRUE,  FALSE, 'NZ', 30),
  ('NZ_SICK_LEAVE',            'Sick Leave',                  'earning',        TRUE,  FALSE, 'NZ', 40),
  ('NZ_BEREAVEMENT',           'Bereavement Leave',           'earning',        TRUE,  FALSE, 'NZ', 50),
  ('NZ_PUBLIC_HOLIDAY',        'Public Holiday Pay',          'earning',        TRUE,  FALSE, 'NZ', 60),
  ('NZ_PUBLIC_HOLIDAY_WORKED', 'Public Holiday Worked',       'earning',        TRUE,  FALSE, 'NZ', 70),
  ('NZ_ALTERNATIVE_HOLIDAY',   'Alternative Holiday',         'earning',        TRUE,  FALSE, 'NZ', 80),
  ('NZ_HOLIDAY_PAY_8PCT',      'Holiday Pay (8%)',            'earning',        TRUE,  FALSE, 'NZ', 90),
  ('NZ_ALLOWANCE_TOOL',        'Tool Allowance',              'allowance',      TRUE,  FALSE, 'NZ', 110),
  ('NZ_ALLOWANCE_VEHICLE',     'Vehicle Allowance',           'allowance',      TRUE,  FALSE, 'NZ', 120),
  ('NZ_ALLOWANCE_MILEAGE',     'Mileage Reimbursement',       'reimbursement',  FALSE, FALSE, 'NZ', 310),
  ('NZ_KIWISAVER_EE',          'KiwiSaver Employee',          'deduction',      FALSE, FALSE, 'NZ', 210),
  ('NZ_KIWISAVER_ER',          'KiwiSaver Employer',          'earning',        FALSE, TRUE,  'NZ', 100),
  ('NZ_ACC_LEVY',              'ACC Levy',                    'deduction',      FALSE, FALSE, 'NZ', 220),
  ('NZ_STUDENT_LOAN',          'Student Loan',                'deduction',      FALSE, FALSE, 'NZ', 230),
  ('NZ_PAYE',                  'PAYE Tax',                    'deduction',      FALSE, FALSE, 'NZ', 200);

-- ── AU Pay Item Types ────────────────────────────────────────────────────────

INSERT INTO pay_item_types (code, name, category, is_taxable, is_employer_cost, jurisdiction, sort_order) VALUES
  ('AU_ORDINARY',              'Ordinary Time Earnings',      'earning',        TRUE,  FALSE, 'AU', 10),
  ('AU_OVERTIME',              'Overtime',                    'earning',        TRUE,  FALSE, 'AU', 20),
  ('AU_ANNUAL_LEAVE',          'Annual Leave',                'earning',        TRUE,  FALSE, 'AU', 30),
  ('AU_SICK_LEAVE',            'Personal/Sick Leave',         'earning',        TRUE,  FALSE, 'AU', 40),
  ('AU_COMPASSIONATE',         'Compassionate Leave',         'earning',        TRUE,  FALSE, 'AU', 50),
  ('AU_PUBLIC_HOLIDAY',        'Public Holiday Pay',          'earning',        TRUE,  FALSE, 'AU', 60),
  ('AU_LONG_SERVICE',          'Long Service Leave',          'earning',        TRUE,  FALSE, 'AU', 70),
  ('AU_PARENTAL',              'Parental Leave Pay',          'earning',        TRUE,  FALSE, 'AU', 80),
  ('AU_ALLOWANCE_TOOL',        'Tool Allowance',              'allowance',      TRUE,  FALSE, 'AU', 110),
  ('AU_ALLOWANCE_CAR',         'Car Allowance',               'allowance',      TRUE,  FALSE, 'AU', 120),
  ('AU_REIMBURSEMENT',         'Expense Reimbursement',       'reimbursement',  FALSE, FALSE, 'AU', 310),
  ('AU_SUPER',                 'Superannuation',              'deduction',      FALSE, TRUE,  'AU', 200),
  ('AU_PAYG',                  'PAYG Withholding',            'deduction',      FALSE, FALSE, 'AU', 210);

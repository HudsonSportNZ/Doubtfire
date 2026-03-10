-- Migration: Leave Types
-- Jurisdiction-specific leave type definitions.
-- definition JSONB contains the full rule config:
--   accrual_method: 'anniversary' | 'progressive'
--   accrual_rate:   numeric
--   accrual_unit:   'weeks' | 'hours' | 'days'
--   pay_method:     'greater_of_awe_owp' | 'ordinary_rate' | 'relevant_daily_pay' | 'adp' | 'government_paid'
--   plus law-specific fields (min_service_weeks, days_per_occasion, etc.)

CREATE TABLE leave_types (
  code         TEXT  NOT NULL,
  jurisdiction TEXT  NOT NULL REFERENCES jurisdictions(code),
  label        TEXT  NOT NULL,
  definition   JSONB NOT NULL,
  PRIMARY KEY (code, jurisdiction)
);

-- ── NZ Leave Types ──────────────────────────────────────────────────────────

INSERT INTO leave_types (code, jurisdiction, label, definition) VALUES
  ('ANNUAL', 'NZ', 'Annual Leave', '{
    "accrual_method": "anniversary",
    "accrual_rate": 4,
    "accrual_unit": "weeks",
    "pay_method": "greater_of_awe_owp",
    "min_service_weeks": 0
  }'),
  ('SICK', 'NZ', 'Sick Leave', '{
    "accrual_method": "anniversary",
    "accrual_rate": 10,
    "accrual_unit": "days",
    "pay_method": "relevant_daily_pay",
    "min_service_months": 6
  }'),
  ('BEREAVEMENT', 'NZ', 'Bereavement Leave', '{
    "pay_method": "relevant_daily_pay",
    "days_immediate_family": 3,
    "days_other": 1
  }'),
  ('PUBLIC_HOLIDAY', 'NZ', 'Public Holiday', '{
    "pay_method": "relevant_daily_pay"
  }'),
  ('ALTERNATIVE', 'NZ', 'Alternative Holiday', '{
    "pay_method": "relevant_daily_pay"
  }'),
  ('LONG_SERVICE', 'NZ', 'Long Service Leave', '{
    "accrual_method": "progressive",
    "accrual_unit": "weeks"
  }'),
  ('PARENTAL', 'NZ', 'Parental Leave', '{
    "pay_method": "government_paid"
  }');

-- ── AU Leave Types ──────────────────────────────────────────────────────────

INSERT INTO leave_types (code, jurisdiction, label, definition) VALUES
  ('ANNUAL', 'AU', 'Annual Leave', '{
    "accrual_method": "progressive",
    "accrual_rate": 4,
    "accrual_unit": "weeks",
    "pay_method": "ordinary_rate"
  }'),
  ('SICK', 'AU', 'Personal / Carer''s Leave', '{
    "accrual_method": "progressive",
    "accrual_rate": 10,
    "accrual_unit": "days",
    "pay_method": "ordinary_rate"
  }'),
  ('BEREAVEMENT', 'AU', 'Compassionate Leave', '{
    "pay_method": "ordinary_rate",
    "days_per_occasion": 2
  }'),
  ('PUBLIC_HOLIDAY', 'AU', 'Public Holiday', '{
    "pay_method": "ordinary_rate"
  }'),
  ('LONG_SERVICE', 'AU', 'Long Service Leave', '{
    "accrual_method": "progressive",
    "accrual_unit": "weeks"
  }'),
  ('PARENTAL', 'AU', 'Parental Leave', '{
    "pay_method": "government_paid"
  }');

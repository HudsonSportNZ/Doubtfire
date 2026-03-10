-- Migration: Pay Settings
-- Effective-dated pay configuration per employee.
-- Multiple rows per employee are allowed; only one row should have effective_to = NULL (current).
-- The UNIQUE constraint on (employee_id, effective_from) prevents duplicate start dates.
--
-- pay_type:    'hourly' | 'salary' | 'casual'
-- pay_frequency: 'weekly' | 'fortnightly' | 'monthly'
-- tax_code:    NZ examples: 'M', 'M SL', 'S', 'SH', 'ST', 'CAE', 'EDW', 'NSW', 'WT'
--              AU examples: 'resident' | 'non-resident' | 'working_holiday'

CREATE TABLE pay_settings (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id         UUID         NOT NULL REFERENCES employees(id),
  pay_type            TEXT         NOT NULL,
  pay_rate            NUMERIC(12,4) NOT NULL,
  pay_frequency       TEXT         NOT NULL,
  hours_per_week      NUMERIC(5,2),
  tax_code            TEXT         NOT NULL,
  kiwisaver_rate      NUMERIC(5,4) DEFAULT 0.0300,    -- NZ only; ignored for AU
  kiwisaver_opted_out BOOLEAN      NOT NULL DEFAULT FALSE,
  effective_from      DATE         NOT NULL,
  effective_to        DATE,
  UNIQUE (employee_id, effective_from)
);

CREATE INDEX ON pay_settings(employee_id);

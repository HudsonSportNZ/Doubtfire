-- Migration: KiwiSaver Rates (NEW v0.3)
-- Registry of valid KiwiSaver contribution rates for NZ.
-- is_valid_employee_rate: employee can elect this rate on their KS2 form
-- is_valid_employer_rate: employer can use this rate (only 3% is valid for employers as of 2024)
-- Platform admin manages this table — e.g. if IRD adds a new valid employee rate.
-- Source: https://www.ird.govt.nz/kiwisaver/kiwisaver-individuals/contributing-to-kiwisaver/kiwisaver-contribution-rates

CREATE TABLE kiwisaver_rates (
  id                     UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  rate                   DECIMAL(5,4) NOT NULL,
  is_valid_employee_rate BOOLEAN      NOT NULL DEFAULT FALSE,
  is_valid_employer_rate BOOLEAN      NOT NULL DEFAULT FALSE,
  is_active              BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (rate)
);

-- Valid rates as at 2024/25 — per IRD KiwiSaver contribution rates schedule
INSERT INTO kiwisaver_rates (rate, is_valid_employee_rate, is_valid_employer_rate) VALUES
  (0.0300, TRUE,  TRUE),   -- 3% — IRD minimum; valid for both employee and employer
  (0.0400, TRUE,  FALSE),  -- 4% — employee election only
  (0.0600, TRUE,  FALSE),  -- 6% — employee election only
  (0.0800, TRUE,  FALSE),  -- 8% — employee election only
  (0.1000, TRUE,  FALSE);  -- 10% — employee election only

-- Migration: Super Rates — AU Superannuation Guarantee rate history (NEW v0.3)
-- Stores the legislated SGA rate schedule. effective_to NULL = currently active or future rate.
-- The calculation engine resolves the applicable rate using pay_run.period_end date.
-- Platform admin adds new rows when Treasury legislates rate changes — no code deployment needed.
-- Source: https://www.ato.gov.au/businesses-and-organisations/super-for-employers/work-out-how-much-super-to-pay/super-guarantee-percentage

CREATE TABLE super_rates (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  rate           DECIMAL(5,4) NOT NULL,
  effective_from DATE         NOT NULL,
  effective_to   DATE,                   -- NULL = active / scheduled future rate
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (effective_from)
);

-- AU SGA rate schedule (historical + legislated future)
INSERT INTO super_rates (rate, effective_from, effective_to) VALUES
  (0.1000, '2021-07-01', '2022-06-30'),  -- 10.00%
  (0.1050, '2022-07-01', '2023-06-30'),  -- 10.50%
  (0.1100, '2023-07-01', '2024-06-30'),  -- 11.00%
  (0.1150, '2024-07-01', '2025-06-30'),  -- 11.50% (current at go-live)
  (0.1200, '2025-07-01', NULL);          -- 12.00% (legislated — effective_to NULL = future rate)

-- Migration: Extend employees table — Phase 4.2 full employee profile
-- Adds General, Employment, Payment, and Tax (NZ) fields.
-- Existing columns retained: first_name, last_name, date_of_birth, tax_identifier,
-- bank_account (legacy), start_date, end_date, status, pay_schedule_id, leave_profile_id.

ALTER TABLE employees
  -- General
  ADD COLUMN title                      TEXT,
  ADD COLUMN middle_name                TEXT,
  ADD COLUMN external_id                TEXT,
  ADD COLUMN email                      TEXT,
  ADD COLUMN mobile_phone               TEXT,
  ADD COLUMN residential_street_address TEXT,
  ADD COLUMN residential_address_line2  TEXT,
  ADD COLUMN residential_city           TEXT,
  ADD COLUMN residential_region         TEXT,
  ADD COLUMN residential_post_code      TEXT,
  ADD COLUMN residential_country        TEXT,

  -- Employment
  ADD COLUMN employment_type            TEXT
    CHECK (employment_type IN ('full_time', 'part_time', 'casual')),
  ADD COLUMN job_title                  TEXT,
  ADD COLUMN automatically_pay          BOOLEAN NOT NULL DEFAULT FALSE,

  -- Payments (structured — replaces the single legacy bank_account column)
  ADD COLUMN bank_name                  TEXT,
  ADD COLUMN bank_account_number        TEXT,
  ADD COLUMN bank_account_name          TEXT,

  -- Tax (NZ)
  -- tax_identifier already exists (IRD number NZ / TFN AU — Phase 6: encrypt at app layer)
  ADD COLUMN tax_code                   TEXT,        -- NZ: M, M SL, S, SH, ST, SA, CAE, EDW, NSW, WT, SB, SB SL
  ADD COLUMN kiwisaver_member           BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN kiwisaver_employee_rate    DECIMAL(5,4), -- 0.0300 = 3%
  ADD COLUMN kiwisaver_employer_rate    DECIMAL(5,4); -- 0.0300 = 3%

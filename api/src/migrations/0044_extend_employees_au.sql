-- Migration: AU employee tax and super fields
-- Adds Australia-specific columns to the employees table.
-- NZ fields were added in 0039_extend_employees.sql.
-- TODO Phase 6: encrypt tfn (stored in tax_identifier) at application layer.

ALTER TABLE employees
  -- AU Tax declaration
  ADD COLUMN tfn_declaration_status       TEXT
    CHECK (tfn_declaration_status IN ('provided', 'not_provided', 'pending')),
  ADD COLUMN residency_for_tax            TEXT
    CHECK (residency_for_tax IN ('resident', 'foreign_resident', 'working_holiday_maker')),
  ADD COLUMN tax_free_threshold_claimed   BOOLEAN,
  ADD COLUMN help_hecs_debt               BOOLEAN,

  -- AU Superannuation
  ADD COLUMN super_fund_name              TEXT,
  ADD COLUMN super_fund_member_number     TEXT,
  ADD COLUMN super_fund_usi               TEXT,
  -- NULL = use the legislated rate from super_rates table for the pay period date
  ADD COLUMN super_guarantee_rate_override DECIMAL(5,4);

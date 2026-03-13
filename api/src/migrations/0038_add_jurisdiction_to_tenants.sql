-- Migration: Add jurisdiction to tenants
-- Each employer (tenant) operates in a single jurisdiction (NZ or AU).
-- This drives tax rules, leave law, and reporting for all employees under that employer.

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS jurisdiction TEXT REFERENCES jurisdictions(code);

-- Migration: Add tax_scale_id to calculation_snapshots (v0.3)
--
-- WHY: Every calculation snapshot must record the exact tax scale used,
-- enabling full reproducibility of any payslip in future.
-- The column is nullable because: (a) historical snapshots predating this
-- column won't have it, and (b) some pay items (e.g. expense reimbursements)
-- may not involve a tax scale lookup at all.
--
-- NOTE: The immutability trigger on calculation_snapshots prevents UPDATE/DELETE
-- of rows, but ALTER TABLE ADD COLUMN is a DDL operation and is not blocked.

ALTER TABLE calculation_snapshots
  ADD COLUMN tax_scale_id UUID REFERENCES tax_scales(id);

COMMENT ON COLUMN calculation_snapshots.tax_scale_id IS
  'The exact tax scale row used for PAYE/PAYG calculation. NULL for pre-v0.3 snapshots or non-tax items.';

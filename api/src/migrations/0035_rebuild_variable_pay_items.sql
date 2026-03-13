-- Migration: Rebuild variable_pay_items to v0.3 schema
--
-- WHAT CHANGED (v0.3):
--   Old: linked via (employee_id, pay_run_id); free-text item_type; no hours/rate columns.
--   New: linked via pay_run_item_id (joining through pay_run_items);
--        pay_item_type_id UUID FK → pay_item_types (enforces valid item type);
--        adds hours and rate columns for detailed line item recording.
--
-- This ensures every recorded pay item is always a known, configured type.
-- No live data exists in this table (no pay runs have been processed), so it
-- is safe to drop and recreate.

-- Drop old table (no FKs point TO variable_pay_items from other tables)
DROP TABLE IF EXISTS variable_pay_items;

-- Recreate with v0.3 schema
CREATE TABLE variable_pay_items (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  pay_run_item_id  UUID          NOT NULL REFERENCES pay_run_items(id),
  pay_item_type_id UUID          NOT NULL REFERENCES pay_item_types(id),
  amount           NUMERIC(12,4) NOT NULL,
  hours            NUMERIC(8,2),             -- for time-based items (e.g. overtime hours)
  rate             NUMERIC(12,4),            -- rate per hour/unit if applicable
  notes            TEXT,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX ON variable_pay_items(pay_run_item_id);
CREATE INDEX ON variable_pay_items(pay_item_type_id);

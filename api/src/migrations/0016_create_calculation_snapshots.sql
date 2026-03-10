-- Migration: Calculation Snapshots
-- Immutable audit record of every pay calculation.
-- Records the full inputs, outputs, and exact rule versions used.
-- Required for AWE (Average Weekly Earnings) historical lookups in the leave engine.
--
-- NEVER UPDATE OR DELETE rows in this table.
-- A trigger enforces immutability at the database level.

CREATE TABLE calculation_snapshots (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  pay_run_item_id    UUID        NOT NULL REFERENCES pay_run_items(id),
  inputs             JSONB       NOT NULL,   -- full context: pay settings, timesheets, period dates
  outputs            JSONB       NOT NULL,   -- all computed line items
  rule_versions_used JSONB       NOT NULL,   -- {rule_code: rule_version_id, ...}
  engine_version     TEXT        NOT NULL,   -- semver of the rules engine that ran the calculation
  calculated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ON calculation_snapshots(pay_run_item_id);

-- Immutability enforcement: raise an exception on any attempt to UPDATE or DELETE.
CREATE OR REPLACE FUNCTION calculation_snapshots_immutable()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'calculation_snapshots is immutable — updates and deletes are not permitted';
END;
$$;

CREATE TRIGGER trg_calculation_snapshots_no_update
  BEFORE UPDATE ON calculation_snapshots
  FOR EACH ROW EXECUTE FUNCTION calculation_snapshots_immutable();

CREATE TRIGGER trg_calculation_snapshots_no_delete
  BEFORE DELETE ON calculation_snapshots
  FOR EACH ROW EXECUTE FUNCTION calculation_snapshots_immutable();

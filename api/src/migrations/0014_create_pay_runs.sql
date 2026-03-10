-- Migration: Pay Runs
-- Central record for each payroll run. Follows a strict state machine:
--   draft → calculating → review → approved → finalised
--   Any state → calculation_failed (retryable)
--   finalised → reversed (corrections are new adjustment pay runs, never mutations)
--
-- run_type: 'regular' | 'adjustment' | 'reversal'
-- Adjustment and reversal runs reference the original via original_pay_run_id.
-- Once finalised, a pay run is permanently immutable. Corrections require a new run.

CREATE TABLE pay_runs (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID        NOT NULL REFERENCES tenants(id),
  pay_schedule_id     UUID        NOT NULL REFERENCES pay_schedules(id),
  jurisdiction        TEXT        NOT NULL REFERENCES jurisdictions(code),
  status              TEXT        NOT NULL DEFAULT 'draft',
  run_type            TEXT        NOT NULL DEFAULT 'regular',
  original_pay_run_id UUID        REFERENCES pay_runs(id),   -- set for adjustment / reversal runs
  period_start        DATE        NOT NULL,
  period_end          DATE        NOT NULL,
  pay_date            DATE        NOT NULL,
  approved_by         UUID        REFERENCES users(id),
  approved_at         TIMESTAMPTZ,
  finalised_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, pay_schedule_id, period_start, run_type)
);

CREATE INDEX ON pay_runs(tenant_id, status);
CREATE INDEX ON pay_runs(tenant_id, period_start);

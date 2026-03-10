-- Migration: Timesheets
-- Attached to a pay run during the draft stage.
-- entries is a JSONB array: [{date, hours, type, notes}]
--   type values: 'ordinary' | 'overtime' | 'leave' | 'public_holiday'
-- allowances is a JSONB array: [{code, amount}]
--
-- status: 'draft' | 'submitted' | 'approved' | 'processed'

CREATE TABLE timesheets (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID        NOT NULL REFERENCES tenants(id),
  employee_id  UUID        NOT NULL REFERENCES employees(id),
  pay_run_id   UUID        REFERENCES pay_runs(id),
  period_start DATE        NOT NULL,
  period_end   DATE        NOT NULL,
  entries      JSONB       NOT NULL DEFAULT '[]',
  allowances   JSONB,
  status       TEXT        NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  deleted_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (employee_id, period_start, period_end)
);

CREATE INDEX ON timesheets(tenant_id);
CREATE INDEX ON timesheets(employee_id);
CREATE INDEX ON timesheets(pay_run_id) WHERE pay_run_id IS NOT NULL;

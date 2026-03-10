-- Migration: Pay Run Items and Line Items
--
-- pay_run_items:      one row per employee per pay run — the summary totals
-- pay_run_line_items: one row per pay component per employee per run — the audit trail
--                     This is the source of truth for payslips, IRD Payday Filing,
--                     ATO STP, bank payment files, and payroll summary reports.
-- variable_pay_items: one-off items attached to a pay run (bonuses, allowances, expenses)
--
-- All monetary columns use NUMERIC(12,4) per the money rules.

CREATE TABLE pay_run_items (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  pay_run_id    UUID          NOT NULL REFERENCES pay_runs(id),
  employee_id   UUID          NOT NULL REFERENCES employees(id),
  gross_wages   NUMERIC(12,4) NOT NULL DEFAULT 0,
  paye_tax      NUMERIC(12,4) NOT NULL DEFAULT 0,
  kiwisaver_ee  NUMERIC(12,4) NOT NULL DEFAULT 0,    -- NZ only
  kiwisaver_er  NUMERIC(12,4) NOT NULL DEFAULT 0,    -- NZ only
  acc_levy      NUMERIC(12,4) NOT NULL DEFAULT 0,    -- NZ only
  super_ee      NUMERIC(12,4) NOT NULL DEFAULT 0,    -- AU only (superannuation employee)
  super_er      NUMERIC(12,4) NOT NULL DEFAULT 0,    -- AU only (superannuation employer)
  net_wages     NUMERIC(12,4) NOT NULL DEFAULT 0,
  hours_worked  NUMERIC(8,2),
  leave_accrued NUMERIC(8,2),
  status        TEXT          NOT NULL DEFAULT 'pending',  -- 'pending' | 'calculated' | 'approved'
  UNIQUE (pay_run_id, employee_id)
);

CREATE INDEX ON pay_run_items(pay_run_id);
CREATE INDEX ON pay_run_items(employee_id);

CREATE TABLE pay_run_line_items (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  pay_run_item_id UUID          NOT NULL REFERENCES pay_run_items(id),
  code            TEXT          NOT NULL,    -- e.g. 'ORDINARY', 'PAYE', 'KIWISAVER_EE', 'ACC', 'SUPER_ER'
  amount          NUMERIC(12,4) NOT NULL,
  is_taxable      BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX ON pay_run_line_items(pay_run_item_id);

CREATE TABLE variable_pay_items (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID          NOT NULL REFERENCES employees(id),
  pay_run_id  UUID          NOT NULL REFERENCES pay_runs(id),
  item_type   TEXT          NOT NULL,   -- 'allowance' | 'bonus' | 'expense' | 'deduction' | 'other'
  description TEXT,
  is_taxable  BOOLEAN       NOT NULL DEFAULT TRUE,
  amount      NUMERIC(12,4) NOT NULL,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX ON variable_pay_items(pay_run_id);
CREATE INDEX ON variable_pay_items(employee_id);

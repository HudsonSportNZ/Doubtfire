-- Migration: Leave Engine Tables
--
-- leave_entitlements: records when leave is granted (anniversary grants, opening balances)
-- leave_transactions: the canonical append-only ledger — source of truth for balances
-- leave_requests:     employee requests for leave, linked to a pay run when processed
--
-- Leave balances are NEVER stored directly. Always computed from leave_transactions via
-- the leave_balances_current view (migration 0021).
--
-- leave_transactions is APPEND-ONLY. A trigger enforces this at the database level.

CREATE TABLE leave_entitlements (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id      UUID          NOT NULL REFERENCES employees(id),
  leave_type_code  TEXT          NOT NULL,
  jurisdiction     TEXT          NOT NULL REFERENCES jurisdictions(code),
  entitlement_date DATE          NOT NULL,
  weeks_granted    NUMERIC(8,4),
  hours_granted    NUMERIC(10,2),
  days_granted     NUMERIC(8,2),
  source           TEXT          NOT NULL,   -- 'accrual' | 'manual_adjustment' | 'opening_balance'
  pay_run_id       UUID          REFERENCES pay_runs(id),
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX ON leave_entitlements(employee_id, leave_type_code);

-- ── Leave Transactions (append-only ledger) ──────────────────────────────────

CREATE TABLE leave_transactions (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id      UUID          NOT NULL REFERENCES employees(id),
  leave_type_code  TEXT          NOT NULL,
  jurisdiction     TEXT          NOT NULL REFERENCES jurisdictions(code),
  transaction_date DATE          NOT NULL,
  type             TEXT          NOT NULL,           -- 'accrual' | 'taken' | 'payout' | 'adjustment' | 'expiry'
  hours_delta      NUMERIC(10,2) NOT NULL,           -- positive = credit, negative = debit
  pay_amount       NUMERIC(12,4),                   -- dollar value if paid out
  pay_method_used  TEXT,                            -- 'awe' | 'owp' | 'rdp' | 'adp' | 'ordinary_rate'
  awe_value        NUMERIC(12,4),                   -- recorded for audit trail
  owp_value        NUMERIC(12,4),                   -- recorded for audit trail
  reference_id     UUID,                            -- leave_request_id or pay_run_id
  reference_type   TEXT,                            -- 'leave_request' | 'pay_run' | 'termination'
  notes            TEXT,
  created_by       UUID          REFERENCES users(id),
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX ON leave_transactions(employee_id, leave_type_code);
CREATE INDEX ON leave_transactions(employee_id, transaction_date);

-- Immutability enforcement on leave_transactions
CREATE OR REPLACE FUNCTION leave_transactions_immutable()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'leave_transactions is append-only — updates and deletes are not permitted';
END;
$$;

CREATE TRIGGER trg_leave_transactions_no_update
  BEFORE UPDATE ON leave_transactions
  FOR EACH ROW EXECUTE FUNCTION leave_transactions_immutable();

CREATE TRIGGER trg_leave_transactions_no_delete
  BEFORE DELETE ON leave_transactions
  FOR EACH ROW EXECUTE FUNCTION leave_transactions_immutable();

-- ── Leave Requests ────────────────────────────────────────────────────────────

CREATE TABLE leave_requests (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID          NOT NULL REFERENCES tenants(id),
  employee_id      UUID          NOT NULL REFERENCES employees(id),
  leave_type_code  TEXT          NOT NULL,
  jurisdiction     TEXT          NOT NULL REFERENCES jurisdictions(code),
  start_date       DATE          NOT NULL,
  end_date         DATE          NOT NULL,
  hours_requested  NUMERIC(10,2) NOT NULL,
  status           TEXT          NOT NULL DEFAULT 'pending',  -- 'pending' | 'approved' | 'declined' | 'cancelled'
  pay_run_id       UUID          REFERENCES pay_runs(id),     -- set when included in a pay run
  approved_by      UUID          REFERENCES users(id),
  approved_at      TIMESTAMPTZ,
  notes            TEXT,
  deleted_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX ON leave_requests(tenant_id);
CREATE INDEX ON leave_requests(employee_id);
CREATE INDEX ON leave_requests(pay_run_id) WHERE pay_run_id IS NOT NULL;

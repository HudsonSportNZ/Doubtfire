-- Migration: Leave Balances View
-- Computes current leave balances from the leave_transactions ledger.
-- This is the canonical source of truth for leave balances — no scalar is stored.
-- balance_hours: positive = employee has leave available, negative = in arrears

CREATE VIEW leave_balances_current AS
SELECT
  employee_id,
  leave_type_code,
  jurisdiction,
  SUM(hours_delta)      AS balance_hours,
  MAX(transaction_date) AS as_at_date
FROM leave_transactions
GROUP BY employee_id, leave_type_code, jurisdiction;

-- Migration: Bureaus
-- Top of the hierarchy: Platform → Bureau → Tenant → Employee
-- A Bureau is a payroll service provider (e.g. "Pay The Nanny").

CREATE TABLE bureaus (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  is_active  BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

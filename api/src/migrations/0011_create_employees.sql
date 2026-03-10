-- Migration: Employees
-- Employees belong to Tenants, not Bureaus.
-- tax_identifier and bank_account are encrypted at the application layer before storage.
-- deleted_at uses soft-delete — hard deletes are prohibited (7-year retention requirement).

CREATE TABLE employees (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID        NOT NULL REFERENCES tenants(id),
  jurisdiction     TEXT        NOT NULL REFERENCES jurisdictions(code),
  leave_profile_id UUID        REFERENCES leave_profiles(id),
  pay_schedule_id  UUID        REFERENCES pay_schedules(id),
  first_name       TEXT        NOT NULL,
  last_name        TEXT        NOT NULL,
  date_of_birth    DATE,
  tax_identifier   TEXT,                        -- IRD number (NZ) / TFN (AU) — encrypted at app layer
  bank_account     TEXT,                        -- encrypted at app layer
  start_date       DATE        NOT NULL,
  end_date         DATE,
  status           TEXT        NOT NULL DEFAULT 'active',  -- 'active' | 'terminated' | 'on_leave'
  deleted_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ON employees(tenant_id);
CREATE INDEX ON employees(tenant_id, status);

-- Employee portal links: employee self-service access (one employee → one user account).
-- Created here because it requires the employees table.

CREATE TABLE employee_portal_links (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID        NOT NULL REFERENCES employees(id),
  user_id     UUID        NOT NULL REFERENCES users(id),
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (employee_id, user_id)
);

CREATE INDEX ON employee_portal_links(user_id);

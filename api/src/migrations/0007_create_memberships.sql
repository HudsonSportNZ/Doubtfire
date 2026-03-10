-- Migration: Bureau and Tenant Memberships
-- Controls which users can access which bureaus/tenants and at what role level.
--
-- Bureau roles: bureau_owner | bureau_admin | bureau_payroll_officer | bureau_readonly
-- Tenant roles: client_owner | client_payroll_admin | client_manager | client_readonly
--
-- employee_portal_links is created in 0011 after the employees table exists.

CREATE TABLE bureau_memberships (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  bureau_id  UUID        NOT NULL REFERENCES bureaus(id),
  user_id    UUID        NOT NULL REFERENCES users(id),
  role       TEXT        NOT NULL,
  is_active  BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (bureau_id, user_id)
);

CREATE INDEX ON bureau_memberships(user_id);
CREATE INDEX ON bureau_memberships(bureau_id);

CREATE TABLE tenant_memberships (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID        NOT NULL REFERENCES tenants(id),
  user_id    UUID        NOT NULL REFERENCES users(id),
  role       TEXT        NOT NULL,
  is_active  BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, user_id)
);

CREATE INDEX ON tenant_memberships(user_id);
CREATE INDEX ON tenant_memberships(tenant_id);

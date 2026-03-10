-- Migration: Tenants
-- A Tenant is a household employer (client of the Bureau).
-- All payroll records are strictly tenant-scoped.

CREATE TABLE tenants (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  bureau_id  UUID        NOT NULL REFERENCES bureaus(id),
  name       TEXT        NOT NULL,
  slug       TEXT        NOT NULL UNIQUE,       -- URL-safe identifier
  status     TEXT        NOT NULL DEFAULT 'active',  -- 'active' | 'suspended' | 'closed'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ON tenants(bureau_id);

-- Migration: Rules Engine Tables
-- Implements 5-level rule inheritance: Jurisdiction → Platform → Bureau → Tenant → Employee
--
-- rules:          the named rule (e.g. NZ_KIWISAVER_EE)
-- rule_versions:  immutable versioned definitions — draft → published → archived
-- rule_overrides: tenant- or employee-level overrides on top of the base definition

CREATE TABLE rules (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code         TEXT        NOT NULL,
  jurisdiction TEXT        REFERENCES jurisdictions(code),  -- NULL = applies to all jurisdictions
  category     TEXT        NOT NULL,                        -- 'tax' | 'super' | 'leave' | 'insurance'
  description  TEXT,
  is_lockable  BOOLEAN     NOT NULL DEFAULT FALSE,          -- if TRUE, tenants cannot override
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (code, jurisdiction)
);

CREATE TABLE rule_versions (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id        UUID        NOT NULL REFERENCES rules(id),
  version_number INT         NOT NULL,
  rule_type      TEXT        NOT NULL,   -- 'percentage' | 'expression' | 'table' | 'conditional'
  definition     JSONB       NOT NULL,   -- {type, expression, table_ref, condition, ...}
  effective_from DATE        NOT NULL,
  effective_to   DATE,
  status         TEXT        NOT NULL DEFAULT 'draft',  -- 'draft' | 'published' | 'archived'
  published_at   TIMESTAMPTZ,
  published_by   UUID        REFERENCES users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (rule_id, version_number)
);

CREATE INDEX ON rule_versions(rule_id, status, effective_from);

CREATE TABLE rule_overrides (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id        UUID        NOT NULL REFERENCES rules(id),
  override_level TEXT        NOT NULL,   -- 'tenant' | 'employee'
  tenant_id      UUID        REFERENCES tenants(id),
  employee_id    UUID        REFERENCES employees(id),
  definition     JSONB       NOT NULL,
  effective_from DATE        NOT NULL,
  effective_to   DATE,
  status         TEXT        NOT NULL DEFAULT 'active',
  created_by     UUID        NOT NULL REFERENCES users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (override_level = 'tenant'   AND tenant_id   IS NOT NULL AND employee_id IS NULL)
    OR
    (override_level = 'employee' AND employee_id IS NOT NULL)
  )
);

CREATE INDEX ON rule_overrides(rule_id, override_level);
CREATE INDEX ON rule_overrides(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX ON rule_overrides(employee_id) WHERE employee_id IS NOT NULL;

-- Migration: Audit Log
-- Append-only record of all INSERT / UPDATE / DELETE operations across sensitive tables.
-- Written by Postgres triggers. Never mutated directly.
-- Retention: 7 years minimum (NZ IRD / AU ATO requirement).
--
-- Uses BIGSERIAL for high-volume sequential inserts (avoids UUID index fragmentation).

CREATE TABLE audit_log (
  id         BIGSERIAL   PRIMARY KEY,
  tenant_id  UUID        NOT NULL,
  table_name TEXT        NOT NULL,
  record_id  UUID        NOT NULL,
  action     TEXT        NOT NULL,       -- 'INSERT' | 'UPDATE' | 'DELETE'
  actor_id   UUID,                       -- user or system process that made the change
  actor_type TEXT,                       -- 'user' | 'api_key' | 'system'
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  old_values JSONB,
  new_values JSONB
);

CREATE INDEX ON audit_log(tenant_id, table_name, record_id);
CREATE INDEX ON audit_log(changed_at);

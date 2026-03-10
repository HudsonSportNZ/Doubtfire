-- Migration: Row Level Security
-- Enforces tenant isolation at the database level on all tenant-scoped tables.
--
-- The application sets app.current_tenant_id via SET LOCAL before each query.
-- Platform admin connections use a superuser role that bypasses RLS.
-- FORCE ROW LEVEL SECURITY ensures even the table owner cannot bypass policies.
--
-- current_setting('app.current_tenant_id', TRUE) — the TRUE flag returns NULL
-- instead of raising an error when the setting is not present, which safely
-- blocks access for any connection that has not set the tenant context.

-- ── employees ────────────────────────────────────────────────────────────────

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON employees
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

-- ── pay_schedules ─────────────────────────────────────────────────────────────

ALTER TABLE pay_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE pay_schedules FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON pay_schedules
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

-- ── pay_runs ─────────────────────────────────────────────────────────────────

ALTER TABLE pay_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pay_runs FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON pay_runs
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

-- ── timesheets ────────────────────────────────────────────────────────────────

ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheets FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON timesheets
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

-- ── leave_requests ────────────────────────────────────────────────────────────

ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON leave_requests
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

-- ── tenant_memberships ────────────────────────────────────────────────────────

ALTER TABLE tenant_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_memberships FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON tenant_memberships
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

-- ── audit_log ─────────────────────────────────────────────────────────────────

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON audit_log
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

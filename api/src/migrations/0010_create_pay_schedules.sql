-- Migration: Pay Schedules
-- Defines the pay frequency and current period dates for a tenant.
-- Pay runs reference a pay schedule.
--
-- frequency: 'weekly' | 'fortnightly' | 'monthly'

CREATE TABLE pay_schedules (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID        NOT NULL REFERENCES tenants(id),
  jurisdiction TEXT        NOT NULL REFERENCES jurisdictions(code),
  name         TEXT        NOT NULL,
  frequency    TEXT        NOT NULL,              -- 'weekly' | 'fortnightly' | 'monthly'
  period_start DATE        NOT NULL,
  period_end   DATE        NOT NULL,
  pay_date     DATE        NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ON pay_schedules(tenant_id);

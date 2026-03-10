-- Migration: Leave Profile Rules
-- Links a leave profile to specific leave types with configurable pay method and accrual rate.
-- Requires both leave_profiles (0009) and leave_types (0018) to exist.

CREATE TABLE leave_profile_rules (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  leave_profile_id UUID          NOT NULL REFERENCES leave_profiles(id),
  leave_type_code  TEXT          NOT NULL,
  jurisdiction     TEXT          NOT NULL REFERENCES jurisdictions(code),
  pay_method       TEXT          NOT NULL,
  accrual_rate     NUMERIC(8,4),
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (leave_profile_id, leave_type_code, jurisdiction),
  FOREIGN KEY (leave_type_code, jurisdiction) REFERENCES leave_types(code, jurisdiction)
);

CREATE INDEX ON leave_profile_rules(leave_profile_id);

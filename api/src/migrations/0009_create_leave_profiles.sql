-- Migration: Leave Profiles
-- A leave profile groups leave entitlement rules and is assigned to employees.
-- leave_profile_rules (linking profiles to leave_types) is created in 0019
-- after leave_types exists.

CREATE TABLE leave_profiles (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT        NOT NULL,
  jurisdiction TEXT        NOT NULL REFERENCES jurisdictions(code),
  is_default   BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ON leave_profiles(jurisdiction);

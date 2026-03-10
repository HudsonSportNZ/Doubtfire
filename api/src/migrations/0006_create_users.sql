-- Migration: Users
-- Platform users — bureau staff and (eventually) tenant admins.
-- platform_role is only set for platform-level administrators.

CREATE TABLE users (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email          TEXT        NOT NULL UNIQUE,
  password_hash  TEXT,                          -- NULL for SSO-only accounts
  full_name      TEXT        NOT NULL,
  platform_role  TEXT,                          -- 'platform_admin' | NULL
  is_active      BOOLEAN     NOT NULL DEFAULT TRUE,
  last_login_at  TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ON users(email);

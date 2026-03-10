-- Migration: Idempotency Keys
-- All write endpoints require an X-Idempotency-Key header.
-- Keys expire after 24 hours. A background job should purge expired rows.

CREATE TABLE idempotency_keys (
  key         TEXT        PRIMARY KEY,           -- value from X-Idempotency-Key header
  method      TEXT        NOT NULL,              -- HTTP method: POST, PUT, PATCH
  path        TEXT        NOT NULL,              -- request path
  response    JSONB,                             -- cached response body (set after first execution)
  status_code INT,                               -- cached HTTP status code
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours'
);

CREATE INDEX ON idempotency_keys(expires_at);

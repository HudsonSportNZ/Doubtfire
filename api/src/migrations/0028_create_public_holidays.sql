-- Migration: Public Holidays (NEW v0.3)
-- Platform-managed list of public holidays for NZ and AU (by state).
-- Updated by platform admin through the Admin Configuration UI — no code changes required.
-- The pay run calculation engine queries this table to determine public holiday treatment
-- for each employee based on their jurisdiction (and AU state where applicable).

CREATE TABLE public_holidays (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction TEXT        NOT NULL REFERENCES jurisdictions(code),
  state        TEXT,                   -- AU only: NSW|VIC|QLD|SA|WA|TAS|ACT|NT. NULL = all states / NZ national
  name         TEXT        NOT NULL,
  date         DATE        NOT NULL,
  is_recurring BOOLEAN     NOT NULL DEFAULT FALSE,  -- TRUE = same date every year (ANZAC Day, Christmas, etc.)
  observed_rule TEXT,                 -- e.g. 'monday_if_weekend' — for dates that shift when they fall on a weekend
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ON public_holidays(jurisdiction, date);
CREATE INDEX ON public_holidays(jurisdiction, state, date);

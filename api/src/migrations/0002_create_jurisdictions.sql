-- Migration: Jurisdictions
-- Reference table for NZ and AU. Drives tax rules, leave law, currency, and reporting.

CREATE TABLE jurisdictions (
  code                 TEXT PRIMARY KEY,        -- 'NZ', 'AU'
  name                 TEXT NOT NULL,
  currency             TEXT NOT NULL,
  tax_year_start_month INT  NOT NULL            -- 4 = April (NZ), 7 = July (AU)
);

INSERT INTO jurisdictions (code, name, currency, tax_year_start_month) VALUES
  ('NZ', 'New Zealand', 'NZD', 4),
  ('AU', 'Australia',   'AUD', 7);

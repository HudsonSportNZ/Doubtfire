-- Migration: Seed AU Public Holidays — 2025 National
-- 8 national public holidays applicable across all Australian states.
-- State-specific additions (NSW, VIC, QLD, SA, WA, TAS, ACT, NT) are Phase 2.
-- Source: https://www.fairwork.gov.au/employment-conditions/public-holidays

INSERT INTO public_holidays (jurisdiction, state, name, date, is_recurring, observed_rule) VALUES
  -- National (applicable to all states)
  ('AU', NULL, 'New Year''s Day',   '2025-01-01', TRUE,  'monday_if_weekend'),
  ('AU', NULL, 'Australia Day',     '2025-01-27', TRUE,  'monday_if_weekend'),  -- 26th is Sunday → observed 27th
  ('AU', NULL, 'Good Friday',       '2025-04-18', FALSE, NULL),
  ('AU', NULL, 'Easter Saturday',   '2025-04-19', FALSE, NULL),
  ('AU', NULL, 'Easter Monday',     '2025-04-21', FALSE, NULL),
  ('AU', NULL, 'ANZAC Day',         '2025-04-25', TRUE,  'monday_if_weekend'),
  ('AU', NULL, 'Christmas Day',     '2025-12-25', TRUE,  'monday_if_weekend'),
  ('AU', NULL, 'Boxing Day',        '2025-12-26', TRUE,  'tuesday_if_weekend'),

  -- 2026 nationals
  ('AU', NULL, 'New Year''s Day',   '2026-01-01', TRUE,  'monday_if_weekend'),
  ('AU', NULL, 'Australia Day',     '2026-01-26', TRUE,  'monday_if_weekend'),
  ('AU', NULL, 'Good Friday',       '2026-04-03', FALSE, NULL),
  ('AU', NULL, 'Easter Saturday',   '2026-04-04', FALSE, NULL),
  ('AU', NULL, 'Easter Monday',     '2026-04-06', FALSE, NULL),
  ('AU', NULL, 'ANZAC Day',         '2026-04-25', TRUE,  'monday_if_weekend'),
  ('AU', NULL, 'Christmas Day',     '2026-12-25', TRUE,  'monday_if_weekend'),
  ('AU', NULL, 'Boxing Day',        '2026-12-28', TRUE,  'tuesday_if_weekend');

-- NOTE: King's Birthday is NOT a national public holiday in AU — each state observes it
-- on a different date. State-specific holidays (including King's Birthday per state,
-- plus state show days, AFL Grand Final, etc.) will be added in Phase 2 via the
-- Admin Configuration UI or a dedicated state holidays migration.

-- Migration: Seed NZ Public Holidays — 2025 & 2026
-- 11 national holidays + Wellington Anniversary Day (required for PTN head office).
-- Dates are the actual observed dates (i.e. shifted to Monday where a holiday falls
-- on a weekend and the employee does not ordinarily work that day).
-- NB: Under the Holidays Act 2003, when a public holiday falls on a Saturday or Sunday,
-- employees who do ordinarily work that day observe it on the actual date; employees who
-- don't ordinarily work it observe the transfer day. We store the ACTUAL statutory date.
-- The calc engine applies transfer day logic at runtime based on the employee's work pattern.
--
-- Source: https://www.employment.govt.nz/leave-and-holidays/public-holidays/public-holidays-and-anniversary-dates/

-- ── 2025 ────────────────────────────────────────────────────────────────────

INSERT INTO public_holidays (jurisdiction, state, name, date, is_recurring, observed_rule) VALUES
  -- National
  ('NZ', NULL, 'New Year''s Day',              '2025-01-01', TRUE,  'monday_if_weekend'),
  ('NZ', NULL, 'Day after New Year''s Day',    '2025-01-02', TRUE,  'tuesday_if_weekend'),
  ('NZ', NULL, 'Waitangi Day',                 '2025-02-06', TRUE,  'monday_if_weekend'),
  ('NZ', NULL, 'Good Friday',                  '2025-04-18', FALSE, NULL),
  ('NZ', NULL, 'Easter Monday',                '2025-04-21', FALSE, NULL),
  ('NZ', NULL, 'ANZAC Day',                    '2025-04-25', TRUE,  'monday_if_weekend'),
  ('NZ', NULL, 'King''s Birthday',             '2025-06-02', FALSE, NULL),   -- First Monday in June
  ('NZ', NULL, 'Matariki',                     '2025-06-20', FALSE, NULL),   -- Set by Te Kāhui o Matariki
  ('NZ', NULL, 'Labour Day',                   '2025-10-27', FALSE, NULL),   -- Fourth Monday in October
  ('NZ', NULL, 'Christmas Day',                '2025-12-25', TRUE,  'monday_if_weekend'),
  ('NZ', NULL, 'Boxing Day',                   '2025-12-26', TRUE,  'tuesday_if_weekend'),

  -- Wellington Anniversary Day (last Monday in January)
  ('NZ', 'WGN', 'Wellington Anniversary Day',  '2025-01-20', FALSE, NULL);

-- ── 2026 ────────────────────────────────────────────────────────────────────

INSERT INTO public_holidays (jurisdiction, state, name, date, is_recurring, observed_rule) VALUES
  -- National
  ('NZ', NULL, 'New Year''s Day',              '2026-01-01', TRUE,  'monday_if_weekend'),
  ('NZ', NULL, 'Day after New Year''s Day',    '2026-01-02', TRUE,  'tuesday_if_weekend'),
  ('NZ', NULL, 'Waitangi Day',                 '2026-02-06', TRUE,  'monday_if_weekend'),
  ('NZ', NULL, 'Good Friday',                  '2026-04-03', FALSE, NULL),
  ('NZ', NULL, 'Easter Monday',                '2026-04-06', FALSE, NULL),
  ('NZ', NULL, 'ANZAC Day',                    '2026-04-25', TRUE,  'monday_if_weekend'),
  ('NZ', NULL, 'King''s Birthday',             '2026-06-01', FALSE, NULL),   -- First Monday in June
  ('NZ', NULL, 'Matariki',                     '2026-07-10', FALSE, NULL),   -- Set by Te Kāhui o Matariki
  ('NZ', NULL, 'Labour Day',                   '2026-10-26', FALSE, NULL),   -- Fourth Monday in October
  ('NZ', NULL, 'Christmas Day',                '2026-12-25', TRUE,  'monday_if_weekend'),
  ('NZ', NULL, 'Boxing Day',                   '2026-12-28', TRUE,  'tuesday_if_weekend'),  -- 26th is Saturday, 27th Sunday → 28th

  -- Wellington Anniversary Day (last Monday in January)
  ('NZ', 'WGN', 'Wellington Anniversary Day',  '2026-01-26', FALSE, NULL);

-- Migration: Seed default leave profiles for NZ and AU
-- Three standard templates per jurisdiction.
-- ON CONFLICT DO NOTHING makes this idempotent.

INSERT INTO leave_profiles (id, name, jurisdiction, is_default) VALUES
  -- NZ
  ('00000000-0000-0000-0001-000000000001', 'Accruing Leave', 'NZ', TRUE),
  ('00000000-0000-0000-0001-000000000002', 'Casual Leave',   'NZ', FALSE),
  ('00000000-0000-0000-0001-000000000003', 'Custom',         'NZ', FALSE),
  -- AU
  ('00000000-0000-0000-0002-000000000001', 'Accruing Leave', 'AU', TRUE),
  ('00000000-0000-0000-0002-000000000002', 'Casual Leave',   'AU', FALSE),
  ('00000000-0000-0000-0002-000000000003', 'Custom',         'AU', FALSE)
ON CONFLICT (id) DO NOTHING;

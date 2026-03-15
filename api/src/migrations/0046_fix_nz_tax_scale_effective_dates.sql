-- Migration 0046: Ensure NZ PAYE scale data is correct for 2025-26 tax year
--
-- WHY THIS EXISTS:
--   Migration 0045 changed ON CONFLICT DO NOTHING → DO UPDATE, but once a migration
--   has been applied (tracked in schema_migrations by filename), the runner never
--   re-runs it even if the file changes. So 0045's DO UPDATE fix never ran on Railway.
--
--   This migration is a new file, so it WILL run. It does two things:
--
--   1. Closes the 2024-04-01 rows with effective_to = '2025-03-31' so they are
--      clearly historical and cannot be picked up for current-year pay runs.
--
--   2. Uses ON CONFLICT DO UPDATE to guarantee the correct 2025-04-01 definitions
--      are in place regardless of any bad data previously inserted via the admin UI.
--
-- SAFE TO RE-RUN: all statements are idempotent.

-- ── Step 1: Close off 2024-04-01 rows ────────────────────────────────────────
-- These rows describe the 2024-25 tax year. End-date them so the engine
-- unambiguously uses the 2025-04-01 rows for any pay run on or after 2025-04-01.

UPDATE tax_scales
SET effective_to = '2025-03-31'
WHERE jurisdiction = 'NZ'
  AND scale_type   = 'NZ_PAYE_M'
  AND effective_from = '2024-04-01'
  AND effective_to IS NULL;

UPDATE tax_scales
SET effective_to = '2025-03-31'
WHERE jurisdiction = 'NZ'
  AND scale_type   = 'NZ_PAYE_ME'
  AND effective_from = '2024-04-01'
  AND effective_to IS NULL;

UPDATE tax_scales
SET effective_to = '2025-03-31'
WHERE jurisdiction = 'NZ'
  AND scale_type   = 'NZ_PAYE_SL'
  AND effective_from = '2024-04-01'
  AND effective_to IS NULL;

UPDATE tax_scales
SET effective_to = '2025-03-31'
WHERE jurisdiction = 'NZ'
  AND scale_type   = 'NZ_PAYE_SH'
  AND effective_from = '2024-04-01'
  AND effective_to IS NULL;

-- ── Step 2: Upsert 2025-04-01 rows with authoritative definitions ─────────────
-- ON CONFLICT DO UPDATE means even if a bad row exists (wrong type, bad JSON),
-- this migration replaces it with the correct definition.

-- NZ_PAYE_M (2025-26): marginal brackets, NO IETC
INSERT INTO tax_scales (jurisdiction, scale_type, effective_from, effective_to, definition)
VALUES ('NZ', 'NZ_PAYE_M', '2025-04-01', NULL, '{
  "type": "nz_marginal_rate",
  "tax_year": "2025-26",
  "brackets": [
    {"from": 0,      "to": 14000,  "rate": 0.105},
    {"from": 14000,  "to": 48000,  "rate": 0.175},
    {"from": 48000,  "to": 70000,  "rate": 0.300},
    {"from": 70000,  "to": 180000, "rate": 0.330},
    {"from": 180000, "to": null,   "rate": 0.390}
  ],
  "note": "No IETC on M code. IETC applies to ME code only. Verify brackets each April against IRD PAYE deductions guide."
}')
ON CONFLICT (jurisdiction, scale_type, effective_from)
DO UPDATE SET definition = EXCLUDED.definition, effective_to = EXCLUDED.effective_to;

-- NZ_PAYE_ME (2025-26): marginal brackets WITH IETC
INSERT INTO tax_scales (jurisdiction, scale_type, effective_from, effective_to, definition)
VALUES ('NZ', 'NZ_PAYE_ME', '2025-04-01', NULL, '{
  "type": "nz_marginal_rate",
  "tax_year": "2025-26",
  "brackets": [
    {"from": 0,      "to": 14000,  "rate": 0.105},
    {"from": 14000,  "to": 48000,  "rate": 0.175},
    {"from": 48000,  "to": 70000,  "rate": 0.300},
    {"from": 70000,  "to": 180000, "rate": 0.330},
    {"from": 180000, "to": null,   "rate": 0.390}
  ],
  "ietc": {
    "description": "Independent Earner Tax Credit — $520/yr for income $24k–$44k, abates 13c/$ to zero at $70k. Tax code ME only.",
    "lower_threshold": 24000,
    "full_credit_upper": 44000,
    "upper_threshold": 70000,
    "annual_credit": 520,
    "abatement_rate": 0.13
  },
  "note": "Verify IETC thresholds and credit amount each April. IETC is for earners not receiving WFF using tax code ME."
}')
ON CONFLICT (jurisdiction, scale_type, effective_from)
DO UPDATE SET definition = EXCLUDED.definition, effective_to = EXCLUDED.effective_to;

-- NZ_PAYE_ND (2025-26): No declaration — flat 45%
INSERT INTO tax_scales (jurisdiction, scale_type, effective_from, effective_to, definition)
VALUES ('NZ', 'NZ_PAYE_ND', '2025-04-01', NULL, '{
  "type": "nz_flat_rate",
  "tax_year": "2025-26",
  "rate": 0.45,
  "acc_applies": true,
  "reason": "no_tax_declaration",
  "note": "Applied when employee has not supplied an IR330. Withhold at 45% until declaration is received."
}')
ON CONFLICT (jurisdiction, scale_type, effective_from)
DO UPDATE SET definition = EXCLUDED.definition, effective_to = EXCLUDED.effective_to;

-- NZ_ACC_LEVY (2025-26): rate 1.67%, cap $152,790
INSERT INTO tax_scales (jurisdiction, scale_type, effective_from, effective_to, definition)
VALUES ('NZ', 'NZ_ACC_LEVY', '2025-04-01', NULL, '{
  "type": "nz_acc_levy",
  "tax_year": "2025-26",
  "rate": 0.0167,
  "annual_maximum_liable_earnings": 152790,
  "note": "Verify rate and cap each April against ACC earner levy schedule. Rate = $1.67 per $100 of liable earnings."
}')
ON CONFLICT (jurisdiction, scale_type, effective_from)
DO UPDATE SET definition = EXCLUDED.definition, effective_to = EXCLUDED.effective_to;

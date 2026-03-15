-- Migration 0045: Fix NZ tax scales for 2025-26 tax year
--
-- CORRECTIONS:
--   1. NZ_PAYE_M  — remove IETC. Tax code M is standard main employment;
--                   the Independent Earner Tax Credit applies to ME only.
--   2. NZ_PAYE_ME — was incorrectly seeded as 45% flat (no-declaration rate).
--                   ME = Main Employment with Earner Credit. Correct definition:
--                   same marginal brackets as M, plus IETC for $24k–$48k earners.
--   3. NZ_PAYE_ND — new scale for "No Declaration" (no IR330 supplied).
--                   Employer must withhold at 45% flat until declaration received.
--                   Previously ND was incorrectly mapped to NZ_PAYE_ME.
--   4. NZ_ACC_LEVY — updated to 2025-26 rates: 1.67% levy, cap $152,790.
--                    (Was 1.60% and $142,283 from the 2024-25 seed.)
--
-- Effective-dating: new rows with effective_from 2025-04-01 take precedence
-- over the 2024-25 rows for any pay period on or after that date.
-- The 2024-25 rows are preserved for historical payslip reproduction.
--
-- ON CONFLICT DO NOTHING makes this migration idempotent — safe to run even
-- if the rows were previously inserted outside the migration runner.

-- 1. NZ_PAYE_M (2025-26): marginal brackets, NO IETC
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
  "note": "⚠️ No IETC on M code. IETC applies to ME (earner credit) code only. Verify brackets each April against IRD PAYE deductions guide."
}')
ON CONFLICT (jurisdiction, scale_type, effective_from) DO NOTHING;

-- 2. NZ_PAYE_ME (2025-26): marginal brackets WITH IETC (earner credit)
--    IETC: full $520/yr credit for $24k-$44k, abates at 13c/$ above $44k, gone at $70k.
--    ⚠️ Verify IETC thresholds and annual credit each tax year against IRD guidance.
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
  "note": "⚠️ Verify IETC thresholds and credit amount each April. IETC is for earners not receiving Working for Families and using tax code ME."
}')
ON CONFLICT (jurisdiction, scale_type, effective_from) DO NOTHING;

-- 3. NZ_PAYE_ND (2025-26): No declaration supplied — flat 45%
INSERT INTO tax_scales (jurisdiction, scale_type, effective_from, effective_to, definition)
VALUES ('NZ', 'NZ_PAYE_ND', '2025-04-01', NULL, '{
  "type": "nz_flat_rate",
  "tax_year": "2025-26",
  "rate": 0.45,
  "acc_applies": true,
  "reason": "no_tax_declaration",
  "note": "⚠️ Applied when employee has not supplied an IR330. Withhold at 45% until declaration is received. Formerly mapped to NZ_PAYE_ME — this is the correct separate scale."
}')
ON CONFLICT (jurisdiction, scale_type, effective_from) DO NOTHING;

-- 4. NZ_ACC_LEVY (2025-26): Updated rate and cap
--    Rate: 1.67% (up from 1.60% in 2024-25)
--    Cap:  $152,790 (up from $142,283 in 2024-25)
--    ⚠️ Verify each April against ACC levy rates page.
INSERT INTO tax_scales (jurisdiction, scale_type, effective_from, effective_to, definition)
VALUES ('NZ', 'NZ_ACC_LEVY', '2025-04-01', NULL, '{
  "type": "nz_acc_levy",
  "tax_year": "2025-26",
  "rate": 0.0167,
  "annual_maximum_liable_earnings": 152790,
  "note": "⚠️ Verify rate and cap each April against ACC earner levy schedule. Rate = $1.67 per $100 of liable earnings. ACC-exempt codes: SA, NSW, WT."
}')
ON CONFLICT (jurisdiction, scale_type, effective_from) DO NOTHING;

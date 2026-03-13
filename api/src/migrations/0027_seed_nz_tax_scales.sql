-- Migration: Seed NZ PAYE Tax Scales — 2024/25 Tax Year
-- Effective from 2024-04-01 (start of NZ tax year 2024/25).
--
-- Scales seeded:
--   NZ_PAYE_M   — Standard main employment (tax code M)
--   NZ_PAYE_ME  — No tax declaration supplied (tax code ND / no-declaration) — flat 45%
--   NZ_PAYE_SL  — Student Loan on top of M brackets (tax code M SL)
--   NZ_PAYE_SH  — Secondary employment, higher rate (tax code SH)
--
-- PAYE calculation method (how the engine uses this data):
--   1. Annualise: period_earnings × annualise_multiplier (52=weekly, 26=fortnightly, 12=monthly)
--   2. Apply marginal rate brackets to annualised amount → annual_tax
--   3. Subtract IETC if applicable (only for M/SL scales)
--   4. Add student loan repayment if applicable (SL scale only)
--   5. De-annualise: (annual_tax + sl_repayment) ÷ annualise_multiplier = period_paye
--   6. Round HALF_UP to 4 decimal places per the money rules
--
-- Source: IRD "PAYE deductions tables" for 2024-25
--   https://www.ird.govt.nz/employing-staff/payday-filing/paye-tables

INSERT INTO tax_scales (jurisdiction, scale_type, effective_from, effective_to, definition) VALUES

-- NZ_PAYE_M: Standard main employment tax code
('NZ', 'NZ_PAYE_M', '2024-04-01', NULL, '{
  "type": "nz_marginal_rate",
  "tax_year": "2024-25",
  "brackets": [
    {"from": 0,      "to": 14000,  "rate": 0.105},
    {"from": 14000,  "to": 48000,  "rate": 0.175},
    {"from": 48000,  "to": 70000,  "rate": 0.300},
    {"from": 70000,  "to": 180000, "rate": 0.330},
    {"from": 180000, "to": null,   "rate": 0.390}
  ],
  "ietc": {
    "description": "Independent Earner Tax Credit — $520/yr for income $24k-$44k, abates to zero at $70k",
    "lower_threshold": 24000,
    "full_credit_upper": 44000,
    "upper_threshold": 70000,
    "annual_credit": 520,
    "abatement_rate": 0.13
  }
}'),

-- NZ_PAYE_ME: No tax code declaration supplied — IRD requires 45% flat rate
('NZ', 'NZ_PAYE_ME', '2024-04-01', NULL, '{
  "type": "nz_flat_rate",
  "tax_year": "2024-25",
  "rate": 0.45,
  "reason": "no_tax_declaration",
  "note": "Applied when employee has not supplied an IR330. Employer must withhold at 45% until declaration is received."
}'),

-- NZ_PAYE_SL: Student Loan — same income tax as M, plus 12% SL repayment above threshold
('NZ', 'NZ_PAYE_SL', '2024-04-01', NULL, '{
  "type": "nz_marginal_rate",
  "tax_year": "2024-25",
  "brackets": [
    {"from": 0,      "to": 14000,  "rate": 0.105},
    {"from": 14000,  "to": 48000,  "rate": 0.175},
    {"from": 48000,  "to": 70000,  "rate": 0.300},
    {"from": 70000,  "to": 180000, "rate": 0.330},
    {"from": 180000, "to": null,   "rate": 0.390}
  ],
  "ietc": {
    "lower_threshold": 24000,
    "full_credit_upper": 44000,
    "upper_threshold": 70000,
    "annual_credit": 520,
    "abatement_rate": 0.13
  },
  "student_loan": {
    "description": "12% repayment on annualised earnings above repayment threshold",
    "annual_threshold": 22828,
    "rate": 0.12
  }
}'),

-- NZ_PAYE_SH: Secondary employment, higher rate — flat 33% (estimated main income $48k-$70k range)
('NZ', 'NZ_PAYE_SH', '2024-04-01', NULL, '{
  "type": "nz_flat_rate",
  "tax_year": "2024-25",
  "rate": 0.33,
  "reason": "secondary_employment_higher",
  "note": "Used when employee has a main job earning $48,001-$70,000. Employee must supply IR330 selecting SH."
}');

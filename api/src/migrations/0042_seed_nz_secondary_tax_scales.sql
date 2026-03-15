-- Migration: NZ Additional Tax Scales
-- Adds secondary employment codes, ACC levy, ESCT, and Student Loan
-- as standalone configurable scales in tax_scales.
--
-- ⚠️  RATES BELOW: Verify against the current IRD Payroll Calculations and Business
--     Rules Specification before each new NZ tax year (starts 1 April).
--     Platform admin adds a new effective-dated row — never edit existing rows.
--
-- NZ Tax Year 2024/25: effective_from 2024-04-01

INSERT INTO tax_scales (jurisdiction, scale_type, effective_from, effective_to, definition) VALUES

-- ─── Secondary employment — flat rate codes ──────────────────────────────────

-- NZ_PAYE_SB: Secondary income below $14,000
('NZ', 'NZ_PAYE_SB', '2024-04-01', NULL, '{
  "type": "nz_flat_rate",
  "tax_year": "2024-25",
  "rate": 0.105,
  "acc_applies": true,
  "reason": "secondary_employment_below_threshold",
  "note": "Secondary employment. Employee selects SB when estimated secondary income is $0-$14,000."
}'),

-- NZ_PAYE_S: Secondary income $14,001-$48,000
('NZ', 'NZ_PAYE_S', '2024-04-01', NULL, '{
  "type": "nz_flat_rate",
  "tax_year": "2024-25",
  "rate": 0.175,
  "acc_applies": true,
  "reason": "secondary_employment_standard",
  "note": "Secondary employment. Employee selects S when estimated secondary income is $14,001-$48,000."
}'),

-- NZ_PAYE_ST: Secondary income, top rate above $180,000
('NZ', 'NZ_PAYE_ST', '2024-04-01', NULL, '{
  "type": "nz_flat_rate",
  "tax_year": "2024-25",
  "rate": 0.39,
  "acc_applies": true,
  "reason": "secondary_employment_top",
  "note": "Secondary employment. Employee selects ST when estimated secondary income exceeds $180,000."
}'),

-- NZ_PAYE_SA: Secondary income, ACC-exempt (e.g. overseas pensions, ACC-exempt income)
('NZ', 'NZ_PAYE_SA', '2024-04-01', NULL, '{
  "type": "nz_flat_rate",
  "tax_year": "2024-25",
  "rate": 0.39,
  "acc_applies": false,
  "reason": "secondary_no_acc",
  "note": "Secondary income where ACC levy does not apply. Used for overseas pensions and ACC-exempt income sources."
}'),

-- NZ_PAYE_CAE: Casual Agricultural Employees — 17.5% flat
('NZ', 'NZ_PAYE_CAE', '2024-04-01', NULL, '{
  "type": "nz_flat_rate",
  "tax_year": "2024-25",
  "rate": 0.175,
  "acc_applies": true,
  "reason": "casual_agricultural_employee",
  "note": "Casual agricultural employees. Designated separately from S for IRD reporting purposes."
}'),

-- NZ_PAYE_EDW: Election Day Workers — 17.5% flat
('NZ', 'NZ_PAYE_EDW', '2024-04-01', NULL, '{
  "type": "nz_flat_rate",
  "tax_year": "2024-25",
  "rate": 0.175,
  "acc_applies": true,
  "reason": "election_day_worker",
  "note": "Election day workers paid by Electoral Commission. Flat rate, no IETC."
}'),

-- NZ_PAYE_NSW: No-special-withholding secondary — 17.5% flat, no ACC
('NZ', 'NZ_PAYE_NSW', '2024-04-01', NULL, '{
  "type": "nz_flat_rate",
  "tax_year": "2024-25",
  "rate": 0.175,
  "acc_applies": false,
  "reason": "no_special_withholding_secondary",
  "note": "Secondary employment where ACC levy is not deducted. Employee supplies IR330 with NSW code."
}'),

-- NZ_PAYE_WT: Withholding tax for schedular payments (contractors)
-- Default 20%; individuals may apply to IRD (IR23) for a lower rate.
-- The platform admin or employer can override the rate by creating a new effective-dated row.
('NZ', 'NZ_PAYE_WT', '2024-04-01', NULL, '{
  "type": "nz_flat_rate",
  "tax_year": "2024-25",
  "rate": 0.20,
  "acc_applies": false,
  "reason": "schedular_payments_withholding_tax",
  "note": "Schedular payment withholding tax. Default 20%. Contractor may hold a special tax rate certificate reducing this. Never apply IETC or KiwiSaver to WT income."
}'),

-- ─── ACC Earner Levy ──────────────────────────────────────────────────────────
-- ⚠️  Rate and maximum liable earnings cap change each tax year.
--     Verify against the current ACC Levy Rates document from acc.co.nz before
--     each 1 April update. Add a new row — never edit this row.

('NZ', 'NZ_ACC_LEVY', '2024-04-01', NULL, '{
  "type": "nz_acc_levy",
  "tax_year": "2024-25",
  "rate": 0.0160,
  "annual_maximum_liable_earnings": 142283,
  "note": "⚠️ Verify rate and cap each April. Rate = $1.60 per $100 of liable earnings. Levy applies only up to annual_maximum_liable_earnings. ACC-exempt tax codes (SA, NSW, WT) do not have this deducted."
}'),

-- ─── Student Loan Repayment ───────────────────────────────────────────────────
-- ⚠️  Annual threshold changes each tax year (linked to minimum wage changes).
--     Verify against IRD student loan repayment thresholds before each 1 April.
--     Applies to all *SL tax codes (M SL, SH SL, SB SL, etc.)
--     The engine detects SL codes and loads this scale to compute the extra deduction.

('NZ', 'NZ_STUDENT_LOAN', '2024-04-01', NULL, '{
  "type": "nz_student_loan",
  "tax_year": "2024-25",
  "annual_threshold": 22828,
  "rate": 0.12,
  "note": "⚠️ Verify threshold each April. 12% deducted on annualised earnings above annual_threshold. De-annualise the result to get the period deduction."
}'),

-- ─── ESCT (Employer Superannuation Contribution Tax) ─────────────────────────
-- Applied to the employer KiwiSaver contribution.
-- Rate is based on employee''s estimated annual gross earnings (prior year income or estimate).
-- ⚠️  ESCT brackets are linked to PAYE thresholds — verify each April.

('NZ', 'NZ_ESCT', '2024-04-01', NULL, '{
  "type": "nz_esct",
  "tax_year": "2024-25",
  "brackets": [
    {"from": 0,      "to": 16800,  "rate": 0.105},
    {"from": 16800,  "to": 57600,  "rate": 0.175},
    {"from": 57600,  "to": 84000,  "rate": 0.300},
    {"from": 84000,  "to": 216000, "rate": 0.330},
    {"from": 216000, "to": null,   "rate": 0.390}
  ],
  "note": "⚠️ ESCT brackets align with PAYE thresholds — verify each April. Applied to employer KiwiSaver contribution amount only. Never applied to employee contributions."
}');

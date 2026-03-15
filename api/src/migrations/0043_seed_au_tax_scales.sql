-- Migration: AU Tax Scales — FY2024/25
-- Seeds AU PAYG withholding scales, Medicare levy, and HELP repayment thresholds.
-- All values are effective-dated. Add new rows each 1 July — never edit existing rows.
--
-- ⚠️  IMPORTANT: Verify ALL values against ATO publications before each financial year:
--     - PAYG brackets & LITO: ATO Tax Withheld Calculator / NAT 1008
--     - Medicare: ATO Medicare Levy page
--     - HELP/HECS: ATO Study and Training Loan repayment thresholds
--
-- Calculation method (marginal-rate approach — same pattern as NZ):
--   1. Period earnings → annualise (× 52 weekly / 26 fortnightly / 12 monthly)
--   2. Apply marginal brackets → annual income tax
--   3. Subtract LITO (Low Income Tax Offset) where applicable
--   4. Add Medicare levy
--   5. Add HELP repayment (if employee has HELP/HECS debt)
--   6. De-annualise → period withholding
--   7. Round HALF_UP per money rules

INSERT INTO tax_scales (jurisdiction, scale_type, effective_from, effective_to, definition) VALUES

-- ─── Scale 1: Residents claiming the tax-free threshold ───────────────────────
('AU', 'AU_PAYG_SCALE1', '2024-07-01', NULL, '{
  "type": "au_payg_marginal",
  "tax_year": "2024-25",
  "scale": 1,
  "scale_name": "Residents claiming tax-free threshold",
  "brackets": [
    {"from": 0,       "to": 18200,  "rate": 0.000},
    {"from": 18200,   "to": 45000,  "rate": 0.190},
    {"from": 45000,   "to": 120000, "rate": 0.325},
    {"from": 120000,  "to": 180000, "rate": 0.370},
    {"from": 180000,  "to": null,   "rate": 0.450}
  ],
  "lito": {
    "description": "Low Income Tax Offset — reduces income tax for lower earners",
    "max_offset": 700,
    "phase_out_1_threshold": 37500,
    "phase_out_1_rate": 0.05,
    "phase_out_2_threshold": 45000,
    "phase_out_2_rate": 0.015,
    "zero_threshold": 66667
  },
  "note": "⚠️ Verify brackets and LITO against ATO NAT 1008 each July. LMITO was removed from FY2022-23."
}'),

-- ─── Scale 2: Residents NOT claiming the tax-free threshold ───────────────────
('AU', 'AU_PAYG_SCALE2', '2024-07-01', NULL, '{
  "type": "au_payg_marginal",
  "tax_year": "2024-25",
  "scale": 2,
  "scale_name": "Residents not claiming tax-free threshold",
  "brackets": [
    {"from": 0,       "to": 45000,  "rate": 0.190},
    {"from": 45000,   "to": 120000, "rate": 0.325},
    {"from": 120000,  "to": 180000, "rate": 0.370},
    {"from": 180000,  "to": null,   "rate": 0.450}
  ],
  "lito": {
    "description": "Low Income Tax Offset applies even without tax-free threshold",
    "max_offset": 700,
    "phase_out_1_threshold": 37500,
    "phase_out_1_rate": 0.05,
    "phase_out_2_threshold": 45000,
    "phase_out_2_rate": 0.015,
    "zero_threshold": 66667
  },
  "note": "⚠️ Verify brackets and LITO against ATO NAT 1008 each July. No tax-free threshold applied."
}'),

-- ─── Scale 3: Foreign residents ──────────────────────────────────────────────
('AU', 'AU_PAYG_SCALE3', '2024-07-01', NULL, '{
  "type": "au_payg_marginal",
  "tax_year": "2024-25",
  "scale": 3,
  "scale_name": "Foreign residents",
  "brackets": [
    {"from": 0,       "to": 120000, "rate": 0.325},
    {"from": 120000,  "to": 180000, "rate": 0.370},
    {"from": 180000,  "to": null,   "rate": 0.450}
  ],
  "lito": null,
  "note": "⚠️ Verify against ATO NAT 1008 each July. No tax-free threshold. No LITO for foreign residents."
}'),

-- ─── Scale 4: No TFN supplied ────────────────────────────────────────────────
('AU', 'AU_PAYG_SCALE4', '2024-07-01', NULL, '{
  "type": "au_payg_flat",
  "tax_year": "2024-25",
  "scale": 4,
  "scale_name": "No tax file number supplied",
  "rate": 0.47,
  "note": "Applied when employee has not supplied a TFN. Withhold at 47% (top marginal 45% + Medicare 2%). Employee should supply TFN as soon as possible."
}'),

-- ─── Scale 6: Working holiday makers ─────────────────────────────────────────
('AU', 'AU_PAYG_SCALE6', '2024-07-01', NULL, '{
  "type": "au_payg_marginal",
  "tax_year": "2024-25",
  "scale": 6,
  "scale_name": "Working holiday makers",
  "brackets": [
    {"from": 0,       "to": 45000,  "rate": 0.150},
    {"from": 45000,   "to": 120000, "rate": 0.325},
    {"from": 120000,  "to": 180000, "rate": 0.370},
    {"from": 180000,  "to": null,   "rate": 0.450}
  ],
  "lito": null,
  "note": "⚠️ Verify against ATO each July. WHM first $45k taxed at 15%, then resident rates above. No LITO."
}'),

-- ─── Medicare Levy ────────────────────────────────────────────────────────────
-- Standard rate: 2% of annual income.
-- Shade-in rule: below low_income_threshold no levy; between threshold and shade_in_upper
-- the levy is capped at shade_in_rate × (income − low_income_threshold).
-- ⚠️  Thresholds are indexed annually — verify each July.
('AU', 'AU_MEDICARE', '2024-07-01', NULL, '{
  "type": "au_medicare",
  "tax_year": "2024-25",
  "standard_rate": 0.02,
  "low_income_threshold": 26000,
  "shade_in_upper": 32500,
  "shade_in_rate": 0.10,
  "note": "⚠️ Verify thresholds each July against ATO Medicare levy page. Algorithm: if income <= threshold: levy=0; if income > shade_in_upper: levy = income × standard_rate; else: levy = min(income × standard_rate, shade_in_rate × (income - low_income_threshold))."
}'),

-- ─── HELP / HECS Repayment Thresholds ────────────────────────────────────────
-- Applied only to employees with help_hecs_debt = true.
-- Repayment = income × rate for the applicable threshold bracket.
-- ⚠️  Thresholds and rates are indexed annually — verify each July against ATO.
('AU', 'AU_HELP', '2024-07-01', NULL, '{
  "type": "au_help",
  "tax_year": "2024-25",
  "thresholds": [
    {"from": 0,      "to": 54434,  "rate": 0.000},
    {"from": 54435,  "to": 62849,  "rate": 0.010},
    {"from": 62850,  "to": 66156,  "rate": 0.020},
    {"from": 66157,  "to": 70572,  "rate": 0.025},
    {"from": 70573,  "to": 75144,  "rate": 0.030},
    {"from": 75145,  "to": 79759,  "rate": 0.035},
    {"from": 79760,  "to": 84973,  "rate": 0.040},
    {"from": 84974,  "to": 90267,  "rate": 0.045},
    {"from": 90268,  "to": 95963,  "rate": 0.050},
    {"from": 95964,  "to": 101899, "rate": 0.055},
    {"from": 101900, "to": 107591, "rate": 0.060},
    {"from": 107592, "to": 114185, "rate": 0.065},
    {"from": 114186, "to": 121121, "rate": 0.070},
    {"from": 121122, "to": 128601, "rate": 0.075},
    {"from": 128602, "to": 136319, "rate": 0.080},
    {"from": 136320, "to": 144641, "rate": 0.085},
    {"from": 144642, "to": 153769, "rate": 0.090},
    {"from": 153770, "to": 162862, "rate": 0.095},
    {"from": 162863, "to": null,   "rate": 0.100}
  ],
  "note": "⚠️ HELP repayment thresholds and rates are indexed annually — verify each July against ATO study and training loan page. Repayment = annual_income × rate (whole income, not just excess)."
}');

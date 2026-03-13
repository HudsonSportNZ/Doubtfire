-- Migration: Tax Scales (NEW v0.3)
-- Dedicated table for tax calculation data, separated from the rules engine.
-- Effective-dated: the calc engine resolves the correct scale using
--   (1) jurisdiction, (2) scale_type mapped from employee tax code,
--   (3) pay_run.period_end date.
-- If no matching scale is found, the pay run halts with a CONFIG_ERROR.
-- Platform admin only can create/update rows. Never modify published rows —
-- add a new row with the new effective_from date.

CREATE TABLE tax_scales (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction   TEXT        NOT NULL REFERENCES jurisdictions(code),
  scale_type     TEXT        NOT NULL,   -- e.g. NZ_PAYE_M, NZ_PAYE_SL, AU_PAYG_WEEKLY
  effective_from DATE        NOT NULL,
  effective_to   DATE,                   -- NULL = currently active
  definition     JSONB       NOT NULL,   -- structured tax calculation rules (see below)
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (jurisdiction, scale_type, effective_from)
);

CREATE INDEX ON tax_scales(jurisdiction, scale_type, effective_from);

-- definition JSONB structure for NZ marginal-rate scales:
-- {
--   "type": "nz_marginal_rate",
--   "tax_year": "2024-25",
--   "brackets": [
--     {"from": 0,      "to": 14000,  "rate": 0.105},
--     {"from": 14000,  "to": 48000,  "rate": 0.175},
--     {"from": 48000,  "to": 70000,  "rate": 0.30},
--     {"from": 70000,  "to": 180000, "rate": 0.33},
--     {"from": 180000, "to": null,   "rate": 0.39}
--   ],
--   "ietc": {
--     "lower": 24000, "upper": 70000,
--     "full_credit": 520,
--     "abatement_start": 44000, "abatement_rate": 0.13
--   }
-- }
--
-- definition JSONB structure for NZ flat-rate scales (ME, SH, ST):
-- {
--   "type": "nz_flat_rate",
--   "tax_year": "2024-25",
--   "rate": 0.33
-- }
--
-- definition JSONB structure for AU PAYG (added Phase 2):
-- {
--   "type": "au_payg",
--   "tax_year": "2024-25",
--   "frequency": "weekly",
--   "scales": [ ... ATO withholding scale rows ... ]
-- }

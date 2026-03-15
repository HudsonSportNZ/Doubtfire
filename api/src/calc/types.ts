/**
 * TypeScript interfaces for tax scale JSONB definitions stored in the tax_scales table.
 * The engine fetches the correct scale at runtime — nothing is hard-coded here.
 */

// ─── Shared ───────────────────────────────────────────────────────────────────

export interface TaxBracket {
  from: number;
  to: number | null;
  rate: number;
}

// ─── NZ ──────────────────────────────────────────────────────────────────────

export interface NzFlatRateScale {
  type: 'nz_flat_rate';
  tax_year: string;
  rate: number;
  acc_applies: boolean;
  reason: string;
  note?: string;
}

export interface NzIetc {
  lower_threshold: number;
  full_credit_upper: number;
  upper_threshold: number;
  annual_credit: number;
  abatement_rate: number;
}

export interface NzStudentLoanInline {
  annual_threshold: number;
  rate: number;
}

export interface NzMarginalRateScale {
  type: 'nz_marginal_rate';
  tax_year: string;
  brackets: TaxBracket[];
  ietc?: NzIetc;
  student_loan?: NzStudentLoanInline;
}

export interface NzAccLevyScale {
  type: 'nz_acc_levy';
  tax_year: string;
  rate: number;
  annual_maximum_liable_earnings: number;
  note?: string;
}

export interface NzStudentLoanScale {
  type: 'nz_student_loan';
  tax_year: string;
  annual_threshold: number;
  rate: number;
  note?: string;
}

export interface NzEsctScale {
  type: 'nz_esct';
  tax_year: string;
  brackets: TaxBracket[];
  note?: string;
}

export type NzScale =
  | NzFlatRateScale
  | NzMarginalRateScale
  | NzAccLevyScale
  | NzStudentLoanScale
  | NzEsctScale;

// ─── AU ──────────────────────────────────────────────────────────────────────

export interface AuLito {
  max_offset: number;
  phase_out_1_threshold: number;
  phase_out_1_rate: number;
  phase_out_2_threshold: number;
  phase_out_2_rate: number;
  zero_threshold: number;
}

export interface AuPaygMarginalScale {
  type: 'au_payg_marginal';
  tax_year: string;
  scale: number;
  scale_name: string;
  brackets: TaxBracket[];
  lito: AuLito | null;
  note?: string;
}

export interface AuPaygFlatScale {
  type: 'au_payg_flat';
  tax_year: string;
  scale: number;
  scale_name: string;
  rate: number;
  note?: string;
}

export interface AuMedicareScale {
  type: 'au_medicare';
  tax_year: string;
  standard_rate: number;
  low_income_threshold: number;
  shade_in_upper: number;
  shade_in_rate: number;
  note?: string;
}

export interface AuHelpThreshold {
  from: number;
  to: number | null;
  rate: number;
}

export interface AuHelpScale {
  type: 'au_help';
  tax_year: string;
  thresholds: AuHelpThreshold[];
  note?: string;
}

export type AuScale =
  | AuPaygMarginalScale
  | AuPaygFlatScale
  | AuMedicareScale
  | AuHelpScale;

// ─── Calculation result ───────────────────────────────────────────────────────

export interface LineItem {
  code: string;
  amount: number;     // NUMERIC(12,4) stored as string in DB, handled as number here
  is_taxable: boolean;
}

export interface CalcStep {
  label: string;      // e.g. "PAYE Income Tax"
  formula: string;    // e.g. "$62,400 × 26 = Annual gross $1,622,400"
  result: string;     // e.g. "$451.54"
  note?: string;      // e.g. "Tax code: M — using NZ_PAYE_M scale"
  sub?: CalcStep[];   // bracket-level detail
}

export interface CalcResult {
  gross_wages: number;
  paye_tax: number;         // NZ: PAYE income tax only (not student loan)
  student_loan: number;     // NZ only, 0 for AU
  kiwisaver_ee: number;     // NZ only, 0 for AU
  kiwisaver_er: number;     // NZ only, 0 for AU
  esct: number;             // NZ only, 0 for AU
  acc_levy: number;         // NZ only, 0 for AU
  super_ee: number;         // AU only, 0 for NZ
  super_er: number;         // AU only, 0 for NZ
  medicare: number;         // AU only, 0 for NZ
  help_repayment: number;   // AU only, 0 for NZ
  net_wages: number;
  line_items: LineItem[];
  inputs_snapshot: Record<string, unknown>;
  scales_used: Record<string, string>;  // { scale_type: scale_row_id }
  steps: CalcStep[];
}

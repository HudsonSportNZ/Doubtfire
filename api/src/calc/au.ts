/**
 * AU Payroll Calculation Engine
 *
 * Computes PAYG withholding, Medicare levy, HELP repayment, and Superannuation
 * for a single employee pay run item. All rates and thresholds are loaded from
 * the database at runtime.
 *
 * Calculation order (per ATO Schedule 1):
 *   1. Gross wages for the period
 *   2. Determine PAYG scale from employee's residency + TFT + TFN status
 *   3. Annualise → apply marginal brackets → subtract LITO → de-annualise
 *   4. Medicare levy (annualised, shade-in for low-income earners)
 *   5. HELP/HECS repayment (if applicable, based on annualised income)
 *   6. Total PAYG withholding = income_tax + medicare + help (de-annualised)
 *   7. Superannuation employer contribution (SGA rate × gross)
 *   8. Net wages = gross − PAYG
 *
 * Rounding: ROUND_HALF_UP to 4 decimal places on every line item (money rules).
 */

import Decimal from 'decimal.js';
import { loadScale, loadSuperRate } from './db-scales';
import type {
  CalcResult,
  LineItem,
  AuPaygMarginalScale,
  AuPaygFlatScale,
  AuMedicareScale,
  AuHelpScale,
  TaxBracket,
} from './types';

Decimal.set({ rounding: Decimal.ROUND_HALF_UP, precision: 20 });

const ANNUALISE: Record<string, number> = {
  weekly:      52,
  fortnightly: 26,
  monthly:     12,
};

function round4(n: Decimal): Decimal {
  return n.toDecimalPlaces(4, Decimal.ROUND_HALF_UP);
}

function applyBrackets(annualIncome: Decimal, brackets: TaxBracket[]): Decimal {
  let tax = new Decimal(0);
  for (const bracket of brackets) {
    const from = new Decimal(bracket.from);
    const to = bracket.to === null ? null : new Decimal(bracket.to);
    const rate = new Decimal(bracket.rate);

    if (annualIncome.lte(from)) break;

    const taxable = to === null
      ? annualIncome.minus(from)
      : Decimal.min(annualIncome, to).minus(from);

    if (taxable.gt(0)) {
      tax = tax.plus(taxable.times(rate));
    }
  }
  return tax;
}

/**
 * Calculate the Low Income Tax Offset (LITO).
 * Returns the annual dollar offset to subtract from income tax.
 */
function calcLito(annualIncome: Decimal, lito: AuPaygMarginalScale['lito']): Decimal {
  if (!lito) return new Decimal(0);

  const maxOffset = new Decimal(lito.max_offset);
  const p1threshold = new Decimal(lito.phase_out_1_threshold);
  const p1rate = new Decimal(lito.phase_out_1_rate);
  const p2threshold = new Decimal(lito.phase_out_2_threshold);
  const p2rate = new Decimal(lito.phase_out_2_rate);

  if (annualIncome.lte(p1threshold)) return maxOffset;

  // Phase-out 1: reduce by p1rate per $ above p1threshold
  let offset = maxOffset.minus(annualIncome.minus(p1threshold).times(p1rate));

  // Phase-out 2: if income is above p2threshold, additional reduction
  if (annualIncome.gt(p2threshold)) {
    offset = offset.minus(annualIncome.minus(p2threshold).times(p2rate));
  }

  return Decimal.max(0, offset);
}

/**
 * Map employee tax profile to AU PAYG scale type.
 * Returns the scale_type string to look up in tax_scales.
 */
function resolveScaleType(
  tfnStatus: string | null,
  residency: string | null,
  taxFreeThresholdClaimed: boolean | null,
): string {
  if (!tfnStatus || tfnStatus === 'not_provided') return 'AU_PAYG_SCALE4';

  switch (residency) {
    case 'foreign_resident':      return 'AU_PAYG_SCALE3';
    case 'working_holiday_maker': return 'AU_PAYG_SCALE6';
    default:
      // Resident — Scale 1 if TFT claimed, Scale 2 if not
      return taxFreeThresholdClaimed ? 'AU_PAYG_SCALE1' : 'AU_PAYG_SCALE2';
  }
}

export interface AuCalcInput {
  employeeId: string;
  grossWages: number;
  frequency: string;
  tfnDeclarationStatus: string | null;
  residencyForTax: string | null;
  taxFreeThresholdClaimed: boolean | null;
  helpHecsDept: boolean | null;
  superGuaranteeRateOverride: number | null;  // null → use legislated rate from super_rates
  periodEnd: string;
}

export async function calculateAU(input: AuCalcInput): Promise<CalcResult> {
  const {
    grossWages, frequency,
    tfnDeclarationStatus, residencyForTax,
    taxFreeThresholdClaimed, helpHecsDept,
    superGuaranteeRateOverride, periodEnd,
  } = input;

  const scalesUsed: Record<string, string> = {};
  const lineItems: LineItem[] = [];
  const gross = new Decimal(grossWages);
  const multiplier = ANNUALISE[frequency];
  if (!multiplier) throw new Error(`Unknown pay frequency: ${frequency}`);

  lineItems.push({ code: 'ORDINARY', amount: round4(gross).toNumber(), is_taxable: true });

  // ── Annualise ──────────────────────────────────────────────────────────────
  const annualGross = gross.times(multiplier);
  const scaleType = resolveScaleType(tfnDeclarationStatus, residencyForTax, taxFreeThresholdClaimed);

  // ── PAYG income tax ────────────────────────────────────────────────────────
  const { id: scaleId, definition: scaleDef } = await loadScale<AuPaygMarginalScale | AuPaygFlatScale>(
    'AU', scaleType, periodEnd,
  );
  scalesUsed[scaleType] = scaleId;

  let annualIncomeTax: Decimal;

  if (scaleDef.type === 'au_payg_flat') {
    annualIncomeTax = annualGross.times(scaleDef.rate);
  } else {
    // au_payg_marginal
    annualIncomeTax = applyBrackets(annualGross, scaleDef.brackets);
    const lito = calcLito(annualGross, scaleDef.lito);
    annualIncomeTax = Decimal.max(0, annualIncomeTax.minus(lito));
  }

  // ── Medicare levy ──────────────────────────────────────────────────────────
  let annualMedicare = new Decimal(0);
  // Medicare does not apply to foreign residents or WHM (handled differently by ATO)
  const medicareApplies = !residencyForTax || residencyForTax === 'resident';
  if (medicareApplies) {
    const { id: medId, definition: medDef } = await loadScale<AuMedicareScale>(
      'AU', 'AU_MEDICARE', periodEnd,
    );
    scalesUsed['AU_MEDICARE'] = medId;

    const threshold = new Decimal(medDef.low_income_threshold);
    const shadeInUpper = new Decimal(medDef.shade_in_upper);
    const standardRate = new Decimal(medDef.standard_rate);
    const shadeInRate = new Decimal(medDef.shade_in_rate);

    if (annualGross.lte(threshold)) {
      annualMedicare = new Decimal(0);
    } else if (annualGross.gt(shadeInUpper)) {
      annualMedicare = annualGross.times(standardRate);
    } else {
      // Shade-in: levy is capped at shade_in_rate × (income − threshold)
      annualMedicare = Decimal.min(
        annualGross.times(standardRate),
        annualGross.minus(threshold).times(shadeInRate),
      );
    }
  }

  // ── HELP / HECS repayment ──────────────────────────────────────────────────
  let annualHelp = new Decimal(0);
  if (helpHecsDept) {
    const { id: helpId, definition: helpDef } = await loadScale<AuHelpScale>(
      'AU', 'AU_HELP', periodEnd,
    );
    scalesUsed['AU_HELP'] = helpId;

    // Find the applicable threshold bracket (rate applies to whole income, not excess)
    for (const t of helpDef.thresholds) {
      if (annualGross.gt(t.from) && (t.to === null || annualGross.lte(t.to))) {
        annualHelp = annualGross.times(t.rate);
        break;
      }
    }
  }

  // ── De-annualise and round ─────────────────────────────────────────────────
  const annualTotal = annualIncomeTax.plus(annualMedicare).plus(annualHelp);
  const periodPayg = round4(annualTotal.div(multiplier));
  const periodMedicare = round4(annualMedicare.div(multiplier));
  const periodHelp = round4(annualHelp.div(multiplier));

  lineItems.push({ code: 'PAYG_WITHHOLDING', amount: periodPayg.toNumber(), is_taxable: false });
  if (periodMedicare.gt(0)) {
    lineItems.push({ code: 'MEDICARE_LEVY', amount: periodMedicare.toNumber(), is_taxable: false });
  }
  if (periodHelp.gt(0)) {
    lineItems.push({ code: 'HELP_REPAYMENT', amount: periodHelp.toNumber(), is_taxable: false });
  }

  // ── Superannuation ─────────────────────────────────────────────────────────
  let superRate: Decimal;
  if (superGuaranteeRateOverride !== null) {
    superRate = new Decimal(superGuaranteeRateOverride);
    scalesUsed['SUPER_RATE_OVERRIDE'] = 'employee_override';
  } else {
    const { id: srId, rate: sr } = await loadSuperRate(periodEnd);
    superRate = new Decimal(sr);
    scalesUsed['SUPER_RATE'] = srId;
  }

  const periodSuperEr = round4(gross.times(superRate));
  lineItems.push({ code: 'SUPER_ER', amount: periodSuperEr.toNumber(), is_taxable: false });

  // ── Net wages ──────────────────────────────────────────────────────────────
  const netWages = round4(gross.minus(periodPayg));

  return {
    gross_wages:    round4(gross).toNumber(),
    paye_tax:       periodPayg.toNumber(),
    student_loan:   0,
    kiwisaver_ee:   0,
    kiwisaver_er:   0,
    esct:           0,
    acc_levy:       0,
    super_ee:       0,
    super_er:       periodSuperEr.toNumber(),
    medicare:       periodMedicare.toNumber(),
    help_repayment: periodHelp.toNumber(),
    net_wages:      netWages.toNumber(),
    line_items:     lineItems,
    inputs_snapshot: { ...input },
    scales_used:    scalesUsed,
  };
}

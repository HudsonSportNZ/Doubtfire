/**
 * NZ Payroll Calculation Engine
 *
 * Computes PAYE, Student Loan, KiwiSaver, ESCT, and ACC for a single employee
 * pay run item. All rates and thresholds are loaded from the database at runtime.
 *
 * Calculation order (per IRD specification):
 *   1. Gross wages for the period
 *   2. PAYE income tax (annualise → brackets/flat → IETC → de-annualise)
 *   3. Student loan repayment (if tax code includes SL)
 *   4. KiwiSaver employee contribution
 *   5. KiwiSaver employer contribution
 *   6. ESCT (tax on employer KiwiSaver contribution)
 *   7. ACC earner levy
 *   8. Net wages = gross − PAYE − student_loan − kiwisaver_ee − acc
 *
 * Rounding: ROUND_HALF_UP to 4 decimal places on every line item (money rules).
 */

import Decimal from 'decimal.js';
import { loadScale } from './db-scales';
import type {
  CalcResult,
  CalcStep,
  LineItem,
  NzMarginalRateScale,
  NzFlatRateScale,
  NzAccLevyScale,
  NzStudentLoanScale,
  NzEsctScale,
  TaxBracket,
} from './types';

// Configure Decimal.js to use ROUND_HALF_UP globally for this module
Decimal.set({ rounding: Decimal.ROUND_HALF_UP, precision: 20 });

/** Map NZ tax code → DB scale_type for PAYE lookup */
const TAX_CODE_TO_SCALE: Record<string, string> = {
  'M':      'NZ_PAYE_M',
  'M SL':   'NZ_PAYE_M',   // same brackets as M; SL handled separately
  'ME':     'NZ_PAYE_ME',   // M with Independent Earner Tax Credit
  'ME SL':  'NZ_PAYE_ME',
  'ND':     'NZ_PAYE_ND',  // no IR330 declaration — 45% flat (separate from ME)
  'S':      'NZ_PAYE_S',
  'S SL':   'NZ_PAYE_S',
  'SH':     'NZ_PAYE_SH',
  'SH SL':  'NZ_PAYE_SH',
  'ST':     'NZ_PAYE_ST',
  'ST SL':  'NZ_PAYE_ST',
  'SA':     'NZ_PAYE_SA',
  'SA SL':  'NZ_PAYE_SA',
  'SB':     'NZ_PAYE_SB',
  'SB SL':  'NZ_PAYE_SB',
  'CAE':    'NZ_PAYE_CAE',
  'EDW':    'NZ_PAYE_EDW',
  'NSW':    'NZ_PAYE_NSW',
  'WT':     'NZ_PAYE_WT',
};

/** Annualise multiplier per pay frequency */
const ANNUALISE: Record<string, number> = {
  weekly:      52,
  fortnightly: 26,
  monthly:     12,
};

/** Round to 4dp HALF_UP */
function round4(n: Decimal): Decimal {
  return n.toDecimalPlaces(4, Decimal.ROUND_HALF_UP);
}

/** Format a Decimal or number as a dollar amount string */
function fmt(n: Decimal | number): string {
  return '$' + new Decimal(n).toFixed(2);
}

/** Format a rate (0.03 → "3%", 0.105 → "10.5%") */
function pct(r: number): string {
  return (r * 100).toFixed(2).replace(/\.?0+$/, '') + '%';
}

/**
 * Apply marginal brackets and collect per-bracket sub-steps.
 */
function applyBracketsWithSteps(
  annualIncome: Decimal,
  brackets: TaxBracket[],
): { tax: Decimal; subSteps: CalcStep[] } {
  let tax = new Decimal(0);
  const subSteps: CalcStep[] = [];

  for (let i = 0; i < brackets.length; i++) {
    const bracket = brackets[i];
    const from = new Decimal(bracket.from);
    const to = bracket.to === null ? null : new Decimal(bracket.to);
    const rate = new Decimal(bracket.rate);

    if (annualIncome.lte(from)) break;

    const taxable = to === null
      ? annualIncome.minus(from)
      : Decimal.min(annualIncome, to).minus(from);

    if (taxable.gt(0)) {
      const bracketTax = taxable.times(rate);
      tax = tax.plus(bracketTax);

      const toLabel = bracket.to !== null ? fmt(bracket.to) : 'and over';
      subSteps.push({
        label: `Bracket ${i + 1}: ${fmt(bracket.from)} – ${toLabel} @ ${pct(bracket.rate)}`,
        formula: `${fmt(taxable)} × ${pct(bracket.rate)} = ${fmt(bracketTax)}`,
        result: fmt(bracketTax),
      });
    }
  }

  return { tax, subSteps };
}

/** Calculate IETC (Independent Earner Tax Credit) for M / M SL codes */
function calcIetc(annualIncome: Decimal, ietc: NzMarginalRateScale['ietc']): Decimal {
  if (!ietc) return new Decimal(0);

  const lower = new Decimal(ietc.lower_threshold);
  const fullUpper = new Decimal(ietc.full_credit_upper);
  const upper = new Decimal(ietc.upper_threshold);
  const credit = new Decimal(ietc.annual_credit);
  const abateRate = new Decimal(ietc.abatement_rate);

  if (annualIncome.lt(lower) || annualIncome.gte(upper)) return new Decimal(0);
  if (annualIncome.lte(fullUpper)) return credit;

  // Abates between full_credit_upper and upper_threshold
  return Decimal.max(0, credit.minus(annualIncome.minus(fullUpper).times(abateRate)));
}

export interface NzCalcInput {
  employeeId: string;
  taxCode: string;
  grossWages: number;               // period gross (pre-deduction)
  frequency: string;                // weekly | fortnightly | monthly
  kiwiSaverMember: boolean;
  kiwiSaverEmployeeRate: number;    // e.g. 0.03
  kiwiSaverEmployerRate: number;    // e.g. 0.03
  annualGrossEstimate: number;      // best estimate of annual gross for ESCT bracket lookup
  periodEnd: string;                // YYYY-MM-DD — used for scale effective-date lookups
}

export async function calculateNZ(input: NzCalcInput): Promise<CalcResult> {
  const {
    taxCode, grossWages, frequency, kiwiSaverMember,
    kiwiSaverEmployeeRate, kiwiSaverEmployerRate,
    annualGrossEstimate, periodEnd,
  } = input;

  const scalesUsed: Record<string, string> = {};
  const lineItems: LineItem[] = [];
  const steps: CalcStep[] = [];
  const gross = new Decimal(grossWages);
  const multiplier = ANNUALISE[frequency];
  if (!multiplier) throw new Error(`Unknown pay frequency: ${frequency}`);

  // ── Gross ──────────────────────────────────────────────────────────────────
  lineItems.push({ code: 'ORDINARY', amount: round4(gross).toNumber(), is_taxable: true });

  steps.push({
    label: 'Gross Wages (this period)',
    formula: `${fmt(gross)} — ${frequency} pay, ${multiplier} periods/year`,
    result: fmt(gross),
  });

  // ── PAYE income tax ────────────────────────────────────────────────────────
  const scaleType = TAX_CODE_TO_SCALE[taxCode.toUpperCase()];
  if (!scaleType) {
    throw new Error(`CONFIG_ERROR: Unknown NZ tax code "${taxCode}". Check the employee's tax code.`);
  }

  const { id: scaleId, definition: scaleDef } = await loadScale<NzMarginalRateScale | NzFlatRateScale>(
    'NZ', scaleType, periodEnd,
  );
  scalesUsed[scaleType] = scaleId;

  let annualPaye = new Decimal(0);
  const annualGross = gross.times(multiplier);
  const accApplies = (scaleDef as NzFlatRateScale).acc_applies !== false;

  // Step 2 — Annual gross
  steps.push({
    label: 'Annual Gross (for tax calculation)',
    formula: `${fmt(gross)} × ${multiplier} periods = ${fmt(annualGross)}`,
    result: fmt(annualGross),
    note: 'Income is annualised before applying tax brackets',
  });

  if (scaleDef.type === 'nz_marginal_rate') {
    const { tax: bracketTax, subSteps: bracketSubSteps } = applyBracketsWithSteps(annualGross, scaleDef.brackets);
    annualPaye = bracketTax;

    const paySub: CalcStep[] = [...bracketSubSteps];

    // IETC
    if (scaleDef.ietc) {
      const ietcCredit = calcIetc(annualGross, scaleDef.ietc);
      annualPaye = Decimal.max(0, annualPaye.minus(ietcCredit));
      paySub.push({
        label: 'Less: IETC (Independent Earner Tax Credit)',
        formula: ietcCredit.gt(0)
          ? `Income ${fmt(annualGross)} within IETC range — credit ${fmt(ietcCredit)}`
          : `Income ${fmt(annualGross)} above threshold ${fmt(scaleDef.ietc.upper_threshold)} — no IETC`,
        result: ietcCredit.gt(0) ? `-${fmt(ietcCredit)}` : '$0.00',
      });
    }

    const periodPayeMarginal = round4(annualPaye.div(multiplier));
    steps.push({
      label: 'PAYE Income Tax',
      formula: `Annual gross ${fmt(annualGross)} → annual tax ${fmt(annualPaye)}`,
      result: `${fmt(periodPayeMarginal)} / period`,
      note: `Tax code: ${taxCode} (${scaleType})`,
      sub: paySub,
    });
    lineItems.push({ code: 'PAYE', amount: periodPayeMarginal.toNumber(), is_taxable: false });
  } else if (scaleDef.type === 'nz_flat_rate') {
    annualPaye = annualGross.times(scaleDef.rate);
    const periodPayeFlat = round4(annualPaye.div(multiplier));
    steps.push({
      label: 'PAYE Income Tax',
      formula: `${fmt(annualGross)} × ${pct(scaleDef.rate)} = ${fmt(annualPaye)}, de-annualised: ${fmt(periodPayeFlat)}`,
      result: `${fmt(periodPayeFlat)} / period`,
      note: `Flat rate — tax code: ${taxCode}`,
    });
    lineItems.push({ code: 'PAYE', amount: periodPayeFlat.toNumber(), is_taxable: false });
  } else {
    // Unknown scale type — fail loudly so the admin knows to fix the scale definition.
    // Previously this silently returned PAYE = 0, which is worse than failing.
    throw new Error(
      `CONFIG_ERROR: Tax scale ${scaleType} has unexpected type "${(scaleDef as { type?: string }).type}". ` +
      `Expected "nz_marginal_rate" or "nz_flat_rate". ` +
      `Fix the definition in Tax Engine → Settings → Tax Scales.`,
    );
  }

  const periodPaye = round4(annualPaye.div(multiplier));

  // ── Student Loan ───────────────────────────────────────────────────────────
  let periodStudentLoan = new Decimal(0);
  const hasSL = taxCode.toUpperCase().includes('SL');
  if (hasSL) {
    const { id: slId, definition: slDef } = await loadScale<NzStudentLoanScale>(
      'NZ', 'NZ_STUDENT_LOAN', periodEnd,
    );
    scalesUsed['NZ_STUDENT_LOAN'] = slId;

    const slThreshold = new Decimal(slDef.annual_threshold);
    const slRate = new Decimal(slDef.rate);
    const repayableAnnual = Decimal.max(0, annualGross.minus(slThreshold));
    periodStudentLoan = round4(repayableAnnual.times(slRate).div(multiplier));
    lineItems.push({ code: 'STUDENT_LOAN', amount: periodStudentLoan.toNumber(), is_taxable: false });

    steps.push({
      label: 'Student Loan Repayment',
      formula: `Annual gross ${fmt(annualGross)} − threshold ${fmt(slThreshold)} = ${fmt(repayableAnnual)} repayable @ ${pct(slDef.rate)} / ${multiplier} periods`,
      result: fmt(periodStudentLoan),
    });
  }

  // ── KiwiSaver ──────────────────────────────────────────────────────────────
  // KiwiSaver does not apply to WT (schedular) or NSW (no-special-withholding) income
  const kiwiSaverEligible = kiwiSaverMember && !['NZ_PAYE_WT', 'NZ_PAYE_NSW'].includes(scaleType);

  let periodKsEe = new Decimal(0);
  let periodKsEr = new Decimal(0);
  let periodEsct = new Decimal(0);

  if (kiwiSaverEligible) {
    periodKsEe = round4(gross.times(kiwiSaverEmployeeRate));
    periodKsEr = round4(gross.times(kiwiSaverEmployerRate));
    lineItems.push({ code: 'KIWISAVER_EE', amount: periodKsEe.toNumber(), is_taxable: false });
    lineItems.push({ code: 'KIWISAVER_ER', amount: periodKsEr.toNumber(), is_taxable: false });

    // ESCT: tax on the employer contribution, based on employee's annual gross estimate
    const { id: esctId, definition: esctDef } = await loadScale<NzEsctScale>(
      'NZ', 'NZ_ESCT', periodEnd,
    );
    scalesUsed['NZ_ESCT'] = esctId;

    const esctAnnual = new Decimal(annualGrossEstimate);
    let esctRate = new Decimal(0);
    for (const bracket of esctDef.brackets) {
      if (esctAnnual.gt(bracket.from)) {
        esctRate = new Decimal(bracket.rate);
      }
    }
    periodEsct = round4(periodKsEr.times(esctRate));
    lineItems.push({ code: 'ESCT', amount: periodEsct.toNumber(), is_taxable: false });

    steps.push({
      label: 'KiwiSaver',
      formula: `EE: ${fmt(periodKsEe)}, ER: ${fmt(periodKsEr)}, ESCT: ${fmt(periodEsct)}`,
      result: fmt(periodKsEe),
      note: 'Only employee contribution deducted from net pay',
      sub: [
        {
          label: 'Employee Contribution',
          formula: `${fmt(gross)} × ${pct(kiwiSaverEmployeeRate)}`,
          result: fmt(periodKsEe),
        },
        {
          label: 'Employer Contribution',
          formula: `${fmt(gross)} × ${pct(kiwiSaverEmployerRate)}`,
          result: fmt(periodKsEr),
          note: 'Employer cost — not deducted from employee',
        },
        {
          label: 'ESCT (tax on employer contribution)',
          formula: `Annual gross estimate ${fmt(annualGrossEstimate)} → ESCT bracket ${pct(esctRate.toNumber())} — ${fmt(periodKsEr)} × ${pct(esctRate.toNumber())}`,
          result: fmt(periodEsct),
          note: 'Employer pays ESCT — not deducted from employee',
        },
      ],
    });
  }

  // ── ACC Earner Levy ────────────────────────────────────────────────────────
  let periodAcc = new Decimal(0);
  if (accApplies) {
    const { id: accId, definition: accDef } = await loadScale<NzAccLevyScale>(
      'NZ', 'NZ_ACC_LEVY', periodEnd,
    );
    scalesUsed['NZ_ACC_LEVY'] = accId;

    const periodAccCap = new Decimal(accDef.annual_maximum_liable_earnings).div(multiplier);
    const liableEarnings = Decimal.min(gross, periodAccCap);
    periodAcc = round4(liableEarnings.times(accDef.rate));
    lineItems.push({ code: 'ACC_LEVY', amount: periodAcc.toNumber(), is_taxable: false });

    steps.push({
      label: 'ACC Earner Levy',
      formula: `Capped liable earnings: min(${fmt(gross)}, ${fmt(periodAccCap)} cap/period) = ${fmt(liableEarnings)} × ${pct(accDef.rate)}`,
      result: fmt(periodAcc),
      note: `Annual cap: ${fmt(accDef.annual_maximum_liable_earnings)}`,
    });
  }

  // ── Net wages ──────────────────────────────────────────────────────────────
  // Employee take-home: gross minus all employee-side deductions
  const netWages = round4(
    gross
      .minus(periodPaye)
      .minus(periodStudentLoan)
      .minus(periodKsEe)
      .minus(periodAcc),
  );

  steps.push({
    label: 'Net Wages',
    formula: `${fmt(gross)} − ${fmt(periodPaye)} PAYE${hasSL ? ` − ${fmt(periodStudentLoan)} Student Loan` : ''}${kiwiSaverEligible ? ` − ${fmt(periodKsEe)} KiwiSaver EE` : ''}${accApplies ? ` − ${fmt(periodAcc)} ACC` : ''}`,
    result: fmt(netWages),
  });

  return {
    gross_wages:    round4(gross).toNumber(),
    paye_tax:       periodPaye.toNumber(),
    student_loan:   periodStudentLoan.toNumber(),
    kiwisaver_ee:   periodKsEe.toNumber(),
    kiwisaver_er:   periodKsEr.toNumber(),
    esct:           periodEsct.toNumber(),
    acc_levy:       periodAcc.toNumber(),
    super_ee:       0,
    super_er:       0,
    medicare:       0,
    help_repayment: 0,
    net_wages:      netWages.toNumber(),
    line_items:     lineItems,
    inputs_snapshot: { ...input },
    scales_used:    scalesUsed,
    steps,
  };
}

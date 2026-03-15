/**
 * Calculation engine dispatcher.
 * Loads employee + pay settings, calls the correct jurisdiction engine,
 * then writes pay_run_items, pay_run_line_items, and calculation_snapshots to DB.
 */

import { query, withTransaction } from '../db/client';
import { calculateNZ } from './nz';
import { calculateAU } from './au';
import type { CalcResult } from './types';

const ENGINE_VERSION = '1.0.0';

interface PayRunRow {
  id: string;
  tenant_id: string;
  pay_schedule_id: string;
  jurisdiction: string;
  status: string;
  period_start: string;
  period_end: string;
  pay_date: string;
}

interface EmployeePayRow {
  employee_id: string;
  first_name: string;
  last_name: string;
  jurisdiction: string;
  // NZ tax
  tax_code: string | null;
  kiwisaver_member: boolean;
  kiwisaver_employee_rate: string | null;
  kiwisaver_employer_rate: string | null;
  // AU tax
  tfn_declaration_status: string | null;
  residency_for_tax: string | null;
  tax_free_threshold_claimed: boolean | null;
  help_hecs_debt: boolean | null;
  super_guarantee_rate_override: string | null;
  // Pay settings (most recent effective row for this period)
  pay_type: string;
  pay_rate: string;
  pay_frequency: string;
  hours_per_week: string | null;
}

/**
 * Derive the period gross wages from pay settings.
 * For salary employees: rate / periods_per_year
 * For hourly / casual: rate × hours_per_period
 */
function deriveGrossWages(
  payType: string,
  payRate: number,
  payFrequency: string,
  hoursPerWeek: number | null,
): number {
  switch (payType) {
    case 'salary': {
      const periods: Record<string, number> = { weekly: 52, fortnightly: 26, monthly: 12 };
      const n = periods[payFrequency];
      if (!n) throw new Error(`Unknown pay frequency: ${payFrequency}`);
      return payRate / n;
    }
    case 'hourly':
    case 'casual': {
      if (hoursPerWeek === null) throw new Error('hours_per_week required for hourly/casual employees');
      const hoursPerPeriod: Record<string, number> = {
        weekly: hoursPerWeek,
        fortnightly: hoursPerWeek * 2,
        monthly: hoursPerWeek * (52 / 12),
      };
      const h = hoursPerPeriod[payFrequency];
      if (h === undefined) throw new Error(`Unknown pay frequency: ${payFrequency}`);
      return payRate * h;
    }
    default:
      throw new Error(`Unknown pay type: ${payType}`);
  }
}

/**
 * Run calculation for every active employee on the pay run's schedule.
 * Called synchronously from the /calculate route.
 * Returns the number of employees processed.
 */
export async function runPayRunCalculation(payRunId: string): Promise<number> {
  // 1. Load the pay run
  const payRunRows = await query<PayRunRow>(
    `SELECT id, tenant_id, pay_schedule_id, jurisdiction, status, period_start, period_end, pay_date
     FROM pay_runs WHERE id = $1`,
    [payRunId],
  );
  if (payRunRows.length === 0) throw new Error('PAY_RUN_NOT_FOUND');
  const payRun = payRunRows[0];
  if (payRun.status !== 'calculating') throw new Error(`PAY_RUN_INVALID_STATE: expected calculating, got ${payRun.status}`);

  // 2. Determine which employees to calculate.
  //    If any pay_run_items exist already (manually added), use those.
  //    Otherwise, auto-populate from the pay schedule (all active employees on it).
  const manualItems = await query<{ employee_id: string }>(
    `SELECT employee_id FROM pay_run_items WHERE pay_run_id = $1`,
    [payRunId],
  );

  let employeeSql: string;
  let employeeParams: unknown[];

  if (manualItems.length > 0) {
    const ids = manualItems.map(r => r.employee_id);
    // Use ANY($3::uuid[]) to filter to only the manually added employees
    employeeSql = `
      SELECT
         e.id AS employee_id,
         e.first_name, e.last_name, e.jurisdiction,
         e.tax_code,
         e.kiwisaver_member,
         e.kiwisaver_employee_rate,
         e.kiwisaver_employer_rate,
         e.tfn_declaration_status,
         e.residency_for_tax,
         e.tax_free_threshold_claimed,
         e.help_hecs_debt,
         e.super_guarantee_rate_override,
         ps.pay_type,
         ps.pay_rate,
         ps.pay_frequency,
         ps.hours_per_week
       FROM employees e
       JOIN pay_settings ps ON ps.employee_id = e.id
         AND ps.effective_from <= $1
         AND (ps.effective_to IS NULL OR ps.effective_to >= $1)
       WHERE e.id = ANY($2::uuid[])
         AND e.deleted_at IS NULL`;
    employeeParams = [payRun.period_end, ids];
  } else {
    employeeSql = `
      SELECT
         e.id AS employee_id,
         e.first_name, e.last_name, e.jurisdiction,
         e.tax_code,
         e.kiwisaver_member,
         e.kiwisaver_employee_rate,
         e.kiwisaver_employer_rate,
         e.tfn_declaration_status,
         e.residency_for_tax,
         e.tax_free_threshold_claimed,
         e.help_hecs_debt,
         e.super_guarantee_rate_override,
         ps.pay_type,
         ps.pay_rate,
         ps.pay_frequency,
         ps.hours_per_week
       FROM employees e
       JOIN pay_settings ps ON ps.employee_id = e.id
         AND ps.effective_from <= $2
         AND (ps.effective_to IS NULL OR ps.effective_to >= $2)
       WHERE e.pay_schedule_id = $1
         AND e.status = 'active'
         AND e.deleted_at IS NULL`;
    employeeParams = [payRun.pay_schedule_id, payRun.period_end];
  }

  const employees = await query<EmployeePayRow>(employeeSql, employeeParams);

  let processed = 0;

  for (const emp of employees) {
    // Check for a timesheet attached to this pay run for this employee.
    // If found, use timesheet hours instead of the standard hours_per_week.
    const timesheetRows = await query<{ total_hours: string }>(
      `SELECT COALESCE(SUM((entry->>'hours')::numeric), 0)::text AS total_hours
       FROM timesheets t, jsonb_array_elements(t.entries) AS entry
       WHERE t.pay_run_id = $1 AND t.employee_id = $2`,
      [payRunId, emp.employee_id],
    );
    const timesheetHours = timesheetRows[0]?.total_hours
      ? Number(timesheetRows[0].total_hours)
      : null;

    // For hourly/casual employees with a timesheet, use timesheet hours directly.
    // For salary employees, timesheet hours are ignored — salary is always pro-rata.
    const hoursForCalc = (timesheetHours !== null && timesheetHours > 0)
      ? timesheetHours
      : (emp.hours_per_week ? Number(emp.hours_per_week) : null);

    // For hourly/casual + timesheet: gross = rate × actual hours (not per-period hours)
    let grossWages: number;
    if (timesheetHours !== null && timesheetHours > 0 && (emp.pay_type === 'hourly' || emp.pay_type === 'casual')) {
      grossWages = Number(emp.pay_rate) * timesheetHours;
    } else {
      grossWages = deriveGrossWages(
        emp.pay_type,
        Number(emp.pay_rate),
        emp.pay_frequency,
        hoursForCalc,
      );
    }

    let result: CalcResult;

    if (emp.jurisdiction === 'NZ') {
      const taxCode = emp.tax_code ?? 'ME'; // Default to ME (no declaration) if not set
      result = await calculateNZ({
        employeeId: emp.employee_id,
        taxCode,
        grossWages,
        frequency: emp.pay_frequency,
        kiwiSaverMember: emp.kiwisaver_member ?? false,
        kiwiSaverEmployeeRate: Number(emp.kiwisaver_employee_rate ?? '0.03'),
        kiwiSaverEmployerRate: Number(emp.kiwisaver_employer_rate ?? '0.03'),
        annualGrossEstimate: grossWages * (emp.pay_frequency === 'weekly' ? 52 : emp.pay_frequency === 'fortnightly' ? 26 : 12),
        periodEnd: payRun.period_end,
      });
    } else if (emp.jurisdiction === 'AU') {
      result = await calculateAU({
        employeeId: emp.employee_id,
        grossWages,
        frequency: emp.pay_frequency,
        tfnDeclarationStatus: emp.tfn_declaration_status,
        residencyForTax: emp.residency_for_tax,
        taxFreeThresholdClaimed: emp.tax_free_threshold_claimed,
        helpHecsDept: emp.help_hecs_debt,
        superGuaranteeRateOverride: emp.super_guarantee_rate_override
          ? Number(emp.super_guarantee_rate_override)
          : null,
        periodEnd: payRun.period_end,
      });
    } else {
      throw new Error(`Unknown jurisdiction for employee ${emp.employee_id}: ${emp.jurisdiction}`);
    }

    // 3. Write results in a transaction
    await withTransaction(async (client) => {
      // pay_run_items
      const itemRows = await client.query(
        `INSERT INTO pay_run_items
           (pay_run_id, employee_id, gross_wages, paye_tax, kiwisaver_ee, kiwisaver_er,
            acc_levy, super_ee, super_er, net_wages, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'calculated')
         ON CONFLICT (pay_run_id, employee_id) DO UPDATE SET
           gross_wages   = EXCLUDED.gross_wages,
           paye_tax      = EXCLUDED.paye_tax,
           kiwisaver_ee  = EXCLUDED.kiwisaver_ee,
           kiwisaver_er  = EXCLUDED.kiwisaver_er,
           acc_levy      = EXCLUDED.acc_levy,
           super_ee      = EXCLUDED.super_ee,
           super_er      = EXCLUDED.super_er,
           net_wages     = EXCLUDED.net_wages,
           status        = 'calculated'
         RETURNING id`,
        [
          payRunId,
          emp.employee_id,
          result.gross_wages,
          result.paye_tax,
          result.kiwisaver_ee,
          result.kiwisaver_er,
          result.acc_levy,
          result.super_ee,
          result.super_er,
          result.net_wages,
        ],
      );
      const payRunItemId = itemRows.rows[0].id as string;

      // pay_run_line_items — delete old lines first (re-calculation)
      await client.query(
        `DELETE FROM pay_run_line_items WHERE pay_run_item_id = $1`,
        [payRunItemId],
      );
      for (const li of result.line_items) {
        await client.query(
          `INSERT INTO pay_run_line_items (pay_run_item_id, code, amount, is_taxable)
           VALUES ($1, $2, $3, $4)`,
          [payRunItemId, li.code, li.amount, li.is_taxable],
        );
      }

      // calculation_snapshot (immutable — always insert a new row)
      await client.query(
        `INSERT INTO calculation_snapshots
           (pay_run_item_id, inputs, outputs, rule_versions_used, engine_version)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          payRunItemId,
          JSON.stringify(result.inputs_snapshot),
          JSON.stringify({
            gross_wages:    result.gross_wages,
            paye_tax:       result.paye_tax,
            student_loan:   result.student_loan,
            kiwisaver_ee:   result.kiwisaver_ee,
            kiwisaver_er:   result.kiwisaver_er,
            esct:           result.esct,
            acc_levy:       result.acc_levy,
            super_er:       result.super_er,
            medicare:       result.medicare,
            help_repayment: result.help_repayment,
            net_wages:      result.net_wages,
            line_items:     result.line_items,
          }),
          JSON.stringify(result.scales_used),
          ENGINE_VERSION,
        ],
      );
    });

    processed++;
  }

  return processed;
}

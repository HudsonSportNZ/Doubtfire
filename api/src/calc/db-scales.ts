/**
 * Runtime loader for tax scales stored in the tax_scales table.
 * The calculation engine calls these helpers — no rates are hard-coded anywhere.
 *
 * loadScale() returns the JSONB definition of the scale that was active on the
 * given date (period_end of the pay run). If no scale is found the pay run
 * halts with a CONFIG_ERROR — an admin must add the missing effective-dated row.
 */

import { query } from '../db/client';
import type { NzScale, AuScale } from './types';

interface ScaleRow {
  id: string;
  definition: NzScale | AuScale;
}

/**
 * Load the active tax scale for the given jurisdiction, type, and date.
 * Returns the row id (for the snapshot) and the parsed JSONB definition.
 * Throws if no matching active scale is found.
 */
export async function loadScale<T extends NzScale | AuScale>(
  jurisdiction: string,
  scaleType: string,
  asOfDate: string,   // YYYY-MM-DD — pay run period_end
): Promise<{ id: string; definition: T }> {
  const rows = await query<ScaleRow>(
    `SELECT id, definition
     FROM tax_scales
     WHERE jurisdiction = $1
       AND scale_type   = $2
       AND effective_from <= $3
       AND (effective_to IS NULL OR effective_to >= $3)
     ORDER BY effective_from DESC
     LIMIT 1`,
    [jurisdiction, scaleType, asOfDate],
  );

  if (rows.length === 0) {
    throw new Error(
      `CONFIG_ERROR: No active tax scale found for ${jurisdiction}/${scaleType} as of ${asOfDate}. ` +
      `A platform admin must add an effective-dated row to the tax_scales table.`,
    );
  }

  return { id: rows[0].id, definition: rows[0].definition as T };
}

/**
 * Load the current AU superannuation guarantee rate.
 */
export async function loadSuperRate(asOfDate: string): Promise<{ id: string; rate: number }> {
  const rows = await query<{ id: string; rate: string }>(
    `SELECT id, rate
     FROM super_rates
     WHERE effective_from <= $1
       AND (effective_to IS NULL OR effective_to >= $1)
     ORDER BY effective_from DESC
     LIMIT 1`,
    [asOfDate],
  );

  if (rows.length === 0) {
    throw new Error(
      `CONFIG_ERROR: No super rate found as of ${asOfDate}. ` +
      `A platform admin must add a row to the super_rates table.`,
    );
  }

  return { id: rows[0].id, rate: Number(rows[0].rate) };
}

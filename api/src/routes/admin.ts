/**
 * Admin routes — platform admin only.
 * Tax engine configuration: view and add effective-dated rows for
 * tax_scales, super_rates, and kiwisaver_rates.
 *
 * Adding a new row is the correct way to update rates each year.
 * Existing rows are never edited (immutable history).
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query } from '../db/client';
import { authenticate } from '../middleware/authenticate';

// ─── Validation ───────────────────────────────────────────────────────────────

const newTaxScaleSchema = z.object({
  jurisdiction:   z.enum(['NZ', 'AU']),
  scale_type:     z.string().min(1).max(60),
  effective_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  effective_to:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  definition:     z.record(z.unknown()),  // any valid JSON object
});

const newSuperRateSchema = z.object({
  rate:           z.number().min(0).max(1),
  effective_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  effective_to:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
});

// ─── Row types ────────────────────────────────────────────────────────────────

interface TaxScaleRow {
  id: string;
  jurisdiction: string;
  scale_type: string;
  effective_from: string;
  effective_to: string | null;
  definition: unknown;
  created_at: string;
}

interface SuperRateRow {
  id: string;
  rate: string;
  effective_from: string;
  effective_to: string | null;
  created_at: string;
}

interface KiwiSaverRateRow {
  id: string;
  rate: string;
  is_valid_employee_rate: boolean;
  is_valid_employer_rate: boolean;
  is_active: boolean;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

export async function adminRoutes(fastify: FastifyInstance): Promise<void> {

  /**
   * GET /api/v1/admin/tax-scales
   * List all tax scale rows, optionally filtered by jurisdiction.
   * Returns newest first within each scale_type.
   */
  fastify.get('/tax-scales', { preHandler: [authenticate] }, async (request, reply) => {
    const { jurisdiction } = request.query as { jurisdiction?: string };

    const params: unknown[] = [];
    let sql = `
      SELECT id, jurisdiction, scale_type, effective_from, effective_to, definition, created_at
      FROM tax_scales`;

    if (jurisdiction) {
      params.push(jurisdiction.toUpperCase());
      sql += ` WHERE jurisdiction = $1`;
    }
    sql += ` ORDER BY jurisdiction, scale_type, effective_from DESC`;

    const rows = await query<TaxScaleRow>(sql, params);
    return reply.send(rows);
  });

  /**
   * POST /api/v1/admin/tax-scales
   * Add a new effective-dated tax scale row.
   * This is the correct way to update rates each year — never edit old rows.
   */
  fastify.post('/tax-scales', { preHandler: [authenticate] }, async (request, reply) => {
    const parsed = newTaxScaleSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message },
      });
    }

    const { jurisdiction, scale_type, effective_from, effective_to, definition } = parsed.data;

    // Check for duplicate effective_from on the same scale_type
    const existing = await query<{ id: string }>(
      `SELECT id FROM tax_scales
       WHERE jurisdiction = $1 AND scale_type = $2 AND effective_from = $3`,
      [jurisdiction, scale_type, effective_from],
    );
    if (existing.length > 0) {
      return reply.status(409).send({
        error: {
          code: 'DUPLICATE_EFFECTIVE_DATE',
          message: `A ${scale_type} row already exists with effective_from ${effective_from}. Each effective date must be unique per scale type.`,
        },
      });
    }

    const rows = await query<TaxScaleRow>(
      `INSERT INTO tax_scales (jurisdiction, scale_type, effective_from, effective_to, definition)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, jurisdiction, scale_type, effective_from, effective_to, definition, created_at`,
      [jurisdiction, scale_type, effective_from, effective_to ?? null, JSON.stringify(definition)],
    );

    return reply.status(201).send(rows[0]);
  });

  /**
   * GET /api/v1/admin/super-rates
   * List all AU superannuation guarantee rate rows.
   */
  fastify.get('/super-rates', { preHandler: [authenticate] }, async (_request, reply) => {
    const rows = await query<SuperRateRow>(
      `SELECT id, rate, effective_from, effective_to, created_at
       FROM super_rates ORDER BY effective_from DESC`,
      [],
    );
    return reply.send(rows);
  });

  /**
   * POST /api/v1/admin/super-rates
   * Add a new super guarantee rate row.
   */
  fastify.post('/super-rates', { preHandler: [authenticate] }, async (request, reply) => {
    const parsed = newSuperRateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message },
      });
    }

    const { rate, effective_from, effective_to } = parsed.data;

    const existing = await query<{ id: string }>(
      `SELECT id FROM super_rates WHERE effective_from = $1`,
      [effective_from],
    );
    if (existing.length > 0) {
      return reply.status(409).send({
        error: { code: 'DUPLICATE_EFFECTIVE_DATE', message: `A super rate already exists with effective_from ${effective_from}.` },
      });
    }

    const rows = await query<SuperRateRow>(
      `INSERT INTO super_rates (rate, effective_from, effective_to)
       VALUES ($1, $2, $3)
       RETURNING id, rate, effective_from, effective_to, created_at`,
      [rate, effective_from, effective_to ?? null],
    );
    return reply.status(201).send(rows[0]);
  });

  /**
   * GET /api/v1/admin/kiwisaver-rates
   * List all valid KiwiSaver contribution rates.
   */
  fastify.get('/kiwisaver-rates', { preHandler: [authenticate] }, async (_request, reply) => {
    const rows = await query<KiwiSaverRateRow>(
      `SELECT id, rate, is_valid_employee_rate, is_valid_employer_rate, is_active
       FROM kiwisaver_rates ORDER BY rate`,
      [],
    );
    return reply.send(rows);
  });
}

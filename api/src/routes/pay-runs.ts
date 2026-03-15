import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/client';
import { authenticate } from '../middleware/authenticate';
import { runPayRunCalculation } from '../calc/index';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createPayRunSchema = z.object({
  pay_schedule_id: z.string().uuid(),
  period_start:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  period_end:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  pay_date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  run_type:        z.enum(['regular', 'adjustment', 'reversal']).default('regular'),
  original_pay_run_id: z.string().uuid().optional(),
});

// ─── Row types ────────────────────────────────────────────────────────────────

interface PayRunRow {
  id: string;
  tenant_id: string;
  pay_schedule_id: string;
  jurisdiction: string;
  status: string;
  run_type: string;
  original_pay_run_id: string | null;
  period_start: string;
  period_end: string;
  pay_date: string;
  approved_by: string | null;
  approved_at: string | null;
  finalised_at: string | null;
  created_at: string;
}

interface PayRunItemRow {
  id: string;
  pay_run_id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  gross_wages: string;
  paye_tax: string;
  kiwisaver_ee: string;
  kiwisaver_er: string;
  acc_levy: string;
  super_ee: string;
  super_er: string;
  net_wages: string;
  hours_worked: string | null;
  leave_accrued: string | null;
  status: string;
}

interface PayRunLineItemRow {
  id: string;
  pay_run_item_id: string;
  code: string;
  amount: string;
  is_taxable: boolean;
  created_at: string;
}

interface IdempotencyRow {
  response: unknown;
  status_code: number;
}

async function checkIdempotency(key: string, method: string, path: string): Promise<IdempotencyRow | null> {
  const rows = await query<IdempotencyRow>(
    `SELECT response, status_code FROM idempotency_keys
     WHERE key = $1 AND method = $2 AND path = $3 AND expires_at > NOW()`,
    [key, method, path],
  );
  return rows[0] ?? null;
}

async function saveIdempotency(key: string, method: string, path: string, statusCode: number, response: unknown): Promise<void> {
  await query(
    `INSERT INTO idempotency_keys (key, method, path, status_code, response)
     VALUES ($1, $2, $3, $4, $5) ON CONFLICT (key) DO NOTHING`,
    [key, method, path, statusCode, JSON.stringify(response)],
  );
}

// ─── Tenant-scoped routes (registered at /api/v1/tenants) ────────────────────

export async function payRunTenantRoutes(fastify: FastifyInstance): Promise<void> {

  /**
   * POST /api/v1/tenants/:tenantId/pay-runs
   * Create a new draft pay run for a tenant.
   */
  fastify.post('/:tenantId/pay-runs', { preHandler: [authenticate] }, async (request, reply) => {
    const idempotencyKey = request.headers['x-idempotency-key'] as string | undefined;
    if (!idempotencyKey) {
      return reply.status(400).send({ error: { code: 'MISSING_IDEMPOTENCY_KEY', message: 'X-Idempotency-Key header is required' } });
    }

    const { tenantId } = request.params as { tenantId: string };
    const path = `/api/v1/tenants/${tenantId}/pay-runs`;

    const cached = await checkIdempotency(idempotencyKey, 'POST', path);
    if (cached) return reply.status(cached.status_code).send(cached.response);

    // Verify tenant exists and get its jurisdiction
    const tenantRows = await query<{ id: string; jurisdiction: string | null }>(
      `SELECT id, jurisdiction FROM tenants WHERE id = $1`, [tenantId],
    );
    if (tenantRows.length === 0) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Tenant not found' } });
    }
    const jurisdiction = tenantRows[0].jurisdiction;
    if (!jurisdiction) {
      return reply.status(400).send({ error: { code: 'NO_JURISDICTION', message: 'Tenant has no jurisdiction set' } });
    }

    const parsed = createPayRunSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message } });
    }

    const { pay_schedule_id, period_start, period_end, pay_date, run_type, original_pay_run_id } = parsed.data;

    // Verify pay schedule belongs to this tenant
    const scheduleRows = await query<{ id: string }>(
      `SELECT id FROM pay_schedules WHERE id = $1 AND tenant_id = $2`, [pay_schedule_id, tenantId],
    );
    if (scheduleRows.length === 0) {
      return reply.status(400).send({ error: { code: 'INVALID_PAY_SCHEDULE', message: 'Pay schedule not found or does not belong to this tenant' } });
    }

    const id = uuidv4();
    const rows = await query<PayRunRow>(
      `INSERT INTO pay_runs
         (id, tenant_id, pay_schedule_id, jurisdiction, status, run_type, original_pay_run_id,
          period_start, period_end, pay_date)
       VALUES ($1,$2,$3,$4,'draft',$5,$6,$7,$8,$9)
       RETURNING id, tenant_id, pay_schedule_id, jurisdiction, status, run_type,
                 original_pay_run_id, period_start, period_end, pay_date,
                 approved_by, approved_at, finalised_at, created_at`,
      [id, tenantId, pay_schedule_id, jurisdiction, run_type, original_pay_run_id ?? null,
       period_start, period_end, pay_date],
    );

    const responseBody = rows[0];
    await saveIdempotency(idempotencyKey, 'POST', path, 201, responseBody);
    return reply.status(201).send(responseBody);
  });

  /**
   * GET /api/v1/tenants/:tenantId/pay-runs
   * List pay runs for a tenant. Optional ?status= filter.
   */
  fastify.get('/:tenantId/pay-runs', { preHandler: [authenticate] }, async (request, reply) => {
    const { tenantId } = request.params as { tenantId: string };
    const { status } = request.query as { status?: string };

    const tenantRows = await query<{ id: string }>(`SELECT id FROM tenants WHERE id = $1`, [tenantId]);
    if (tenantRows.length === 0) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Tenant not found' } });
    }

    const params: unknown[] = [tenantId];
    let sql = `
      SELECT pr.id, pr.tenant_id, pr.pay_schedule_id, pr.jurisdiction, pr.status, pr.run_type,
             pr.original_pay_run_id, pr.period_start, pr.period_end, pr.pay_date,
             pr.approved_by, pr.approved_at, pr.finalised_at, pr.created_at,
             ps.name AS schedule_name,
             (SELECT COUNT(*)::int FROM pay_run_items pri WHERE pri.pay_run_id = pr.id) AS employee_count
      FROM pay_runs pr
      JOIN pay_schedules ps ON ps.id = pr.pay_schedule_id
      WHERE pr.tenant_id = $1`;

    if (status) {
      params.push(status);
      sql += ` AND pr.status = $${params.length}`;
    }
    sql += ` ORDER BY pr.period_start DESC`;

    const rows = await query<PayRunRow & { schedule_name: string; employee_count: number }>(sql, params);
    return reply.send(rows);
  });
}

// ─── Pay-run-level routes (registered at /api/v1/pay-runs) ───────────────────

export async function payRunRoutes(fastify: FastifyInstance): Promise<void> {

  /**
   * GET /api/v1/pay-runs/:id
   * Get a pay run with all employee items and line items.
   */
  fastify.get('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const payRunRows = await query<PayRunRow>(
      `SELECT id, tenant_id, pay_schedule_id, jurisdiction, status, run_type,
              original_pay_run_id, period_start, period_end, pay_date,
              approved_by, approved_at, finalised_at, created_at
       FROM pay_runs WHERE id = $1`,
      [id],
    );
    if (payRunRows.length === 0) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Pay run not found' } });
    }
    const payRun = payRunRows[0];

    const items = await query<PayRunItemRow>(
      `SELECT pri.id, pri.pay_run_id, pri.employee_id,
              e.first_name, e.last_name,
              pri.gross_wages, pri.paye_tax, pri.kiwisaver_ee, pri.kiwisaver_er,
              pri.acc_levy, pri.super_ee, pri.super_er, pri.net_wages,
              pri.hours_worked, pri.leave_accrued, pri.status
       FROM pay_run_items pri
       JOIN employees e ON e.id = pri.employee_id
       WHERE pri.pay_run_id = $1
       ORDER BY e.last_name, e.first_name`,
      [id],
    );

    // Load line items for all pay run items
    const itemIds = items.map(i => i.id);
    let lineItems: PayRunLineItemRow[] = [];
    if (itemIds.length > 0) {
      lineItems = await query<PayRunLineItemRow>(
        `SELECT id, pay_run_item_id, code, amount, is_taxable, created_at
         FROM pay_run_line_items
         WHERE pay_run_item_id = ANY($1::uuid[])
         ORDER BY pay_run_item_id, created_at`,
        [itemIds],
      );
    }

    // Group line items by pay_run_item_id
    const linesByItem: Record<string, PayRunLineItemRow[]> = {};
    for (const li of lineItems) {
      if (!linesByItem[li.pay_run_item_id]) linesByItem[li.pay_run_item_id] = [];
      linesByItem[li.pay_run_item_id].push(li);
    }

    const itemsWithLines = items.map(item => ({
      ...item,
      line_items: linesByItem[item.id] ?? [],
    }));

    // Totals across all employees
    const totals = items.reduce(
      (acc, item) => ({
        gross_wages:  acc.gross_wages  + Number(item.gross_wages),
        paye_tax:     acc.paye_tax     + Number(item.paye_tax),
        kiwisaver_ee: acc.kiwisaver_ee + Number(item.kiwisaver_ee),
        kiwisaver_er: acc.kiwisaver_er + Number(item.kiwisaver_er),
        acc_levy:     acc.acc_levy     + Number(item.acc_levy),
        super_er:     acc.super_er     + Number(item.super_er),
        net_wages:    acc.net_wages    + Number(item.net_wages),
      }),
      { gross_wages: 0, paye_tax: 0, kiwisaver_ee: 0, kiwisaver_er: 0, acc_levy: 0, super_er: 0, net_wages: 0 },
    );

    return reply.send({ ...payRun, items: itemsWithLines, totals });
  });

  /**
   * POST /api/v1/pay-runs/:id/calculate
   * Trigger calculation for a draft pay run.
   * Transitions: draft → calculating → review
   */
  fastify.post('/:id/calculate', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const payRunRows = await query<{ id: string; status: string }>(
      `SELECT id, status FROM pay_runs WHERE id = $1`, [id],
    );
    if (payRunRows.length === 0) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Pay run not found' } });
    }
    if (payRunRows[0].status !== 'draft' && payRunRows[0].status !== 'review') {
      return reply.status(409).send({
        error: { code: 'INVALID_STATE', message: `Pay run is ${payRunRows[0].status} — can only calculate from draft or review` },
      });
    }

    // Transition to calculating
    await query(`UPDATE pay_runs SET status = 'calculating' WHERE id = $1`, [id]);

    try {
      const employeeCount = await runPayRunCalculation(id);

      // Transition to review
      await query(`UPDATE pay_runs SET status = 'review' WHERE id = $1`, [id]);

      return reply.send({ status: 'review', employees_calculated: employeeCount });
    } catch (err) {
      // Revert to draft on failure so user can fix and retry
      await query(`UPDATE pay_runs SET status = 'draft' WHERE id = $1`, [id]);
      throw err;
    }
  });

  /**
   * POST /api/v1/pay-runs/:id/approve
   * Approve a pay run that has been reviewed.
   * Transitions: review → approved
   */
  fastify.post('/:id/approve', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = (request as unknown as { user: { sub: string } }).user;

    const payRunRows = await query<{ id: string; status: string }>(
      `SELECT id, status FROM pay_runs WHERE id = $1`, [id],
    );
    if (payRunRows.length === 0) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Pay run not found' } });
    }
    if (payRunRows[0].status !== 'review') {
      return reply.status(409).send({
        error: { code: 'INVALID_STATE', message: `Pay run is ${payRunRows[0].status} — can only approve from review` },
      });
    }

    const rows = await query<PayRunRow>(
      `UPDATE pay_runs
       SET status = 'approved', approved_by = $2, approved_at = NOW()
       WHERE id = $1
       RETURNING id, tenant_id, pay_schedule_id, jurisdiction, status, run_type,
                 original_pay_run_id, period_start, period_end, pay_date,
                 approved_by, approved_at, finalised_at, created_at`,
      [id, user.sub],
    );

    return reply.send(rows[0]);
  });

  /**
   * POST /api/v1/pay-runs/:id/finalise
   * Finalise an approved pay run — permanently locks it.
   * Transitions: approved → finalised
   * After finalisation, corrections must be made via a new adjustment pay run.
   */
  fastify.post('/:id/finalise', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const payRunRows = await query<{ id: string; status: string }>(
      `SELECT id, status FROM pay_runs WHERE id = $1`, [id],
    );
    if (payRunRows.length === 0) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Pay run not found' } });
    }
    if (payRunRows[0].status !== 'approved') {
      return reply.status(409).send({
        error: { code: 'INVALID_STATE', message: `Pay run is ${payRunRows[0].status} — can only finalise from approved` },
      });
    }

    const rows = await query<PayRunRow>(
      `UPDATE pay_runs
       SET status = 'finalised', finalised_at = NOW()
       WHERE id = $1
       RETURNING id, tenant_id, pay_schedule_id, jurisdiction, status, run_type,
                 original_pay_run_id, period_start, period_end, pay_date,
                 approved_by, approved_at, finalised_at, created_at`,
      [id],
    );

    return reply.send(rows[0]);
  });
}

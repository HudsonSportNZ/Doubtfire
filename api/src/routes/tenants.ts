import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/client';
import { authenticate } from '../middleware/authenticate';

const createPayScheduleSchema = z.object({
  name:         z.string().min(1).max(255),
  frequency:    z.enum(['weekly', 'fortnightly', 'monthly', 'one_off']),
  period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'period_start must be YYYY-MM-DD'),
  // period_end required only for one_off; auto-calculated for recurring
  period_end:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  pay_date:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'pay_date must be YYYY-MM-DD'),
}).refine(
  d => d.frequency !== 'one_off' || d.period_end !== undefined,
  { message: 'period_end is required for one_off schedules', path: ['period_end'] },
);

const updateTenantSchema = z.object({
  name:         z.string().min(1).max(255).optional(),
  status:       z.enum(['active', 'suspended', 'closed']).optional(),
  jurisdiction: z.enum(['NZ', 'AU']).optional(),
});

const createEmployeeSchema = z.object({
  first_name:      z.string().min(1).max(100),
  last_name:       z.string().min(1).max(100),
  // jurisdiction is derived from the employer (tenant) — not passed by the client
  start_date:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'start_date must be YYYY-MM-DD'),
  date_of_birth:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  // TODO Phase 6: encrypt tax_identifier and bank_account at app layer before storage
  tax_identifier:  z.string().max(20).optional(),
  bank_account:    z.string().max(50).optional(),
  leave_profile_id: z.string().uuid().optional(),
  pay_schedule_id:  z.string().uuid({ message: 'A pay schedule is required' }),
});

const addJurisdictionSchema = z.object({
  jurisdiction: z.enum(['NZ', 'AU']),
  legal_entity_name: z.string().min(1).max(255).optional(),
  // TODO Phase 6: encrypt tax_id at app layer before storage
  tax_id: z.string().max(50).optional(),
});

interface TenantRow {
  id: string;
  bureau_id: string;
  name: string;
  slug: string;
  status: string;
  jurisdiction: string | null;
  created_at: string;
}

// All columns selected/returned for employee rows
const EMPLOYEE_COLS = `
  id, tenant_id, jurisdiction, status, created_at,
  title, first_name, middle_name, last_name, date_of_birth, external_id,
  email, mobile_phone,
  residential_street_address, residential_address_line2,
  residential_city, residential_region, residential_post_code, residential_country,
  start_date, end_date, employment_type, job_title, automatically_pay,
  leave_profile_id, pay_schedule_id,
  bank_name, bank_account_number, bank_account_name, bank_account,
  tax_identifier, tax_code, kiwisaver_member, kiwisaver_employee_rate, kiwisaver_employer_rate
`;

interface EmployeeRow {
  id: string;
  tenant_id: string;
  jurisdiction: string;
  status: string;
  created_at: string;
  // General
  title: string | null;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  date_of_birth: string | null;
  external_id: string | null;
  email: string | null;
  mobile_phone: string | null;
  residential_street_address: string | null;
  residential_address_line2: string | null;
  residential_city: string | null;
  residential_region: string | null;
  residential_post_code: string | null;
  residential_country: string | null;
  // Employment
  start_date: string;
  end_date: string | null;
  employment_type: string | null;
  job_title: string | null;
  automatically_pay: boolean;
  leave_profile_id: string | null;
  pay_schedule_id: string | null;
  // Payments
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_name: string | null;
  bank_account: string | null;
  // Tax
  tax_identifier: string | null;
  tax_code: string | null;
  kiwisaver_member: boolean;
  kiwisaver_employee_rate: string | null;
  kiwisaver_employer_rate: string | null;
}

interface JurisdictionRow {
  tenant_id: string;
  jurisdiction: string;
  legal_entity_name: string | null;
  tax_id: string | null;
}

interface PayScheduleRow {
  id: string;
  tenant_id: string;
  jurisdiction: string;
  name: string;
  frequency: string;
  period_start: string;
  period_end: string;
  pay_date: string;
  is_active: boolean;
  created_at: string;
}

interface IdempotencyRow {
  response: unknown;
  status_code: number;
}

async function checkIdempotency(
  key: string,
  method: string,
  path: string,
): Promise<IdempotencyRow | null> {
  const rows = await query<IdempotencyRow>(
    `SELECT response, status_code FROM idempotency_keys
     WHERE key = $1 AND method = $2 AND path = $3 AND expires_at > NOW()`,
    [key, method, path],
  );
  return rows[0] ?? null;
}

async function saveIdempotency(
  key: string,
  method: string,
  path: string,
  statusCode: number,
  response: unknown,
): Promise<void> {
  await query(
    `INSERT INTO idempotency_keys (key, method, path, status_code, response)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (key) DO NOTHING`,
    [key, method, path, statusCode, JSON.stringify(response)],
  );
}

export async function tenantRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /api/v1/tenants/:id
   * Get tenant detail including its jurisdictions.
   */
  fastify.get('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const tenantRows = await query<TenantRow>(
      `SELECT id, bureau_id, name, slug, status, jurisdiction, created_at FROM tenants WHERE id = $1`,
      [id],
    );
    if (tenantRows.length === 0) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Tenant not found' } });
    }

    const jurisdictions = await query<JurisdictionRow>(
      `SELECT tenant_id, jurisdiction, legal_entity_name, tax_id
       FROM tenant_jurisdictions WHERE tenant_id = $1`,
      [id],
    );

    return reply.send({ ...tenantRows[0], jurisdictions });
  });

  /**
   * PATCH /api/v1/tenants/:id
   * Update tenant name or status.
   */
  fastify.patch('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const idempotencyKey = request.headers['x-idempotency-key'] as string | undefined;
    if (!idempotencyKey) {
      return reply.status(400).send({
        error: { code: 'MISSING_IDEMPOTENCY_KEY', message: 'X-Idempotency-Key header is required' },
      });
    }

    const { id } = request.params as { id: string };
    const path = `/api/v1/tenants/${id}`;

    const cached = await checkIdempotency(idempotencyKey, 'PATCH', path);
    if (cached) {
      return reply.status(cached.status_code).send(cached.response);
    }

    const tenantRows = await query<TenantRow>(
      `SELECT id FROM tenants WHERE id = $1`,
      [id],
    );
    if (tenantRows.length === 0) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Tenant not found' } });
    }

    const parsed = updateTenantSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message },
      });
    }

    const { name, status, jurisdiction } = parsed.data;

    if (!name && !status && !jurisdiction) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: 'At least one field is required' },
      });
    }

    // Build dynamic SET clause
    const updates: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (name         !== undefined) { updates.push(`name = $${paramIndex++}`);         params.push(name); }
    if (status       !== undefined) { updates.push(`status = $${paramIndex++}`);       params.push(status); }
    if (jurisdiction !== undefined) { updates.push(`jurisdiction = $${paramIndex++}`); params.push(jurisdiction); }
    params.push(id);

    const rows = await query<TenantRow>(
      `UPDATE tenants SET ${updates.join(', ')} WHERE id = $${paramIndex}
       RETURNING id, bureau_id, name, slug, status, jurisdiction, created_at`,
      params,
    );

    const responseBody = rows[0];
    await saveIdempotency(idempotencyKey, 'PATCH', path, 200, responseBody);

    return reply.send(responseBody);
  });

  /**
   * POST /api/v1/tenants/:id/jurisdictions
   * Add (or update) a jurisdiction for a tenant.
   */
  fastify.post('/:id/jurisdictions', { preHandler: [authenticate] }, async (request, reply) => {
    const idempotencyKey = request.headers['x-idempotency-key'] as string | undefined;
    if (!idempotencyKey) {
      return reply.status(400).send({
        error: { code: 'MISSING_IDEMPOTENCY_KEY', message: 'X-Idempotency-Key header is required' },
      });
    }

    const { id } = request.params as { id: string };
    const path = `/api/v1/tenants/${id}/jurisdictions`;

    const cached = await checkIdempotency(idempotencyKey, 'POST', path);
    if (cached) {
      return reply.status(cached.status_code).send(cached.response);
    }

    const tenantRows = await query<{ id: string }>(
      `SELECT id FROM tenants WHERE id = $1`,
      [id],
    );
    if (tenantRows.length === 0) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Tenant not found' } });
    }

    const parsed = addJurisdictionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message },
      });
    }

    const { jurisdiction, legal_entity_name, tax_id } = parsed.data;

    // Upsert — a tenant can have only one row per jurisdiction, but details may be updated
    const rows = await query<JurisdictionRow>(
      `INSERT INTO tenant_jurisdictions (tenant_id, jurisdiction, legal_entity_name, tax_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (tenant_id, jurisdiction) DO UPDATE
         SET legal_entity_name = EXCLUDED.legal_entity_name,
             tax_id = EXCLUDED.tax_id
       RETURNING tenant_id, jurisdiction, legal_entity_name, tax_id`,
      [id, jurisdiction, legal_entity_name ?? null, tax_id ?? null],
    );

    const responseBody = rows[0];
    await saveIdempotency(idempotencyKey, 'POST', path, 201, responseBody);

    return reply.status(201).send(responseBody);
  });

  /**
   * GET /api/v1/tenants/:id/employees
   * List employees for a tenant. Optional ?status= filter.
   */
  fastify.get('/:id/employees', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { status } = request.query as { status?: string };

    const tenantRows = await query<{ id: string }>(`SELECT id FROM tenants WHERE id = $1`, [id]);
    if (tenantRows.length === 0) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Tenant not found' } });
    }

    const params: unknown[] = [id];
    let sql = `SELECT ${EMPLOYEE_COLS} FROM employees WHERE tenant_id = $1 AND deleted_at IS NULL`;

    if (status) {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }
    sql += ` ORDER BY last_name, first_name`;

    const rows = await query<EmployeeRow>(sql, params);
    return reply.send(rows);
  });

  /**
   * POST /api/v1/tenants/:id/employees
   * Create a new employee under a tenant.
   */
  fastify.post('/:id/employees', { preHandler: [authenticate] }, async (request, reply) => {
    const idempotencyKey = request.headers['x-idempotency-key'] as string | undefined;
    if (!idempotencyKey) {
      return reply.status(400).send({
        error: { code: 'MISSING_IDEMPOTENCY_KEY', message: 'X-Idempotency-Key header is required' },
      });
    }

    const { id: tenantId } = request.params as { id: string };
    const path = `/api/v1/tenants/${tenantId}/employees`;

    const cached = await checkIdempotency(idempotencyKey, 'POST', path);
    if (cached) return reply.status(cached.status_code).send(cached.response);

    const empTenantRows = await query<{ id: string; jurisdiction: string | null }>(
      `SELECT id, jurisdiction FROM tenants WHERE id = $1`, [tenantId],
    );
    if (empTenantRows.length === 0) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Tenant not found' } });
    }
    const empJurisdiction = empTenantRows[0].jurisdiction;
    if (!empJurisdiction) {
      return reply.status(400).send({
        error: { code: 'NO_JURISDICTION', message: 'This employer has no jurisdiction set. Edit the employer and set NZ or AU first.' },
      });
    }

    const parsed = createEmployeeSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message },
      });
    }

    const { first_name, last_name, start_date, date_of_birth,
            tax_identifier, bank_account, leave_profile_id, pay_schedule_id } = parsed.data;

    const id = uuidv4();
    const rows = await query<EmployeeRow>(
      `INSERT INTO employees
         (id, tenant_id, first_name, last_name, jurisdiction, start_date,
          date_of_birth, tax_identifier, bank_account, leave_profile_id, pay_schedule_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING ${EMPLOYEE_COLS}`,
      [id, tenantId, first_name, last_name, empJurisdiction, start_date,
       date_of_birth ?? null, tax_identifier ?? null, bank_account ?? null,
       leave_profile_id ?? null, pay_schedule_id ?? null],
    );

    const responseBody = rows[0];
    await saveIdempotency(idempotencyKey, 'POST', path, 201, responseBody);
    return reply.status(201).send(responseBody);
  });

  /**
   * GET /api/v1/tenants/:id/pay-schedules
   * List pay schedules for a tenant.
   */
  fastify.get('/:id/pay-schedules', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const tenantRows = await query<{ id: string }>(`SELECT id FROM tenants WHERE id = $1`, [id]);
    if (tenantRows.length === 0) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Tenant not found' } });
    }

    const rows = await query<PayScheduleRow>(
      `SELECT id, tenant_id, jurisdiction, name, frequency, period_start, period_end, pay_date, is_active, created_at
       FROM pay_schedules
       WHERE tenant_id = $1
       ORDER BY created_at DESC`,
      [id],
    );
    return reply.send(rows);
  });

  /**
   * POST /api/v1/tenants/:id/pay-schedules
   * Create a pay schedule for a tenant.
   */
  fastify.post('/:id/pay-schedules', { preHandler: [authenticate] }, async (request, reply) => {
    const idempotencyKey = request.headers['x-idempotency-key'] as string | undefined;
    if (!idempotencyKey) {
      return reply.status(400).send({
        error: { code: 'MISSING_IDEMPOTENCY_KEY', message: 'X-Idempotency-Key header is required' },
      });
    }

    const { id: tenantId } = request.params as { id: string };
    const path = `/api/v1/tenants/${tenantId}/pay-schedules`;

    const cached = await checkIdempotency(idempotencyKey, 'POST', path);
    if (cached) return reply.status(cached.status_code).send(cached.response);

    const tenantRows = await query<{ id: string; jurisdiction: string | null }>(
      `SELECT id, jurisdiction FROM tenants WHERE id = $1`, [tenantId],
    );
    if (tenantRows.length === 0) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Tenant not found' } });
    }
    const tenantJurisdiction = tenantRows[0].jurisdiction;
    if (!tenantJurisdiction) {
      return reply.status(400).send({
        error: { code: 'NO_JURISDICTION', message: 'This employer has no jurisdiction set. Edit the employer and set NZ or AU first.' },
      });
    }

    const parsed = createPayScheduleSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message },
      });
    }

    const { name, frequency, period_start, period_end, pay_date } = parsed.data;
    const jurisdiction = tenantJurisdiction;

    // Auto-calculate period_end for recurring schedules using a date helper
    function calcPeriodEnd(start: string, freq: string): string {
      const d = new Date(start);
      switch (freq) {
        case 'weekly':      d.setDate(d.getDate() + 6);  break;
        case 'fortnightly': d.setDate(d.getDate() + 13); break;
        case 'monthly':
          d.setMonth(d.getMonth() + 1);
          d.setDate(d.getDate() - 1);
          break;
      }
      return d.toISOString().slice(0, 10);
    }

    const resolvedPeriodEnd = period_end ?? calcPeriodEnd(period_start, frequency);

    const id = uuidv4();
    const rows = await query<PayScheduleRow>(
      `INSERT INTO pay_schedules (id, tenant_id, jurisdiction, name, frequency, period_start, period_end, pay_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, tenant_id, jurisdiction, name, frequency, period_start, period_end, pay_date, is_active, created_at`,
      [id, tenantId, jurisdiction, name, frequency, period_start, resolvedPeriodEnd, pay_date],
    );

    const responseBody = rows[0];
    await saveIdempotency(idempotencyKey, 'POST', path, 201, responseBody);
    return reply.status(201).send(responseBody);
  });
}

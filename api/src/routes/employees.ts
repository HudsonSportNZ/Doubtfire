import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/client';
import { authenticate } from '../middleware/authenticate';

const updateEmployeeSchema = z.object({
  first_name:      z.string().min(1).max(100).optional(),
  last_name:       z.string().min(1).max(100).optional(),
  status:          z.enum(['active', 'terminated', 'on_leave']).optional(),
  end_date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  date_of_birth:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  // TODO Phase 6: encrypt tax_identifier and bank_account at app layer before storage
  tax_identifier:  z.string().max(20).nullable().optional(),
  bank_account:    z.string().max(50).nullable().optional(),
  leave_profile_id: z.string().uuid().nullable().optional(),
  pay_schedule_id:  z.string().uuid().nullable().optional(),
});

const createPaySettingsSchema = z.object({
  pay_type:            z.enum(['hourly', 'salary', 'casual']),
  pay_rate:            z.string().regex(/^\d+(\.\d{1,4})?$/, 'pay_rate must be a valid decimal'),
  pay_frequency:       z.enum(['weekly', 'fortnightly', 'monthly']),
  tax_code:            z.string().min(1).max(20),
  effective_from:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'effective_from must be YYYY-MM-DD'),
  hours_per_week:      z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  kiwisaver_rate:      z.string().regex(/^0(\.\d{1,4})?$/).optional(),  // NZ only; e.g. "0.0300"
  kiwisaver_opted_out: z.boolean().optional(),
});

interface EmployeeRow {
  id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  jurisdiction: string;
  start_date: string;
  end_date: string | null;
  date_of_birth: string | null;
  tax_identifier: string | null;
  bank_account: string | null;
  status: string;
  leave_profile_id: string | null;
  pay_schedule_id: string | null;
  created_at: string;
}

interface PaySettingsRow {
  id: string;
  employee_id: string;
  pay_type: string;
  pay_rate: string;
  pay_frequency: string;
  hours_per_week: string | null;
  tax_code: string;
  kiwisaver_rate: string | null;
  kiwisaver_opted_out: boolean;
  effective_from: string;
  effective_to: string | null;
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

export async function employeeRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /api/v1/employees/:id
   * Get a single employee with their current pay settings.
   */
  fastify.get('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const rows = await query<EmployeeRow>(
      `SELECT id, tenant_id, first_name, last_name, jurisdiction, start_date, end_date,
              date_of_birth, tax_identifier, bank_account, status,
              leave_profile_id, pay_schedule_id, created_at
       FROM employees WHERE id = $1 AND deleted_at IS NULL`,
      [id],
    );
    if (rows.length === 0) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Employee not found' } });
    }

    const paySettings = await query<PaySettingsRow>(
      `SELECT id, employee_id, pay_type, pay_rate, pay_frequency, hours_per_week,
              tax_code, kiwisaver_rate, kiwisaver_opted_out, effective_from, effective_to
       FROM pay_settings WHERE employee_id = $1 ORDER BY effective_from DESC`,
      [id],
    );

    return reply.send({ ...rows[0], pay_settings: paySettings });
  });

  /**
   * PATCH /api/v1/employees/:id
   * Update employee details. Soft-delete via status=terminated + end_date.
   */
  fastify.patch('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const idempotencyKey = request.headers['x-idempotency-key'] as string | undefined;
    if (!idempotencyKey) {
      return reply.status(400).send({
        error: { code: 'MISSING_IDEMPOTENCY_KEY', message: 'X-Idempotency-Key header is required' },
      });
    }

    const { id } = request.params as { id: string };
    const path = `/api/v1/employees/${id}`;

    const cached = await checkIdempotency(idempotencyKey, 'PATCH', path);
    if (cached) return reply.status(cached.status_code).send(cached.response);

    const employeeRows = await query<{ id: string }>(
      `SELECT id FROM employees WHERE id = $1 AND deleted_at IS NULL`, [id],
    );
    if (employeeRows.length === 0) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Employee not found' } });
    }

    const parsed = updateEmployeeSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message },
      });
    }

    const data = parsed.data;
    const fields = ['first_name','last_name','status','end_date','date_of_birth',
                    'tax_identifier','bank_account','leave_profile_id','pay_schedule_id'] as const;

    if (fields.every(f => data[f] === undefined)) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: 'At least one field is required' },
      });
    }

    const updates: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    for (const f of fields) {
      if (data[f] !== undefined) {
        updates.push(`${f} = $${paramIndex++}`);
        params.push(data[f] ?? null);
      }
    }
    params.push(id);

    const rows = await query<EmployeeRow>(
      `UPDATE employees SET ${updates.join(', ')} WHERE id = $${paramIndex}
       RETURNING id, tenant_id, first_name, last_name, jurisdiction, start_date, end_date,
                 date_of_birth, tax_identifier, bank_account, status,
                 leave_profile_id, pay_schedule_id, created_at`,
      params,
    );

    const responseBody = rows[0];
    await saveIdempotency(idempotencyKey, 'PATCH', path, 200, responseBody);
    return reply.send(responseBody);
  });

  /**
   * GET /api/v1/employees/:id/pay-settings
   * List all pay settings history (newest first).
   */
  fastify.get('/:id/pay-settings', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const employeeRows = await query<{ id: string }>(
      `SELECT id FROM employees WHERE id = $1 AND deleted_at IS NULL`, [id],
    );
    if (employeeRows.length === 0) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Employee not found' } });
    }

    const rows = await query<PaySettingsRow>(
      `SELECT id, employee_id, pay_type, pay_rate, pay_frequency, hours_per_week,
              tax_code, kiwisaver_rate, kiwisaver_opted_out, effective_from, effective_to
       FROM pay_settings WHERE employee_id = $1 ORDER BY effective_from DESC`,
      [id],
    );

    return reply.send(rows);
  });

  /**
   * POST /api/v1/employees/:id/pay-settings
   * Add a new effective-dated pay settings record.
   * Each employee can have only one record per effective_from date.
   */
  fastify.post('/:id/pay-settings', { preHandler: [authenticate] }, async (request, reply) => {
    const idempotencyKey = request.headers['x-idempotency-key'] as string | undefined;
    if (!idempotencyKey) {
      return reply.status(400).send({
        error: { code: 'MISSING_IDEMPOTENCY_KEY', message: 'X-Idempotency-Key header is required' },
      });
    }

    const { id: employeeId } = request.params as { id: string };
    const path = `/api/v1/employees/${employeeId}/pay-settings`;

    const cached = await checkIdempotency(idempotencyKey, 'POST', path);
    if (cached) return reply.status(cached.status_code).send(cached.response);

    const employeeRows = await query<{ id: string }>(
      `SELECT id FROM employees WHERE id = $1 AND deleted_at IS NULL`, [employeeId],
    );
    if (employeeRows.length === 0) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Employee not found' } });
    }

    const parsed = createPaySettingsSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message },
      });
    }

    const { pay_type, pay_rate, pay_frequency, tax_code, effective_from,
            hours_per_week, kiwisaver_rate, kiwisaver_opted_out } = parsed.data;

    const id = uuidv4();

    try {
      const rows = await query<PaySettingsRow>(
        `INSERT INTO pay_settings
           (id, employee_id, pay_type, pay_rate, pay_frequency, tax_code, effective_from,
            hours_per_week, kiwisaver_rate, kiwisaver_opted_out)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         RETURNING id, employee_id, pay_type, pay_rate, pay_frequency, hours_per_week,
                   tax_code, kiwisaver_rate, kiwisaver_opted_out, effective_from, effective_to`,
        [id, employeeId, pay_type, pay_rate, pay_frequency, tax_code, effective_from,
         hours_per_week ?? null, kiwisaver_rate ?? null, kiwisaver_opted_out ?? false],
      );

      const responseBody = rows[0];
      await saveIdempotency(idempotencyKey, 'POST', path, 201, responseBody);
      return reply.status(201).send(responseBody);
    } catch (err: unknown) {
      const pgErr = err as { code?: string };
      if (pgErr.code === '23505') {
        return reply.status(409).send({
          error: { code: 'DUPLICATE_EFFECTIVE_DATE', message: 'A pay settings record already exists for this effective date' },
        });
      }
      throw err;
    }
  });
}

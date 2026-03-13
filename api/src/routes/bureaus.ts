import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/client';
import { authenticate } from '../middleware/authenticate';

const createBureauSchema = z.object({
  name: z.string().min(1).max(255),
  country:     z.enum(['NZ', 'AU', 'BOTH']).optional(),
  admin_email: z.string().email().optional(),
  phone:       z.string().max(50).optional(),
  website:     z.string().max(255).optional(),
  metadata:    z.record(z.unknown()).optional(),
});

const updateBureauSchema = z.object({
  name:        z.string().min(1).max(255).optional(),
  is_active:   z.boolean().optional(),
  country:     z.enum(['NZ', 'AU', 'BOTH']).optional(),
  admin_email: z.string().email().optional(),
  phone:       z.string().max(50).optional(),
  website:     z.string().max(255).optional(),
  metadata:    z.record(z.unknown()).optional(),
});

const createTenantSchema = z.object({
  name:         z.string().min(1).max(255),
  slug:         z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  jurisdiction: z.enum(['NZ', 'AU'], { message: 'Jurisdiction must be NZ or AU' }),
});

interface BureauRow {
  id: string;
  name: string;
  is_active: boolean;
  country: string | null;
  admin_email: string | null;
  phone: string | null;
  website: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface TenantRow {
  id: string;
  bureau_id: string;
  name: string;
  slug: string;
  status: string;
  jurisdiction: string | null;
  created_at: string;
}

interface IdempotencyRow {
  response: unknown;
  status_code: number;
}

/**
 * Check idempotency cache. Returns cached { response, status_code } or null.
 */
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

/**
 * Save response to idempotency cache.
 */
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

export async function bureauRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * POST /api/v1/bureaus
   * Create a new bureau. Platform admin only.
   */
  fastify.post('/', { preHandler: [authenticate] }, async (request, reply) => {
    const idempotencyKey = request.headers['x-idempotency-key'] as string | undefined;
    if (!idempotencyKey) {
      return reply.status(400).send({
        error: { code: 'MISSING_IDEMPOTENCY_KEY', message: 'X-Idempotency-Key header is required' },
      });
    }

    const cached = await checkIdempotency(idempotencyKey, 'POST', '/api/v1/bureaus');
    if (cached) {
      return reply.status(cached.status_code).send(cached.response);
    }

    const parsed = createBureauSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message },
      });
    }

    const { name, country, admin_email, phone, website, metadata } = parsed.data;
    const id = uuidv4();

    const rows = await query<BureauRow>(
      `INSERT INTO bureaus (id, name, country, admin_email, phone, website, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, is_active, country, admin_email, phone, website, metadata, created_at`,
      [id, name, country ?? null, admin_email ?? null, phone ?? null, website ?? null, JSON.stringify(metadata ?? {})],
    );

    const responseBody = rows[0];
    await saveIdempotency(idempotencyKey, 'POST', '/api/v1/bureaus', 201, responseBody);

    return reply.status(201).send(responseBody);
  });

  /**
   * GET /api/v1/bureaus
   * List all bureaus.
   */
  fastify.get('/', { preHandler: [authenticate] }, async (_request, reply) => {
    const rows = await query<BureauRow>(
      `SELECT id, name, is_active, country, admin_email, phone, website, metadata, created_at FROM bureaus ORDER BY created_at DESC`,
    );
    return reply.send(rows);
  });

  /**
   * POST /api/v1/bureaus/:id/tenants
   * Create a tenant under a bureau.
   */
  fastify.post('/:id/tenants', { preHandler: [authenticate] }, async (request, reply) => {
    const idempotencyKey = request.headers['x-idempotency-key'] as string | undefined;
    if (!idempotencyKey) {
      return reply.status(400).send({
        error: { code: 'MISSING_IDEMPOTENCY_KEY', message: 'X-Idempotency-Key header is required' },
      });
    }

    const { id: bureauId } = request.params as { id: string };
    const path = `/api/v1/bureaus/${bureauId}/tenants`;

    const cached = await checkIdempotency(idempotencyKey, 'POST', path);
    if (cached) {
      return reply.status(cached.status_code).send(cached.response);
    }

    const bureauRows = await query<{ id: string }>(
      `SELECT id FROM bureaus WHERE id = $1 AND is_active = TRUE`,
      [bureauId],
    );
    if (bureauRows.length === 0) {
      return reply.status(404).send({
        error: { code: 'NOT_FOUND', message: 'Bureau not found' },
      });
    }

    const parsed = createTenantSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message },
      });
    }

    const { name, slug, jurisdiction } = parsed.data;

    const slugCheck = await query<{ id: string }>(
      `SELECT id FROM tenants WHERE slug = $1`,
      [slug],
    );
    if (slugCheck.length > 0) {
      return reply.status(409).send({
        error: { code: 'SLUG_CONFLICT', message: 'A tenant with this slug already exists' },
      });
    }

    const id = uuidv4();

    const rows = await query<TenantRow>(
      `INSERT INTO tenants (id, bureau_id, name, slug, jurisdiction) VALUES ($1, $2, $3, $4, $5)
       RETURNING id, bureau_id, name, slug, status, jurisdiction, created_at`,
      [id, bureauId, name, slug, jurisdiction],
    );

    const responseBody = rows[0];
    await saveIdempotency(idempotencyKey, 'POST', path, 201, responseBody);

    return reply.status(201).send(responseBody);
  });

  /**
   * GET /api/v1/bureaus/:id/tenants
   * List all tenants under a bureau.
   */
  fastify.get('/:id/tenants', { preHandler: [authenticate] }, async (request, reply) => {
    const { id: bureauId } = request.params as { id: string };

    const bureauRows = await query<{ id: string }>(
      `SELECT id FROM bureaus WHERE id = $1`,
      [bureauId],
    );
    if (bureauRows.length === 0) {
      return reply.status(404).send({
        error: { code: 'NOT_FOUND', message: 'Bureau not found' },
      });
    }

    const rows = await query<TenantRow>(
      `SELECT id, bureau_id, name, slug, status, jurisdiction, created_at
       FROM tenants WHERE bureau_id = $1 ORDER BY created_at DESC`,
      [bureauId],
    );

    return reply.send(rows);
  });

  /**
   * PATCH /api/v1/bureaus/:id
   * Update bureau name or active status.
   */
  fastify.patch('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const idempotencyKey = request.headers['x-idempotency-key'] as string | undefined;
    if (!idempotencyKey) {
      return reply.status(400).send({
        error: { code: 'MISSING_IDEMPOTENCY_KEY', message: 'X-Idempotency-Key header is required' },
      });
    }

    const { id } = request.params as { id: string };
    const path = `/api/v1/bureaus/${id}`;

    const cached = await checkIdempotency(idempotencyKey, 'PATCH', path);
    if (cached) {
      return reply.status(cached.status_code).send(cached.response);
    }

    const bureauRows = await query<BureauRow>(
      `SELECT id FROM bureaus WHERE id = $1`,
      [id],
    );
    if (bureauRows.length === 0) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Bureau not found' } });
    }

    const parsed = updateBureauSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message },
      });
    }

    const { name, is_active, country, admin_email, phone, website, metadata } = parsed.data;

    if ([name, is_active, country, admin_email, phone, website, metadata].every(v => v === undefined)) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: 'At least one field is required' },
      });
    }

    const updates: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (name        !== undefined) { updates.push(`name = $${paramIndex++}`);        params.push(name); }
    if (is_active   !== undefined) { updates.push(`is_active = $${paramIndex++}`);   params.push(is_active); }
    if (country     !== undefined) { updates.push(`country = $${paramIndex++}`);     params.push(country); }
    if (admin_email !== undefined) { updates.push(`admin_email = $${paramIndex++}`); params.push(admin_email); }
    if (phone       !== undefined) { updates.push(`phone = $${paramIndex++}`);       params.push(phone); }
    if (website     !== undefined) { updates.push(`website = $${paramIndex++}`);     params.push(website); }
    if (metadata    !== undefined) { updates.push(`metadata = $${paramIndex++}`);    params.push(JSON.stringify(metadata)); }
    params.push(id);

    const rows = await query<BureauRow>(
      `UPDATE bureaus SET ${updates.join(', ')} WHERE id = $${paramIndex}
       RETURNING id, name, is_active, country, admin_email, phone, website, metadata, created_at`,
      params,
    );

    const responseBody = rows[0];
    await saveIdempotency(idempotencyKey, 'PATCH', path, 200, responseBody);

    return reply.send(responseBody);
  });
}

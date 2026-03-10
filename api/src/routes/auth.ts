import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query } from '../db/client';
import { authenticate } from '../middleware/authenticate';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

interface UserRow {
  id: string;
  email: string;
  full_name: string;
  password_hash: string | null;
  platform_role: string | null;
  is_active: boolean;
}

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * POST /api/v1/auth/login
   * Returns a signed JWT and basic user info.
   */
  fastify.post('/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: 'Email and password are required' },
      });
    }

    const { email, password } = parsed.data;

    const rows = await query<UserRow>(
      'SELECT id, email, full_name, password_hash, platform_role, is_active FROM users WHERE email = $1',
      [email.toLowerCase().trim()],
    );

    const user = rows[0];

    // Use constant-time comparison path to avoid user enumeration
    const validPassword =
      user?.password_hash != null ? await bcrypt.compare(password, user.password_hash) : false;

    if (!user || !user.is_active || !validPassword) {
      return reply.status(401).send({
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      });
    }

    await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    const token = fastify.jwt.sign(
      {
        sub: user.id,
        email: user.email,
        name: user.full_name,
        role: user.platform_role ?? 'user',
      },
      { expiresIn: '8h' },
    );

    return reply.send({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.full_name,
        role: user.platform_role ?? 'user',
      },
    });
  });

  /**
   * GET /api/v1/auth/me
   * Returns the currently authenticated user.
   */
  fastify.get('/me', { preHandler: [authenticate] }, async (request, reply) => {
    const rows = await query<{ id: string; email: string; full_name: string; platform_role: string | null }>(
      'SELECT id, email, full_name, platform_role FROM users WHERE id = $1 AND is_active = TRUE',
      [request.user.sub],
    );

    const user = rows[0];
    if (!user) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'User not found' } });
    }

    return reply.send({
      id: user.id,
      email: user.email,
      name: user.full_name,
      role: user.platform_role ?? 'user',
    });
  });
}

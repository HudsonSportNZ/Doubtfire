import { FastifyInstance } from 'fastify';
import { pool } from '../db/client';

export async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/health', async (_request, reply) => {
    try {
      await pool.query('SELECT 1');
      return reply.send({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
    } catch (_err) {
      return reply.status(503).send({ status: 'error', db: 'disconnected' });
    }
  });
}

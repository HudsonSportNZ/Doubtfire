import { FastifyInstance } from 'fastify';
import { healthRoutes } from './health';
import { authRoutes } from './auth';

/**
 * Register all route modules here.
 */
export async function registerRoutes(fastify: FastifyInstance): Promise<void> {
  await fastify.register(healthRoutes);
  await fastify.register(authRoutes, { prefix: '/api/v1/auth' });

  // Phase 3+ routes:
  // await fastify.register(bureauRoutes, { prefix: '/api/v1/bureaus' });
  // await fastify.register(tenantRoutes, { prefix: '/api/v1/tenants' });
  // await fastify.register(employeeRoutes, { prefix: '/api/v1/employees' });
  // await fastify.register(payRunRoutes, { prefix: '/api/v1/pay-runs' });
}

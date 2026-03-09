import { FastifyInstance } from 'fastify';
import { healthRoutes } from './health';

/**
 * Register all route modules here.
 * Routes added in later phases (bureaus, tenants, employees, pay-runs, etc.)
 * are imported and registered here.
 */
export async function registerRoutes(fastify: FastifyInstance): Promise<void> {
  await fastify.register(healthRoutes);

  // Phase 2 routes — registered as we build them:
  // await fastify.register(bureauRoutes, { prefix: '/api/v1/bureaus' });
  // await fastify.register(tenantRoutes, { prefix: '/api/v1/tenants' });
  // await fastify.register(employeeRoutes, { prefix: '/api/v1/employees' });
  // await fastify.register(payRunRoutes, { prefix: '/api/v1/pay-runs' });
}

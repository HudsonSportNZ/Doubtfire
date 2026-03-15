import { FastifyInstance } from 'fastify';
import { healthRoutes } from './health';
import { authRoutes } from './auth';
import { bureauRoutes } from './bureaus';
import { tenantRoutes } from './tenants';
import { employeeRoutes } from './employees';
import { reportRoutes } from './reports';
import { adminRoutes } from './admin';
import { payRunTenantRoutes, payRunRoutes } from './pay-runs';

/**
 * Register all route modules here.
 */
export async function registerRoutes(fastify: FastifyInstance): Promise<void> {
  await fastify.register(healthRoutes);
  await fastify.register(authRoutes, { prefix: '/api/v1/auth' });

  // Phase 4a — Bureaus & Tenants
  await fastify.register(bureauRoutes, { prefix: '/api/v1/bureaus' });
  await fastify.register(tenantRoutes, { prefix: '/api/v1/tenants' });

  // Phase 4b — Employees
  await fastify.register(employeeRoutes, { prefix: '/api/v1/employees' });

  // Admin routes (platform_admin only)
  await fastify.register(reportRoutes, { prefix: '/api/v1/admin/reports' });
  await fastify.register(adminRoutes,  { prefix: '/api/v1/admin' });

  // Phase 5 — Pay Run Engine
  await fastify.register(payRunTenantRoutes, { prefix: '/api/v1/tenants' });
  await fastify.register(payRunRoutes, { prefix: '/api/v1/pay-runs' });
}

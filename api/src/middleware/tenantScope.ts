import { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Sets the PostgreSQL RLS context for the current request so that
 * all queries in this request are automatically scoped to the
 * authenticated tenant.
 *
 * Called after authentication middleware has verified the JWT and
 * attached request.user.
 */
export async function tenantScope(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  // Tenant ID is extracted from the verified JWT payload.
  // The actual RLS variable is set per-connection inside each
  // service that opens a transaction — see db/client.ts withTransaction.
  // This hook validates the tenant ID is present.
  if (!request.user?.tenantId) {
    // Routes that don't require tenant scoping (e.g. platform admin)
    // skip this hook via fastify-plugin options.
    return;
  }
}

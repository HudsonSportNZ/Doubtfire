import { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Verifies the JWT from the Authorization header and attaches
 * the decoded payload to request.user.
 *
 * Uses @fastify/jwt registered on the Fastify instance.
 */
export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    await request.jwtVerify();
  } catch (err) {
    void reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Invalid or missing token' } });
  }
}

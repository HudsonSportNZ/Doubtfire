import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

export function errorHandler(
  error: FastifyError,
  _request: FastifyRequest,
  reply: FastifyReply,
): void {
  const statusCode = error.statusCode ?? 500;

  if (statusCode >= 500) {
    reply.log.error(error);
  } else {
    reply.log.warn(error);
  }

  void reply.status(statusCode).send({
    error: {
      code: error.code ?? 'INTERNAL_ERROR',
      message: statusCode >= 500 ? 'An unexpected error occurred' : error.message,
    },
  });
}

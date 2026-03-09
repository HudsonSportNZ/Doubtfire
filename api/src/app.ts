import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { registerRoutes } from './routes';

// Augment Fastify's request type to include the decoded JWT user payload.
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      sub: string;
      tenantId?: string;
      bureauId?: string;
      role: string;
    };
    user: {
      sub: string;
      tenantId?: string;
      bureauId?: string;
      role: string;
    };
  }
}

export async function buildApp(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: {
      level: config.logLevel,
      ...(config.env === 'development' && {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'HH:MM:ss.l' },
        },
      }),
    },
  });

  // ── Security plugins ────────────────────────────────────────────────────────
  await fastify.register(helmet);
  await fastify.register(cors, {
    origin: config.env === 'production' ? false : true,
  });
  await fastify.register(rateLimit, {
    max: 200,
    timeWindow: '1 minute',
  });

  // ── Auth ────────────────────────────────────────────────────────────────────
  await fastify.register(jwt, {
    secret: config.auth.jwtSecret,
  });

  // ── Routes ──────────────────────────────────────────────────────────────────
  await registerRoutes(fastify);

  // ── Error handler ───────────────────────────────────────────────────────────
  fastify.setErrorHandler(errorHandler);

  return fastify;
}

import 'dotenv/config';

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const config = {
  env: optional('NODE_ENV', 'development'),
  port: parseInt(optional('PORT', '3000'), 10),
  logLevel: optional('LOG_LEVEL', 'info'),

  db: {
    host: optional('DB_HOST', 'localhost'),
    port: parseInt(optional('DB_PORT', '5432'), 10),
    name: optional('DB_NAME', 'doubtfire_dev'),
    user: optional('DB_USER', 'postgres'),
    password: optional('DB_PASSWORD', 'postgres'),
  },

  redis: {
    url: optional('REDIS_URL', 'redis://localhost:6379'),
  },

  auth: {
    jwtSecret: required('JWT_SECRET'),
    allowedOrigins: optional(
      'ALLOWED_ORIGINS',
      'http://localhost:5173',
    ).split(','),
  },

  platform: {
    id: optional('PLATFORM_ID', '00000000-0000-0000-0000-000000000001'),
  },
} as const;

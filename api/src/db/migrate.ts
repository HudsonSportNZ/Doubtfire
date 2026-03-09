/**
 * Simple file-based migration runner.
 *
 * Migrations live in src/migrations/ as numbered SQL files:
 *   0001_create_bureaus.sql
 *   0002_create_tenants.sql
 *   etc.
 *
 * Run:  npm run migrate
 * Create new migration:  npm run migrate:create <name>
 */

import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import 'dotenv/config';

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

const pool = new Pool({
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  database: process.env.DB_NAME ?? 'doubtfire_dev',
  user: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
});

async function ensureMigrationsTable(client: import('pg').PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id          SERIAL PRIMARY KEY,
      filename    TEXT NOT NULL UNIQUE,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrations(client: import('pg').PoolClient): Promise<Set<string>> {
  const result = await client.query<{ filename: string }>(
    'SELECT filename FROM schema_migrations ORDER BY filename',
  );
  return new Set(result.rows.map((r) => r.filename));
}

async function runMigrations(): Promise<void> {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
    console.log('Created migrations directory');
  }

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const client = await pool.connect();

  try {
    await ensureMigrationsTable(client);
    const applied = await getAppliedMigrations(client);

    const pending = files.filter((f) => !applied.has(f));

    if (pending.length === 0) {
      console.log('No pending migrations.');
      return;
    }

    console.log(`Applying ${pending.length} migration(s)...`);

    for (const filename of pending) {
      const filepath = path.join(MIGRATIONS_DIR, filename);
      const sql = fs.readFileSync(filepath, 'utf8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (filename) VALUES ($1)',
          [filename],
        );
        await client.query('COMMIT');
        console.log(`  ✓ ${filename}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`  ✗ ${filename} — FAILED`);
        throw err;
      }
    }

    console.log('Migrations complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

async function createMigration(name: string): Promise<void> {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
  }

  const existing = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'));

  const next = String(existing.length + 1).padStart(4, '0');
  const slug = name.replace(/\s+/g, '_').toLowerCase();
  const filename = `${next}_${slug}.sql`;
  const filepath = path.join(MIGRATIONS_DIR, filename);

  fs.writeFileSync(filepath, `-- Migration: ${name}\n-- Created: ${new Date().toISOString()}\n\n`);
  console.log(`Created: src/migrations/${filename}`);
}

// ── Entry point ──────────────────────────────────────────────────────────────

const [, , command, ...args] = process.argv;

if (command === 'create') {
  const name = args.join(' ');
  if (!name) {
    console.error('Usage: npm run migrate:create <migration name>');
    process.exit(1);
  }
  void createMigration(name);
} else {
  runMigrations().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}

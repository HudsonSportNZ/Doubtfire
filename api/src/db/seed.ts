/**
 * Seeds the first platform admin user.
 *
 * Run:  npm run seed
 *
 * Configure via environment variables or use the defaults below.
 * Change the password immediately after first login.
 */
import bcrypt from 'bcryptjs';
import { query, pool } from './client';
import 'dotenv/config';

async function seed(): Promise<void> {
  const email = (process.env.ADMIN_EMAIL ?? 'admin@paythenanny.com').toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD ?? 'ChangeMe123!';
  const name = process.env.ADMIN_NAME ?? 'Platform Admin';

  const existing = await query<{ id: string }>('SELECT id FROM users WHERE email = $1', [email]);

  if (existing.length > 0) {
    console.log(`✓ Admin user already exists: ${email}`);
    await pool.end();
    return;
  }

  const hash = await bcrypt.hash(password, 12);

  await query(
    `INSERT INTO users (email, password_hash, full_name, platform_role)
     VALUES ($1, $2, $3, 'platform_admin')`,
    [email, hash, name],
  );

  console.log('');
  console.log('✓ Platform admin created');
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
  console.log('');
  console.log('  Change this password after first login!');
  console.log('');

  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

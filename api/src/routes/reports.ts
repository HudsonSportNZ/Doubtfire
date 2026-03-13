import { FastifyInstance } from 'fastify';
import { query } from '../db/client';
import { authenticate } from '../middleware/authenticate';

// Whitelist of tables that can be exported. Sensitive columns are excluded per table.
const TABLES: Record<string, { label: string; exclude?: string[] }> = {
  bureaus:               { label: 'Bureaus' },
  tenants:               { label: 'Tenants' },
  tenant_jurisdictions:  { label: 'Tenant Jurisdictions' },
  jurisdictions:         { label: 'Jurisdictions' },
  users:                 { label: 'Users', exclude: ['password_hash'] },
  tenant_memberships:    { label: 'Tenant Memberships' },
  employees:             { label: 'Employees' },
  pay_settings:          { label: 'Pay Settings' },
  pay_schedules:         { label: 'Pay Schedules' },
  pay_runs:              { label: 'Pay Runs' },
  pay_run_items:         { label: 'Pay Run Items' },
  pay_run_line_items:    { label: 'Pay Run Line Items' },
  variable_pay_items:    { label: 'Variable Pay Items' },
  calculation_snapshots: { label: 'Calculation Snapshots' },
  rules:                 { label: 'Rules' },
  rule_versions:         { label: 'Rule Versions' },
  rule_overrides:        { label: 'Rule Overrides' },
  timesheets:            { label: 'Timesheets' },
  leave_types:           { label: 'Leave Types' },
  leave_profiles:        { label: 'Leave Profiles' },
  leave_profile_rules:   { label: 'Leave Profile Rules' },
  leave_entitlements:    { label: 'Leave Entitlements' },
  leave_transactions:    { label: 'Leave Transactions' },
  leave_requests:        { label: 'Leave Requests' },
  audit_log:             { label: 'Audit Log' },
};

function toCSV(rows: Record<string, unknown>[], exclude: string[] = []): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]).filter(h => !exclude.includes(h));
  const escape = (v: unknown): string => {
    if (v === null || v === undefined) return '';
    const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  return [
    headers.join(','),
    ...rows.map(r => headers.map(h => escape(r[h])).join(',')),
  ].join('\n');
}

export async function reportRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /api/v1/admin/reports — list available tables
  fastify.get('/', { preHandler: [authenticate] }, async (req, reply) => {
    if ((req as any).user?.role !== 'platform_admin') {
      return reply.status(403).send({ error: 'Platform admin only' });
    }
    return Object.entries(TABLES).map(([table, cfg]) => ({ table, label: cfg.label }));
  });

  // GET /api/v1/admin/reports/:table — download table as CSV
  fastify.get('/:table', { preHandler: [authenticate] }, async (req, reply) => {
    if ((req as any).user?.role !== 'platform_admin') {
      return reply.status(403).send({ error: 'Platform admin only' });
    }
    const { table } = req.params as { table: string };
    const cfg = TABLES[table];
    if (!cfg) {
      return reply.status(404).send({ error: `Unknown table: ${table}` });
    }

    // Table name is validated against whitelist — safe to interpolate
    const rows = await query<Record<string, unknown>>(`SELECT * FROM ${table} ORDER BY 1`, []);
    const csv = toCSV(rows, cfg.exclude);

    reply.header('Content-Type', 'text/csv; charset=utf-8');
    reply.header('Content-Disposition', `attachment; filename="${table}.csv"`);
    return reply.send(csv);
  });
}

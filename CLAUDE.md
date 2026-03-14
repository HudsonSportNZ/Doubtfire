# Pay The Nanny — Payroll Engine (Doubtfire)

## Who I am
Founder and qualified AU payroll specialist. Not deeply technical.
Explain decisions clearly as we go. I will direct with domain expertise,
you handle the code.

## What we are building
A modern embedded payroll engine platform called Pay The Nanny.
Replacing KeyPay / Employment Hero as our payroll provider.
Multi-tenant, multi-jurisdiction, bureau-aware payroll platform.

## Business context
- First bureau: Pay The Nanny
- Jurisdictions: New Zealand AND Australia — both required in v1
- ~40% of customer base is AU, remainder NZ
- AU customers are household employers — flat contracts or Misc Award
- Award interpretation handled upstream — engine receives clean inputs
- v1 operated by platform admin only — no client or employee portals yet

## Core hierarchy
Platform → Bureau → Tenant → Employee
- Employees belong to Tenants, not Bureaus
- Bureaus are a management and reporting layer only
- All payroll records are strictly tenant-scoped
- Tenant isolation enforced at application AND database level (Postgres RLS)

## Tech stack
- Fastify + TypeScript (API) — lives in /api
- PostgreSQL 16 (database) — local install on port 5432, DB name: doubtfire_dev
- BullMQ + Redis (async queues)
- React + Vite 7 + Tailwind (frontend) — lives in /client
- Railway (API hosting), Vercel (frontend hosting)

## Deployment
- Frontend: Vercel — auto-deploys from master branch
  - Root Directory set to /client in Vercel dashboard
  - client/vercel.json handles SPA routing rewrites
  - Live at homestak.co.nz
  - Env var: VITE_API_URL=https://doubtfire-production.up.railway.app
- API: Railway — config in api/railway.json
  - Root Directory must be set to /api in Railway dashboard
  - Public URL: https://doubtfire-production.up.railway.app
  - Start command: npm run migrate && npm start (runs migrations on every deploy)
  - Railway Postgres public URL format: postgresql://postgres:PASSWORD@yamabiko.proxy.rlwy.net:27357/railway
  - Required Railway env vars: JWT_SECRET, ALLOWED_ORIGINS, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME

## Brand
- Primary colour: #39175D (deep purple)
- Font: Barlow (Google Fonts)

## Money rules — non-negotiable
- All monetary values: DECIMAL(12,4) — never floats
- ROUND_HALF_UP on all final amounts
- Rounding applied per line item, not at grand total

## Key architecture rules
- Pay runs follow state machine: draft → calculating → review → approved → finalised
- Calculation snapshots are immutable — never update after insert
- Leave balances computed from leave_transactions ledger — never stored directly
- Post-finalisation corrections are new adjustment pay runs — never mutate originals
- All writes require idempotency keys
- Rules use 5-level inheritance: Jurisdiction → Platform → Bureau → Tenant → Employee

## Reference documents in this repo
- /docs/Payroll_Engine_Architecture_v2_with_Leave_Engine.docx — full architecture spec
- /docs/PayrollEngine_ArchitectureDiagrams.html — visual diagrams
- /docs/reference/PayrollDashboard (1).jsx — UI prototype (already deployed to Vercel)

## What has been built

### Phase 1 — Complete
- /api — Fastify + TypeScript API scaffold
  - src/server.ts + app.ts — entry point and app factory
  - src/config.ts — env var config (requires JWT_SECRET, ALLOWED_ORIGINS)
  - src/db/client.ts — pg Pool with query() and withTransaction() helpers
  - src/db/migrate.ts — SQL migration runner (npm run migrate)
  - src/middleware — authenticate, errorHandler, tenantScope
  - src/queues — BullMQ pay run queue
  - src/rules/engine.ts — rule resolver stub (5-level inheritance, Phase 5)
  - src/models/common.ts — shared TypeScript types
  - GET /health — DB connectivity check
- /client — React + Vite 7 + Tailwind frontend
  - PayrollDashboard.jsx deployed and live (full UI prototype)
  - Tailwind configured with brand colours and Barlow font
- railway.json — Railway deployment config
- client/vercel.json — Vercel SPA routing config

### Phase 2 — Complete
- 23 SQL migrations in api/src/migrations/ (0001–0023)
  - Full schema: bureaus, tenants, jurisdictions, users, memberships
  - Employees, pay_settings, pay_schedules
  - Pay runs (state machine), pay_run_items, pay_run_line_items, variable_pay_items
  - calculation_snapshots (immutable, trigger-enforced)
  - Rules engine: rules, rule_versions, rule_overrides
  - Timesheets
  - Leave engine: leave_types (NZ+AU seeded), leave_profiles, leave_profile_rules,
    leave_entitlements, leave_transactions (append-only, trigger-enforced),
    leave_requests, leave_balances_current (VIEW)
  - Audit log
  - Row Level Security on all tenant-scoped tables
- All migrations applied to local DB (doubtfire_dev) and Railway Postgres

### Phase 3 — Complete
- POST /api/v1/auth/login — bcrypt password check, returns signed JWT (8h expiry)
- GET /api/v1/auth/me — returns authenticated user (protected)
- CORS updated: ALLOWED_ORIGINS env var controls allowed origins
- Frontend login page — branded, email/password form
- AuthContext — JWT stored in localStorage, login/logout
- ProtectedRoute — redirects to /login if not authenticated
- App.tsx — React Router with /login and / (protected dashboard)
- Seed script: npm run seed (creates platform admin, uses ADMIN_EMAIL/ADMIN_PASSWORD env vars)
- Platform admin account active on Railway: mark@paythenanny.com

## Current build phase
Phase 5 — Pay Run Engine

### Phase 4 — Complete
- POST/GET /api/v1/bureaus — create and list bureaus
- POST/GET /api/v1/bureaus/:id/tenants — create and list tenants under bureau
- GET/PATCH /api/v1/tenants/:id — get and update tenant (including jurisdiction)
- POST/GET /api/v1/tenants/:id/employees — create and list employees
- GET/PATCH /api/v1/employees/:id — get and update employee
- POST/GET /api/v1/employees/:id/pay-settings — effective-dated pay settings history
- POST/GET /api/v1/tenants/:id/pay-schedules — weekly, fortnightly, monthly, one_off
- Jurisdiction set at employer (tenant) level, inherited by employees and pay schedules
- Employees must be linked to an employer AND a pay schedule on creation
- Migrations 0024–0038 applied locally and to Railway
- New employer modal includes NZ/AU jurisdiction selector
- All dates displayed as DD/MM/YYYY in UI
- React Router v6 with full URL routing — every entity has a shareable deep-link URL
  - `/clients` → ClientsPage (list)
  - `/clients/:id` → ClientDetailPage (bureau detail + employer list)
  - `/employers/:id` → EmployerDetailPage (tenant detail, jurisdictions, pay schedules)
  - `/employees` → EmployeesPage (list)
  - `/employees/:id` → EmployeeDetailPage (full profile: General, Employment, Payments, Tax, Pay Settings)
  - Sidebar uses path-prefix matching — dynamic sub-routes highlight correct nav item
  - `/employers/:id` highlights the Clients nav item (employers live under clients)
  - Topbar derives label from PATH_LABELS or regex pattern for dynamic routes

### Phase 4.2 plan — Tax Details & Entity Enrichment (Next Session)
Complete tax, financial, and compliance fields across clients, employers, and employees.

#### Clients (Bureaus)
- ABN / NZBN — business registration number
- GST/IRD registration number
- Contact details: primary contact name, phone, address

#### Employers (Tenants)
- NZ: IRD number, PAYE frequency (twice-monthly / monthly), GST registration, WC levy number
- AU: ABN, ACN, payroll tax state obligations, STP registration status
- Physical address (for payday filing headers)
- Payroll contact name + email (for IRD/ATO correspondence)

#### Employees — NZ
- IRD number (encrypted at rest — Phase 6, store plaintext with TODO for now)
- Tax code (M, M SL, S, SH, ST, SA, CAE, EDW, NSW, WT, SB, SB SL)
- KiwiSaver status: enrolled / opt-out / not eligible
- KiwiSaver employee rate: 3%, 4%, 6%, 8%, 10%
- KiwiSaver employer rate: 3% (default, overridable)
- Student loan: yes/no (adds SL suffix to tax code)
- ESCT rate (derived from salary band — calculated, not user-entered)

#### Employees — AU
- TFN (encrypted at rest — Phase 6, store plaintext with TODO for now)
- TFN declaration status: provided / not provided / pending
- Residency for tax purposes: resident / foreign resident / working holiday maker
- Tax-free threshold claimed: yes/no
- HELP/HECS debt: yes/no
- Super fund name + member number
- Super fund USI (Unique Superannuation Identifier)
- Superannuation guarantee rate (currently 11.5% for FY2025, overridable)

#### Implementation notes
- Tax codes and rates should validate against the seeded tax_scales table
- All tax identifier fields: store plaintext now, add TODO comment for Phase 6 encryption
- Extend Zod schemas in tenants.ts and employees route
- Extend frontend modals: Details tab in EmployerDetail, employee edit form
- No new migrations needed if columns already exist — check schema first

### Phase 5 plan — Pay Run Engine
- POST /api/v1/tenants/:id/pay-runs       — create pay run (draft)
- POST /api/v1/pay-runs/:id/timesheets    — attach timesheets
- POST /api/v1/pay-runs/:id/calculate     — enqueue calculation (BullMQ)
- GET  /api/v1/pay-runs/:id               — get pay run + items
- POST /api/v1/pay-runs/:id/approve       — approve (maker-checker)
- POST /api/v1/pay-runs/:id/finalise      — lock and finalise
- BullMQ worker: calculation engine for NZ (PAYE, KiwiSaver, ACC, leave accrual)
- BullMQ worker: calculation engine for AU (PAYG, Super, leave accrual)
- Rules engine implementation (5-level inheritance)

### Phase 6 plan — Leave Engine
- GET  /api/v1/employees/:id/leave-balance    — current balance from ledger view
- POST /api/v1/employees/:id/leave-requests   — submit leave request
- GET  /api/v1/tenants/:id/leave-requests     — list pending requests
- POST /api/v1/leave-requests/:id/approve     — approve request
- AWE (Average Weekly Earnings) calculation from calculation_snapshots history
- Leave accrual triggered on pay run finalisation

### Phase 7 plan — Reporting & Exports
- IRD Payday Filing (NZ) — XML/CSV export from pay_run_line_items
- ATO Single Touch Payroll (AU) — STP2 format
- Bank payment file (CSV)
- Payslip generation (PDF)
- Payroll summary report (XLSX)

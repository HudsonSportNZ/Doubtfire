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
- API: Railway — config in api/railway.json
  - Root Directory must be set to /api in Railway dashboard

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
  - src/config.ts — env var config (requires JWT_SECRET, others have defaults)
  - src/db/client.ts — pg Pool with query() and withTransaction() helpers
  - src/db/migrate.ts — SQL migration runner (npm run migrate)
  - src/middleware — authenticate, errorHandler, tenantScope
  - src/queues — BullMQ pay run queue
  - src/rules/engine.ts — rule resolver stub (5-level inheritance, Phase 2)
  - src/models/common.ts — shared TypeScript types
  - GET /health — DB connectivity check
- /client — React + Vite 7 + Tailwind frontend
  - PayrollDashboard.jsx deployed and live (full UI prototype)
  - Tailwind configured with brand colours and Barlow font
- railway.json — Railway deployment config
- client/vercel.json — Vercel SPA routing config

## Current build phase
Phase 2 — Database Foundation (all migration files)
Next: create SQL migration files for all core v1 tables

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
- Fastify + TypeScript (API)
- PostgreSQL 16 (database)
- BullMQ + Redis (async queues)
- React + Vite + Tailwind (frontend)
- AWS ECS Fargate (hosting — local development first)

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
- /docs/Payroll_Engine_Architecture_v0.2.docx — full architecture spec
- /docs/PayrollEngine_ArchitectureDiagrams.html — visual diagrams
- /docs/reference/PayrollDashboard.jsx — existing UI prototype to migrate

## Current build phase
Phase 1 — Project scaffolding, database foundation, frontend shell
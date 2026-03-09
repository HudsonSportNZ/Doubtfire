# Pay The Nanny — Payroll Engine (Doubtfire)

A multi-tenant, multi-jurisdiction payroll engine built for household employers in Australia and New Zealand.

## Architecture

```
Platform → Bureau → Tenant → Employee
```

- **API** — Fastify + TypeScript, lives in `/api`
- **Client** — React + Vite + Tailwind, lives in `/client`
- **Database** — PostgreSQL 16 with Row-Level Security
- **Queues** — BullMQ + Redis

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 16
- Redis 7+

### 1. Install dependencies

```bash
# API
cd api && npm install

# Frontend
cd client && npm install
```

### 2. Configure environment

```bash
cp api/.env.example api/.env
# Edit api/.env with your local values
```

### 3. Run database migrations

```bash
cd api && npm run migrate
```

### 4. Start development servers

```bash
# API (from /api)
npm run dev

# Frontend (from /client)
npm run dev
```

API runs on http://localhost:3000
Frontend runs on http://localhost:5173

## Project Structure

```
/api
  /src
    /routes        — Fastify route handlers
    /services      — Business logic
    /db            — Database client and query helpers
    /models        — TypeScript types and interfaces
    /middleware    — Auth, tenant scoping, error handling
    /queues        — BullMQ job definitions and processors
    /rules         — Rule engine and inheritance logic
    /migrations    — SQL migration files
  app.ts           — Fastify app factory
  server.ts        — Entry point

/client
  /src
    /routes        — React Router route components
    /components    — Shared UI components
    /layouts       — Page layout shells
    /lib           — API client, utilities

/docs              — Architecture documents
```

## Key Rules

- All money values are `DECIMAL(12,4)` — never floats
- Rounding is `ROUND_HALF_UP` per line item
- Pay run state machine: `draft → calculating → review → approved → finalised`
- Calculation snapshots are immutable once written
- All writes require an idempotency key
- All tenant-scoped tables enforce Row-Level Security

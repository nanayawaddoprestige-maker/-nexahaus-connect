# NexaHaus Connect

**NexaHaus Properties & Asset Management Ltd.** — _"Managing Properties. Maximizing Assets."_

NexaHaus Connect is the digital operating platform for NexaHaus: a secure, multi-tenant
property and asset management system for Ghanaian and diaspora property owners, landlords,
investors and developers.

It is **not** a rent-collection app. It is the system of record that connects:

> Owner → NexaHaus → Property → Units → Tenants → Leases → Rent & Payments → Maintenance →
> Inspections → Documents → Expenses → Reporting → Asset Performance

- **Primary market:** Ghana (first office: Accra). Company launch: December 2027.
- **Default currency:** GHS. Multi-currency capable by design.
- **First region:** Greater Accra, architected for national expansion.

---

## Repository status

| Item | State |
|---|---|
| Project type | **New** (greenfield) |
| Phase | **Phase 0 → Phase 1** (foundation + auth/RBAC) |
| Toolchain on build machine | Node.js / package manager / Docker **not yet installed** — see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#local-prerequisites) |

The documentation in [`/docs`](docs) is authoritative and complete for Phase 0. Application
code is scaffolded phase by phase; each phase keeps the system runnable.

---

## Monorepo layout

```
nexahaus-connect/
├── apps/
│   ├── web/        Next.js — Owner portal, Admin dashboard, public website
│   ├── mobile/     Expo / React Native — Owner app + field-staff capture
│   └── api/        NestJS — REST API (/api/v1), workers, OpenAPI
├── packages/
│   ├── types/              Shared domain & DTO TypeScript types
│   ├── validation/         Shared Zod schemas (client + server)
│   ├── ui/                 Shared React component primitives / design tokens
│   ├── config/             Shared runtime config loader + env schema
│   ├── eslint-config/      Shared lint rules
│   └── typescript-config/  Shared tsconfig bases
├── docs/                   Product, architecture, database, security, deployment, testing, compliance
├── docker-compose.yml      Local Postgres + Redis + object storage (MinIO)
└── .env.example            Full environment variable catalog
```

## Documentation

| Doc | Contents |
|---|---|
| [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) | Phased delivery plan, current status, decision log |
| [docs/PRODUCT_REQUIREMENTS.md](docs/PRODUCT_REQUIREMENTS.md) | Product vision, personas, roles, module scope, MVP definition, key journeys |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Stack, runtime topology, cross-cutting patterns (RBAC, tenant isolation, money, events, storage) |
| [docs/DATABASE.md](docs/DATABASE.md) | Data model conventions, domain entity catalog, indexing, migrations, seeding |
| [docs/API.md](docs/API.md) | API conventions, response envelope, error codes, pagination, module map |
| [docs/SECURITY.md](docs/SECURITY.md) | Authentication, authorization, multi-tenant isolation, file security, audit, threat model |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Environments, containers, env catalog, migrations, health checks, backups, CI/CD |
| [docs/TESTING.md](docs/TESTING.md) | Test strategy, critical financial/permission cases, security tests, CI gates |
| [docs/COMPLIANCE.md](docs/COMPLIANCE.md) | Ghana Data Protection Act alignment, real-estate regulatory boundaries, financial controls |

## Quick start (once the toolchain is installed)

```bash
# 1. Install dependencies (workspace-aware)
pnpm install

# 2. Start local infrastructure (Postgres, Redis, MinIO)
docker compose up -d

# 3. Configure environment
cp .env.example .env   # then fill in secrets

# 4. Create the database schema and seed demo data
pnpm --filter @nexahaus/api prisma migrate dev
pnpm --filter @nexahaus/api db:seed

# 5. Run everything in dev
pnpm dev
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the required Node version, package manager,
and infrastructure prerequisites.

## Licensing & legal boundaries

NexaHaus Connect is a management platform. It does **not** provide professional legal,
valuation, tax, or investment advice, and it does not present users as licensed real-estate
brokers. Regulated agency functions are permission-gated and disabled until the required
Ghanaian licensing and qualified personnel are in place. See [docs/COMPLIANCE.md](docs/COMPLIANCE.md).

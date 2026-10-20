<!-- README.md -->
# Branch Reporting System

Monorepo (pnpm + Turborepo):
- `apps/web` — Next.js + TypeScript + Tailwind
- `apps/api` — NestJS + Prisma + PostgreSQL
- `packages/*` — shared contracts / validation / UI

## Prerequisites
- Node.js ≥ 20
- pnpm ≥ 9
- PostgreSQL ≥ 15

## Local Setup
```bash
cp .env.example .env
cp .env.example apps/api/.env
# edit .env (DATABASE_URL, SESSION_SECRET, CSRF_SECRET)

pnpm install
pnpm --filter @repo/api prisma migrate dev --name init
pnpm --filter @repo/api prisma:seed
pnpm --filter @repo/api ts-node prisma/seed-report-templates.ts

pnpm dev
# web: http://localhost:3000  | api: http://localhost:4000/api/v1
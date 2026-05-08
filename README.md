# TestClaudeCodeTechnical-App

Fullstack monorepo: Express + TypeScript + Prisma (server) / React + Vite + Tailwind (client) / shared TypeScript types.

## Stack
- **Server**: Express, TypeScript, Prisma (PostgreSQL), tsx
- **Client**: React 19, Vite, Tailwind CSS v4
- **Shared**: TypeScript types and Zod schemas
- **DB**: PostgreSQL (Docker compose OR Laragon)

## Quick start

```bash
pnpm install

# Option A — Postgres dyal Laragon (default in this setup)
# 1) Cree DB f Laragon: createdb testclaudecode_app
# 2) Adjust server/.env if needed (default user: postgres, no password)

# Option B — Docker compose
pnpm db:up

# Generate Prisma client + first migration
pnpm prisma:migrate

# Run both server (3000) + client (5173) en parallel
pnpm dev
```

## Layout

```
.
├── server/      # Express + TypeScript + Prisma
├── client/      # React + Vite + Tailwind
├── shared/      # Shared types and validation schemas
├── docker-compose.yml
├── pnpm-workspace.yaml
└── package.json
```

## Scripts (root)
- `pnpm dev` — runs server + client in parallel
- `pnpm build` — builds all workspaces
- `pnpm typecheck` — type-checks all workspaces
- `pnpm db:up` / `db:down` — Postgres via Docker
- `pnpm prisma:migrate` — applies Prisma migrations
- `pnpm prisma:studio` — opens Prisma Studio

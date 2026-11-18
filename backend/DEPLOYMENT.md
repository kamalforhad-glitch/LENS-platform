# LENS Backend — Render Deployment Preparation

This file documents the local deployment contract only. It does not create or modify a Render service.

## Render service configuration

| Setting | Value |
|---|---|
| Runtime | Node.js |
| Node version | 22.x (or any supported version >= 20) |
| Root Directory | `.` — repository root |
| Build Command | `npm --prefix backend ci --no-audit --no-fund && npm --prefix backend run build` |
| Start Command | `npm --prefix backend start` |
| Health Check Path | `/api/v1/health` |

The build runs from the repository root so Prisma can use the existing root schema at `prisma/schema.prisma`. The backend `postinstall` script runs `prisma generate --schema ../prisma/schema.prisma` from `backend/`, then `scripts/sync-generated-prisma.cjs` ensures the standalone service has a generated client in `backend/node_modules`. Prisma may generate into either the repository-root or backend dependency tree; the sync script handles both layouts and skips copying when the backend-local client is already current.

## Environment variables

Required for database-backed routes:

- `DATABASE_URL`
- `DIRECT_URL`

Required in production:

- `CORS_ORIGIN` — exact Vercel frontend origin, for example `https://your-vercel-frontend.example`. Wildcards and localhost origins are rejected when `NODE_ENV=production`.

Optional:

- `PORT` — Render injects this; local default is `3001`.
- `NODE_ENV` — Render should set `production`. Local default is `development`.

`/api/v1/health` does not require `DATABASE_URL` or `DIRECT_URL`, does not instantiate Prisma, and performs no database query. It is a liveness check only, not a database readiness check.

## Bound address

The server listens on `0.0.0.0:${PORT}` using `process.env.PORT`.

## Local verification commands

From the repository root:

```bash
npm --prefix backend ci --no-audit --no-fund
npm --prefix backend run typecheck
npm --prefix backend run build
```

From `backend/`:

```bash
npm run typecheck
npm run build
```

No migrations, seeds, `db push`, or production database checks are part of this deployment preparation.

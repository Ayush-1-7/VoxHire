# Contributing

Thanks for working on VoxHire. This guide covers local setup and the conventions
this repo follows.

## Prerequisites

- **Node.js 18.18+** (Node 20 LTS recommended)
- **npm** (the repo ships a `package-lock.json`)
- A **Supabase** Postgres database (or any Postgres reachable from your machine)
- Optional for full functionality: **Vapi**, **Resend**, **Google Calendar**,
  and **Upstash** accounts (see [README](README.md#environment-variables))

## Local setup

```bash
git clone https://github.com/Ayush-1-7/VoxHire.git
cd VoxHire
npm install                      # runs `prisma generate` via postinstall
cp .env.example .env.local       # then fill in real values
npm run db:push                  # apply the Prisma schema to your database
npm run check:config             # verify env + DB connectivity
npm run dev                      # http://localhost:3000
```

> **Supabase + serverless:** use the Supavisor **pooler** connection string
> (`...pooler.supabase.com`), not the direct `db.<ref>.supabase.co` host — the
> direct host is IPv6-only and fails on Vercel. See [DEPLOYMENT.md](DEPLOYMENT.md).

## Branching & commits

- Branch off `main`: `feat/...`, `fix/...`, `refactor/...`, `chore/...`, `docs/...`.
- Use [Conventional Commits](https://www.conventionalcommits.org/): e.g.
  `fix: parse word-form hours in relative interview dates`.
- Keep commits focused; describe the *why* in the body for non-trivial changes.
- Open a PR against `main`; keep the PR description tied to the change.

## Before you push — required checks

All three must pass (CI parity):

```bash
npx tsc --noEmit     # type check
npm run lint         # ESLint (next lint)
npm run build        # production build (also runs prisma generate)
```

## Code conventions

- **TypeScript strict mode** is on. Avoid `any`; prefer precise types and
  narrowing. The `@/*` path alias maps to `src/*`.
- **API routes** are App Router route handlers under `src/app/api/**`. Validate
  request bodies with Zod ([`src/lib/validations`](src/lib/validations)) and
  return `NextResponse.json(...)` with appropriate status codes.
- **Post-call logic belongs in [`src/lib/vapi/process-call.ts`](src/lib/vapi/process-call.ts)**,
  not in the route files — both `/api/vapi/save-call` and `/api/vapi/webhook`
  must stay thin wrappers so they never diverge.
- **Database** access goes through the shared client in
  [`src/lib/db/index.ts`](src/lib/db/index.ts). Prefer idempotent `upsert`s for
  anything that can be retried.
- **External integrations** (email, calendar, redis) must degrade gracefully when
  unconfigured — return/skip rather than throw.
- **Match the surrounding style**: naming, comment density, and idioms of the
  file you're editing.

## Database changes

- Edit [`prisma/schema.prisma`](prisma/schema.prisma).
- For local iteration: `npm run db:push`. For tracked migrations:
  `npm run db:migrate`.
- Run `npm run db:generate` (or just build) to refresh the Prisma client.

## Useful scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | `prisma generate` + production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint |
| `npm run db:push` / `db:migrate` / `db:studio` / `db:generate` | Prisma helpers |
| `npm run check:config` | Validate env vars + live DB check |
| `npm run google:token` | Mint a Google Calendar OAuth refresh token |

## Manual end-to-end test

With the dev server running:

```bash
node prisma/test-live-flow.js
```

This POSTs a realistic completed-call payload to `/api/vapi/save-call` and prints
the saved candidate/call/appointment/email result.

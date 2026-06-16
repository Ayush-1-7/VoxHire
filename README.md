<div align="center">

# 🎙️ VoxHire — AI Voice Recruitment Bot

**An AI voice assistant that screens candidates by phone/browser, extracts their
details, books interviews, and emails confirmations — fully automated, end to end.**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma)](https://www.prisma.io)
[![Vapi](https://img.shields.io/badge/Voice-Vapi-6366f1)](https://vapi.ai)
[![Deployed on Vercel](https://img.shields.io/badge/Vercel-Live-black?logo=vercel)](https://ayush-s-ai-voice-bot.vercel.app)

**Live:** https://ayush-s-ai-voice-bot.vercel.app

</div>

---

## Table of contents

- [What it does](#what-it-does)
- [Features](#features)
- [How it works](#how-it-works)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [npm scripts](#npm-scripts)
- [Database schema](#database-schema)
- [API reference](#api-reference)
- [Pages](#pages)
- [External integrations](#external-integrations)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Documentation](#documentation)
- [License](#license)

---

## What it does

VoxHire is a recruitment screening assistant. A candidate opens the site and
**talks to an AI voice agent** (powered by [Vapi](https://vapi.ai)) directly in
the browser. During the conversation the agent collects the candidate's name,
email, phone, target role, experience, and a preferred interview slot. When the
call ends, the app automatically:

1. **Saves every candidate detail** to the database.
2. **Saves the call** (transcript, duration, extracted data).
3. **Books the interview** — creates a calendar event with a meeting link and an
   `Appointment` record.
4. **Creates a meeting invite** whose subject/description include the role,
   candidate inputs, and the date/time the candidate gave.
5. **Emails the candidate** a confirmation (or an acknowledgement if no interview
   was scheduled), always **CC'ing the recruiter inbox**.

Recruiters manage everything from a dashboard (candidates, calls, analytics,
upcoming interviews).

> Branding in the demo references "Zensar Technologies" for illustration only —
> this is not an official Zensar product.

## Features

- 🗣️ **Browser voice screening** — real-time WebRTC audio, live transcript, and
  an audio visualizer via the Vapi Web SDK.
- 🧠 **Robust data extraction** — parses spelled-out emails ("j‑o‑h‑n at gmail
  dot com"), spoken phone digits ("double seven…"), job roles, years of
  experience, and natural-language dates ("tomorrow at 3 pm", "June 16th at 2 pm")
  resolved in Asia/Kolkata.
- 🔁 **Idempotent, unified pipeline** — the browser and Vapi-webhook paths share
  one processor; a call is never saved, booked, or emailed twice.
- 📅 **Automated interview booking** — Google Calendar event + Meet link, with a
  graceful fallback link if Calendar isn't configured.
- 📧 **Branded transactional emails** — interview confirmation and acknowledgement
  templates via Resend, CC'd to the recruiter, with sandbox-safe redirection.
- 📊 **Recruiter dashboard** — candidate pipeline, call history, analytics charts,
  upcoming interviews.
- 🛡️ **Production hardening** — HMAC-verified webhook, per-IP rate limiting,
  Zod-validated inputs, graceful degradation when integrations are unconfigured.
- 🩺 **Ops tooling** — `npm run check:config` preflight and `npm run google:token`
  OAuth helper.

## How it works

```
Candidate (browser)
   │  Vapi Web SDK (audio + events)
   ▼
Vapi Cloud  ── STT → LLM → TTS
   │                         │ end-of-call-report (server webhook, prod)
   │ call-end (browser)      ▼
   ▼                  /api/vapi/webhook
/api/vapi/save-call        │
   └──────────┬────────────┘
              ▼
   processCompletedCall()   ← single shared pipeline (lib/vapi/process-call.ts)
   ├─ extract candidate data (lib/vapi/extract-data.ts)
   ├─ upsert Candidate  (race-safe on unique email)
   ├─ upsert Call       (idempotent on vapiCallId)
   ├─ schedule interview → Google Calendar + Appointment + confirmation email
   │     └ or → acknowledgement email
   └─ refresh daily Analytics
```

The full design — pipeline steps, idempotency, failure isolation, and data model
— is documented in **[ARCHITECTURE.md](ARCHITECTURE.md)**.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | **Next.js 14.2** (App Router, Route Handlers) · React 18 · TypeScript 5 (strict) |
| Voice | **Vapi** Web SDK (`@vapi-ai/web`) |
| Database | **PostgreSQL** (Supabase) via **Prisma 5** |
| Email | **Resend** (`resend`, `@react-email/components`) |
| Calendar | **Google Calendar API** (`googleapis`) |
| Rate limiting | **Upstash** Redis (`@upstash/ratelimit`, `@upstash/redis`) |
| State / data | **Zustand** · **TanStack Query** |
| UI | **Tailwind CSS** · **Radix UI** · **Framer Motion** · **Recharts** · `lucide-react` |
| Validation | **Zod** · `react-hook-form` |
| Monitoring | **Sentry** (`@sentry/nextjs`) |
| Hosting | **Vercel** |

## Project structure

```
src/
├─ app/
│  ├─ page.tsx                     # Landing page (VoiceAgent + company info + FAQ)
│  ├─ call/                        # Dedicated call page (+ loading/error)
│  ├─ login/route.ts              # Redirects to /dashboard (auth not enforced)
│  ├─ (dashboard)/                 # Recruiter area (shared layout + Sidebar)
│  │  ├─ dashboard/  analytics/  calls/  candidates/  candidates/[id]/  settings/
│  └─ api/
│     ├─ vapi/save-call/          # Browser → save a completed call (primary path)
│     ├─ vapi/webhook/            # Vapi server webhook (HMAC-verified)
│     ├─ vapi/token/              # Per-IP rate-limit check before a call starts
│     ├─ candidates/  candidates/[id]/   # Candidate CRUD
│     ├─ calls/  appointments/  analytics/
│     ├─ calendar/book/  email/send/      # Integration test endpoints
│     └─ health/                  # DB health probe (also a Vercel cron target)
├─ components/
│  ├─ voice-bot/  (VoiceAgent, AudioVisualizer, TranscriptDisplay, CallControls)
│  ├─ dashboard/  (Sidebar, StatCard, CallHistoryTable)
│  ├─ ui/         (button, card, badge, input — Radix-based)
│  └─ providers.tsx               # TanStack Query provider
├─ hooks/useVapi.ts               # Vapi SDK wrapper (events, transcript, save)
├─ lib/
│  ├─ vapi/process-call.ts        # ★ shared post-call pipeline
│  ├─ vapi/extract-data.ts        # transcript → structured candidate data
│  ├─ db/                         # Prisma client + query helpers
│  ├─ email/resend-client.ts      # Resend templates (confirmation, acknowledgement)
│  ├─ google-calendar/            # OAuth client + event booking
│  ├─ redis/rate-limit.ts         # Upstash sliding-window limiter
│  └─ validations/                # Zod schemas
├─ store/callStore.ts             # Zustand store
└─ types/                         # Shared TS types (vapi, index)

prisma/schema.prisma              # Data model
scripts/check-config.mjs          # Env + DB preflight  (npm run check:config)
scripts/get-google-calendar-token.mjs  # OAuth helper   (npm run google:token)
_legacy/                          # Original Vite/vanilla-JS prototype (reference)
```

## Getting started

### Prerequisites

- Node.js **18.18+** (Node 20 LTS recommended) and npm
- A Postgres database (Supabase free tier works)
- Optional accounts for full functionality: Vapi, Resend, Google Calendar, Upstash

### Setup

```bash
git clone https://github.com/Ayush-1-7/VoxHire.git
cd VoxHire
npm install                    # postinstall runs `prisma generate`
cp .env.example .env.local     # fill in real values (see below)
npm run db:push                # apply the schema to your database
npm run check:config           # verify env + DB connectivity
npm run dev                    # http://localhost:3000
```

Open http://localhost:3000, click the call button, and talk to the assistant.
To exercise the pipeline without a microphone:

```bash
node prisma/test-live-flow.js  # POSTs a mock completed call to /api/vapi/save-call
```

## Environment variables

Copy [`.env.example`](.env.example) to `.env.local` and fill in values. The app
degrades gracefully when optional integrations are absent.

| Variable | Required | Purpose |
|---|:---:|---|
| `DATABASE_URL` | ✅ | Postgres pooled connection. **On Vercel, use the Supavisor pooler host** (`...pooler.supabase.com`), not `db.<ref>.supabase.co`. |
| `DIRECT_URL` | ✅ | Postgres direct/session connection for Prisma migrations. |
| `NEXT_PUBLIC_VAPI_PUBLIC_KEY` | ✅ | Vapi web SDK public key (browser). |
| `NEXT_PUBLIC_VAPI_ASSISTANT_ID` | ✅ | Vapi assistant id to start calls with. |
| `VAPI_WEBHOOK_SECRET` | ✅ (prod) | HMAC secret to verify `/api/vapi/webhook`. Enforced when `NODE_ENV=production`. |
| `VAPI_PRIVATE_KEY` | ➖ | Vapi server key (reserved for server-side Vapi calls). |
| `RESEND_API_KEY` | ✅ (email) | Resend API key. |
| `RESEND_FROM_EMAIL` | ✅ (email) | Verified sender address. |
| `RESEND_CC_EMAIL` | ➖ | Recruiter inbox CC'd on every candidate email + sandbox fallback. Default `ayush17v@gmail.com`. |
| `GOOGLE_CALENDAR_CLIENT_ID` / `_SECRET` / `_REFRESH_TOKEN` / `_REDIRECT_URI` | ➖ | Google Calendar OAuth. Without these, booking falls back to a generated meeting link. Use `npm run google:token`. |
| `GOOGLE_CALENDAR_ID` | ➖ | Calendar to write to (default `primary`). |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | ➖ | Per-IP rate limiting. Without these, rate limiting is disabled (allow-all). |
| `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_APP_NAME` | ➖ | Public app URL / name. |
| `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_*` | ➖ | Error monitoring. |
| `NEXTAUTH_URL` / `NEXTAUTH_SECRET` | ➖ | Present for a future auth rollout (auth is not currently enforced). |

Run `npm run check:config` any time to see what's set, what's a placeholder, and
whether the DB is reachable.

## npm scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | `prisma generate` + production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint (`next lint`) |
| `npm run db:push` | Push the Prisma schema to the database |
| `npm run db:migrate` | Create/apply a dev migration |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:generate` | Regenerate the Prisma client |
| `npm run check:config` | Validate env vars + live DB check (Vercel-compat DB host detection) |
| `npm run google:token` | Mint a Google Calendar OAuth refresh token |

## Database schema

Defined in [`prisma/schema.prisma`](prisma/schema.prisma) (PostgreSQL):

- **Candidate** — `name`, unique `email?`, `phone?`, `jobRole?`, `experience?`,
  `status` (`NEW · CONTACTED · SCREENING · INTERVIEW_SCHEDULED · INTERVIEWED ·
  OFFER_SENT · HIRED · REJECTED · WITHDRAWN`), `notes?`, `source`, `consentGiven`.
- **Call** — unique `vapiCallId`, `candidateId?`, `duration?`, `status`
  (`INITIATED · IN_PROGRESS · COMPLETED · FAILED · NO_ANSWER`), `transcript` (JSON),
  `summary?`, `extractedData` (JSON), `startedAt`, `endedAt?`.
- **Appointment** — `candidateId`, `scheduledAt`, `durationMinutes`, `status`
  (`SCHEDULED · CONFIRMED · CANCELLED · COMPLETED · NO_SHOW · RESCHEDULED`),
  `googleEventId?` (unique), `googleMeetLink?`, `confirmationSent`, `reminderSent`.
- **Analytics** — one row per `date`: `callCount`, `avgDuration`, `newCandidates`,
  `scheduledInterviews`, `completedInterviews`.
- **User / Account / Session / VerificationToken** — NextAuth-shaped tables
  (auth not yet enforced).

## API reference

Base path `/api`. All return JSON.

### Voice pipeline
| Method | Route | Body / Query | Returns |
|---|---|---|---|
| `POST` | `/vapi/save-call` | `{ vapiCallId, transcript[], duration, startedAt, endedAt }` | `{ saved, candidate, call, appointment, email, extractedData }` — runs the full pipeline |
| `POST` | `/vapi/webhook` | Vapi event (`call-started` · `call-ended` · `end-of-call-report` · `assistant-request`); header `x-vapi-signature` | `{ received: true }` · `401` on bad signature |
| `POST` | `/vapi/token` | — (uses caller IP) | `{ allowed, remaining }` · `429` when rate-limited |

### Candidates
| Method | Route | Body / Query | Returns |
|---|---|---|---|
| `GET` | `/candidates` | `?page&pageSize&status&search` | `{ data[], total, page, pageSize, totalPages }` (includes call/appointment counts) |
| `POST` | `/candidates` | Zod `candidateCreateSchema` | `201` created candidate · `400` on validation error |
| `GET` | `/candidates/[id]` | — | candidate with recent `calls` + `appointments` · `404` if missing |
| `PUT` | `/candidates/[id]` | Zod `candidateUpdateSchema` (partial) | updated candidate |
| `DELETE` | `/candidates/[id]` | — | `{ deleted: true }` |

### Reporting
| Method | Route | Query | Returns |
|---|---|---|---|
| `GET` | `/calls` | `?page&pageSize&status` | `{ data[] (with candidate), total, page, pageSize, totalPages }` |
| `GET` | `/analytics` | `?days=30` | `{ analytics[], summary{...}, statusDistribution[] }` |
| `GET` | `/appointments` | — | `{ data[] }` — next 5 upcoming scheduled interviews |

### Integration test endpoints
| Method | Route | Body | Returns |
|---|---|---|---|
| `POST` | `/calendar/book` | `{ scheduledAt, candidateName, candidateEmail }` | `{ googleEventId, meetLink }` |
| `POST` | `/email/send` | `{ candidateName, candidateEmail, scheduledAt, meetLink }` | `{ success, response }` |
| `GET` | `/health` | — | `{ status: "ok", time }` · `500 { status: "error", message }` if DB unreachable |

## Pages

| Route | Description |
|---|---|
| `/` | Landing page — voice agent, company overview, stats, FAQ accordion |
| `/call` | Dedicated full-screen call experience |
| `/dashboard` | Recruiter overview (KPIs, recent activity) |
| `/candidates` · `/candidates/[id]` | Candidate list and detail (calls + appointments) |
| `/calls` | Call history table |
| `/analytics` | Charts (Recharts) over the analytics aggregates |
| `/settings` | Settings |
| `/login` | Redirects to `/dashboard` (auth not enforced) |

## External integrations

- **Vapi** — voice agent (STT/LLM/TTS). Browser uses the public key + assistant
  id; the server webhook is HMAC-verified. Set the assistant's Server URL to
  `https://<domain>/api/vapi/webhook`.
- **Supabase (Postgres)** — primary datastore via Prisma. **Use the Supavisor
  pooler connection on Vercel.**
- **Resend** — transactional email. Verify a domain to deliver to real
  candidates; otherwise sandbox mode redirects to the recruiter inbox.
- **Google Calendar** — interview events + Meet links via OAuth refresh token.
- **Upstash Redis** — per-IP sliding-window rate limiting (10 req / 60 s).
- **Sentry** — optional error monitoring.

## Deployment

Hosted on **Vercel**. The full runbook — including the **required Supabase
pooler connection** for serverless, the webhook secret, and optional Calendar /
Resend setup — is in **[DEPLOYMENT.md](DEPLOYMENT.md)**.

Quick path:
1. Set env vars in Vercel (use the **pooler** `DATABASE_URL`/`DIRECT_URL`).
2. Push to `main` (Git integration) or run `vercel --prod`.
3. Verify: `curl https://<domain>/api/health` → `{"status":"ok"}`.

## Troubleshooting

| Symptom | Cause & fix |
|---|---|
| `/api/health` 500: *Can't reach database server at `db.<ref>.supabase.co`* | Supabase direct host is IPv6-only; Vercel is IPv4. Switch `DATABASE_URL`/`DIRECT_URL` to the **Supavisor pooler** (`...pooler.supabase.com`). See DEPLOYMENT.md. |
| Webhook returns `401` in production | `VAPI_WEBHOOK_SECRET` missing/mismatched. Set it in Vercel **and** the Vapi dashboard. (The browser `save-call` path works without it.) |
| Candidate doesn't receive email | Resend in sandbox mode — emails redirect to `RESEND_CC_EMAIL`. Verify a domain and set `RESEND_FROM_EMAIL`. |
| Interview has a Teams link, not Google Meet | Google Calendar OAuth not configured (placeholders). Run `npm run google:token` and set the env vars. |
| Rate limit always allows | Upstash not configured — limiter falls back to allow-all. Set `UPSTASH_REDIS_REST_URL`/`_TOKEN`. |
| Local DB connects but Prisma CLI fails | `.env` and `.env.local` must both point at a reachable host; `.env.local` overrides `.env`. |

## Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** — system design, pipeline, data model, decisions
- **[DEPLOYMENT.md](DEPLOYMENT.md)** — production runbook (Supabase pooler, webhook, Calendar, Resend)
- **[CONTRIBUTING.md](CONTRIBUTING.md)** — local setup, conventions, required checks
- **[SECURITY.md](SECURITY.md)** — security policy, secret rotation, known gaps
- **[CHANGELOG.md](CHANGELOG.md)** — version history

## License

Proprietary — all rights reserved. See **[LICENSE](LICENSE)**. Not an official
Zensar product; third-party names/branding belong to their respective owners.

# Architecture — VoxHire

This document describes the system design, the post-call processing pipeline, the
data model, and the key engineering decisions. For setup see the
[README](README.md); for deploy steps see [DEPLOYMENT.md](DEPLOYMENT.md).

---

## 1. High-level overview

VoxHire is a **Next.js 14 (App Router)** application that conducts AI voice
screening interviews and automates the downstream recruiter workflow. There are
two surfaces:

- **Candidate surface** — a public landing page (`/`) and call page (`/call`)
  where a candidate talks to a [Vapi](https://vapi.ai) voice assistant in the
  browser.
- **Recruiter surface** — a dashboard (`/dashboard`, `/candidates`, `/calls`,
  `/analytics`, `/settings`) backed by REST route handlers under `/api`.

```
                         ┌────────────────────────────────────────────┐
                         │                  Browser                    │
   Candidate  ◀────────▶ │  /  ·  /call   (VoiceAgent + useVapi hook)  │
                         │        │                                    │
                         └────────┼────────────────────────────────────┘
                                  │ Vapi Web SDK (WebRTC audio + events)
                                  ▼
                         ┌──────────────────┐
                         │   Vapi Cloud      │  speech-to-text, LLM, text-to-speech
                         └──────┬─────┬──────┘
              end-of-call       │     │  (browser) transcript on call-end
              report (webhook)  │     │
                                ▼     ▼
        ┌───────────────────────────────────────────────────────────┐
        │                    Next.js API (Vercel)                     │
        │   /api/vapi/webhook        /api/vapi/save-call              │
        │            └──────────┬─────────────┘                       │
        │                       ▼                                     │
        │            lib/vapi/process-call.ts  ← single shared pipe   │
        └───────┬───────────────┬───────────────┬───────────────┬────┘
                ▼               ▼               ▼               ▼
          Prisma/Postgres   Resend email   Google Calendar   Upstash Redis
          (Supabase)        (Resend)       (googleapis)      (rate limit)
```

---

## 2. The post-call pipeline (the core automation)

When a call ends, exactly one function does all the work:
**`processCompletedCall()`** in [`src/lib/vapi/process-call.ts`](src/lib/vapi/process-call.ts).
It is invoked from **both** entry points so behavior is identical in local dev
and production:

| Entry point | Trigger | When it runs |
|---|---|---|
| `POST /api/vapi/save-call` | Browser `useVapi` hook on the `call-end` event | Always (primary; works on localhost) |
| `POST /api/vapi/webhook` (`end-of-call-report`) | Vapi's servers | Production only (Vapi can't reach localhost) |

### Steps

1. **Normalize transcript** — coerce the raw turns into `{ role, text }`, dropping empties.
2. **Extract candidate data** — [`extractCandidateData()`](src/lib/vapi/extract-data.ts)
   first reads Vapi's structured `analysis.structuredData`, then falls back to
   robust transcript parsing for: name, email (incl. spelled-out emails like
   "j o h n at gmail dot com"), phone (incl. spoken digits / "double seven"),
   job role, experience, and a preferred interview date/time (relative dates
   like "tomorrow at 3 pm" and absolute like "June 16th at 2 pm", resolved in
   Asia/Kolkata).
3. **Save/update candidate** — race-safe `upsert` on the unique `email`; matches
   by phone when there's no email. Partial later calls never clobber a good name
   or reset pipeline status.
4. **Save/update call** — idempotent `upsert` on `vapiCallId` (status `COMPLETED`
   when there's a transcript, else `NO_ANSWER`).
5. **Idempotency guard** — if the call was already `COMPLETED`, the notification
   side-effects (booking + email) are skipped, so the second entry point never
   double-books or double-emails.
6. **Schedule or acknowledge**:
   - If a preferred date **and** candidate email exist → `scheduleInterview()`:
     dedupe on `(candidateId, scheduledAt)` → book Google Calendar event (falls
     back to a Teams mock link if Calendar isn't configured) → create
     `Appointment` → set candidate status `INTERVIEW_SCHEDULED` → send the
     **interview confirmation** email → mark `confirmationSent`.
   - Else if candidate email exists → send the **acknowledgement** email.
7. **Refresh analytics** — upsert today's `Analytics` row (call count, new
   candidates, scheduled interviews, average duration).

Every candidate email CCs the recruiter inbox (`RESEND_CC_EMAIL`, default
`ayush17v@gmail.com`). In Resend sandbox mode, undeliverable candidate emails are
redirected to that inbox with a banner instead of failing.

### Idempotency & failure isolation

- **Call** is keyed by `vapiCallId` (`@unique`) → re-processing is safe.
- **Appointment** dedupes on `(candidateId, scheduledAt)`.
- **Emails / calendar** are wrapped so a failure is recorded in the response
  (`{ sent: false, error }`) but never aborts the DB writes.
- A Google Calendar outage degrades gracefully to a generated meeting link.

---

## 3. Data model (Prisma / PostgreSQL)

Defined in [`prisma/schema.prisma`](prisma/schema.prisma). Core business models:

- **Candidate** — `name`, unique `email?`, `phone?`, `jobRole?`, `experience?`,
  `status` (enum `CandidateStatus`), `notes?`, `source`, `consentGiven`. Has many
  `Call` and `Appointment`.
- **Call** — unique `vapiCallId`, `candidateId?`, `duration?`, `status`
  (`CallStatus`), `transcript` (JSON), `summary?`, `extractedData` (JSON),
  `startedAt`, `endedAt?`.
- **Appointment** — `candidateId`, `scheduledAt`, `durationMinutes`, `status`
  (`AppointmentStatus`), `googleEventId?` (unique), `googleMeetLink?`,
  `confirmationSent`, `reminderSent`.
- **Analytics** — one row per `date` (unique), daily aggregates.
- **User / Account / Session / VerificationToken** — NextAuth-shaped tables.
  > **Note:** authentication is **not currently enforced** — `/login` simply
  > redirects to `/dashboard`. These models remain for a future auth rollout.

---

## 4. Frontend

- **State**: [Zustand](src/store/callStore.ts) (`callStore` — active call id,
  persisted preferred volume) and React local state inside the
  [`useVapi`](src/hooks/useVapi.ts) hook.
- **Data fetching**: TanStack Query (`@tanstack/react-query`) via
  [`providers.tsx`](src/components/providers.tsx).
- **Voice**: the [`useVapi`](src/hooks/useVapi.ts) hook wraps a singleton Vapi
  Web SDK instance and handles `call-start`, `call-end`, `speech-start/end`,
  `message` (final transcripts + `call-update` for the call id), `volume-level`,
  and `error`. On `call-end` it POSTs the transcript to `/api/vapi/save-call`
  (guarded by `saveCallInFlightRef` so it fires once).
- **UI**: Tailwind CSS + Radix UI primitives, Framer Motion, Recharts (analytics),
  `lucide-react` icons.

---

## 5. Cross-cutting concerns

- **Rate limiting** — [`lib/redis/rate-limit.ts`](src/lib/redis/rate-limit.ts)
  uses Upstash sliding window (10 req / 60 s). `POST /api/vapi/token` calls it
  before a call starts. Falls back to allow-all if Upstash isn't configured.
- **DB client** — a single Prisma client singleton
  ([`lib/db/index.ts`](src/lib/db/index.ts)) with a `withDbRetry` helper that
  retries once on `P1001` (Supabase cold start).
- **Webhook security** — `/api/vapi/webhook` verifies an HMAC-SHA256 signature
  (`x-vapi-signature`) against `VAPI_WEBHOOK_SECRET` using a timing-safe compare.
  Verification is skipped only when `NODE_ENV=development`.
- **Error monitoring** — `@sentry/nextjs` is a dependency (enabled when
  `NEXT_PUBLIC_SENTRY_DSN` is set).
- **Connection on serverless** — Vercel functions are IPv4-only; Supabase's
  direct host is IPv6-only. Production therefore **must** use the Supavisor
  pooler host (see [DEPLOYMENT.md](DEPLOYMENT.md)).

---

## 6. Key decisions

- **One shared pipeline, two entry points** — eliminates drift between the local
  (browser) and production (webhook) paths and centralizes idempotency.
- **Defensive extraction over strictness** — speech-to-text is noisy, so parsing
  accepts spelled-out emails, spoken digits, and many date/time phrasings, always
  falling back rather than failing.
- **Graceful degradation everywhere** — missing Calendar/Resend/Upstash config
  produces fallbacks (mock meet link, skipped email, allow-all rate limit) rather
  than hard failures, so the core save-the-candidate flow always completes.

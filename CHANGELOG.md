# Changelog

All notable changes to this project are documented here. The format is loosely
based on [Keep a Changelog](https://keepachangelog.com/), and the project follows
semantic-ish versioning.

## [Unreleased]

### Added
- **Shared post-call pipeline** `src/lib/vapi/process-call.ts` — both
  `/api/vapi/save-call` and `/api/vapi/webhook` now delegate to a single
  idempotent `processCompletedCall()`.
- **Candidate acknowledgement email** (`sendCandidateAcknowledgement`) for calls
  that complete without an interview being scheduled.
- **Config preflight script** `npm run check:config` — validates required/optional
  env vars, detects the Supabase direct-host (Vercel IPv6) trap, and live-checks
  the database connection.
- **Google Calendar token helper** `npm run google:token` — one-time OAuth flow
  to mint a Calendar refresh token.
- **Documentation**: detailed `README.md`, `ARCHITECTURE.md`, `DEPLOYMENT.md`,
  `CONTRIBUTING.md`, `SECURITY.md`, this `CHANGELOG.md`, and `LICENSE`.
- `RESEND_CC_EMAIL` env var (defaults to the recruiter inbox) — CC'd on every
  candidate email and used as the sandbox fallback recipient.

### Changed
- **Idempotency**: calls upsert on `vapiCallId`; appointments dedupe on
  `(candidateId, scheduledAt)`; emails/booking are skipped if a call was already
  processed — so the client and webhook paths can't double-act.
- **Race-safe candidate persistence**: upsert on the unique `email`; partial later
  calls no longer overwrite a real name with the `Applicant` fallback or reset
  pipeline status.
- **Richer calendar invite**: event description now includes role, experience,
  date/time (IST), and duration.
- **Email config**: the recruiter inbox is configurable via `RESEND_CC_EMAIL`
  instead of being hardcoded.
- `.env.example` now documents the Supavisor **pooler** connection format.

### Fixed
- **Relative interview time parsing**: word-form hours ("Friday at *eleven* AM")
  are now parsed correctly instead of defaulting to 10 AM.
- Webhook `call-started` / `call-ended` / `end-of-call-report` handlers now
  `upsert` so out-of-order events don't error.

### Deployment
- Documented and resolved the **Supabase + Vercel IPv6** issue: production must
  use the Supavisor pooler host (`aws-1-ap-northeast-1.pooler.supabase.com` for
  this project).

## [2.0.0]
- Next.js 14 App Router rewrite: voice screening via Vapi, Prisma/Supabase
  persistence, recruiter dashboard (candidates, calls, analytics, settings),
  Resend email, Google Calendar booking, Upstash rate limiting. Legacy
  Vite/vanilla prototype retained under `_legacy/`.

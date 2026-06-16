# Security Policy

## Reporting a vulnerability

If you discover a security issue, please **do not** open a public issue. Email
the maintainer (see the repository owner on GitHub) with details and steps to
reproduce. You'll get an acknowledgement within a few business days.

## Secret management

- **Never commit secrets.** `.env`, `.env*.local`, and `.vercel/` are
  git-ignored. Use [`.env.example`](.env.example) as the template.
- **Production secrets** live only in Vercel → Project → Settings → Environment
  Variables. Verify with `npm run check:config` (locally) before deploying.
- **Rotate on exposure.** If any of these are ever pasted into a chat, log,
  screenshot, or commit, rotate them immediately:
  - `DATABASE_URL` / `DIRECT_URL` (Supabase DB password)
  - `RESEND_API_KEY`
  - `UPSTASH_REDIS_REST_TOKEN`
  - `VAPI_PRIVATE_KEY` / `VAPI_WEBHOOK_SECRET`
  - `GOOGLE_CALENDAR_*` and any OAuth refresh tokens
  - `NEXTAUTH_SECRET`, `SENTRY_AUTH_TOKEN`

  Rotating the Supabase password also changes the pooler connection strings —
  update `DATABASE_URL`/`DIRECT_URL` in Vercel **and** local env together.

## Application security controls

- **Webhook authenticity** — `POST /api/vapi/webhook` verifies an HMAC-SHA256
  signature (`x-vapi-signature`) against `VAPI_WEBHOOK_SECRET` with a
  constant-time comparison. In production, a missing/invalid signature returns
  `401`. Signature checks are bypassed **only** when `NODE_ENV=development`.
  → Set a strong `VAPI_WEBHOOK_SECRET` in Vercel and in the Vapi dashboard.
- **Rate limiting** — call starts are rate-limited per IP via Upstash
  (`POST /api/vapi/token`), returning `429` when exceeded.
- **Input validation** — candidate write endpoints validate bodies with Zod
  ([`lib/validations`](src/lib/validations)).
- **No secrets in client bundles** — only `NEXT_PUBLIC_*` values reach the
  browser (Vapi public key + assistant id, app URL/name). Private keys stay
  server-side.

## Known gaps / hardening backlog

- **Dashboard is currently unauthenticated** — `/login` redirects straight to
  `/dashboard` and no session is enforced. The NextAuth data models exist but
  auth is not wired up. **Do not expose the dashboard publicly with real
  candidate PII until auth is enabled.**
- **PII** — transcripts and candidate contact details are stored in the database.
  Treat the database and any exports as confidential.
- **Email deliverability** — until a domain is verified in Resend, candidate
  emails are redirected to the recruiter inbox (sandbox mode).

## Supported versions

This is an actively developed `2.x` project; only the latest `main` is supported.

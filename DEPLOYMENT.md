# Deployment Runbook — VoxHire (Zensar AI Voice Bot)

Production: **https://ayush-s-ai-voice-bot.vercel.app** (Vercel project `ayush-s-ai-voice-bot`)

The code is deployed and green. Going fully live requires a few **credential-only**
steps that must be done in the Supabase / Vercel / Vapi dashboards. Run
`npm run check:config` any time to see what's still missing.

---

## 🔴 1. Fix the database connection (REQUIRED — currently blocking prod)

Production health (`/api/health`) returns 500: *"Can't reach database server at
`db.dxgoftplckymprxlucka.supabase.co`"*.

**Cause:** the direct Supabase host `db.<ref>.supabase.co` is IPv6-only and
unreachable from Vercel's IPv4 serverless functions. It works locally (IPv6),
so it only breaks in production.

**Fix:** use the **Supavisor pooler** host. In the Supabase dashboard →
**Connect**:

| Vercel env var | Supabase tab | Port |
|---|---|---|
| `DATABASE_URL` | Transaction pooler | 6543 (append `?pgbouncer=true`) |
| `DIRECT_URL` | Session pooler | 5432 |

Format (note the user becomes `postgres.<ref>`):

```
DATABASE_URL=postgresql://postgres.dxgoftplckymprxlucka:<PASSWORD>@aws-0-<REGION>.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.dxgoftplckymprxlucka:<PASSWORD>@aws-0-<REGION>.pooler.supabase.com:5432/postgres
```

Set both in **Vercel → Project → Settings → Environment Variables (Production)**,
then redeploy. Verify: `curl https://ayush-s-ai-voice-bot.vercel.app/api/health`
should return `{"status":"ok"}`.

---

## 🔴 2. Webhook secret (REQUIRED for the server-side path)

In production the webhook enforces HMAC signature verification. Without a real
`VAPI_WEBHOOK_SECRET`, `POST /api/vapi/webhook` returns 401.

> The browser path (`/api/vapi/save-call`) does **not** need this and works
> without it — but the webhook is the reliable server-side fallback (fires even
> if the user closes the tab), so set it.

1. Set `VAPI_WEBHOOK_SECRET` to a strong random value in Vercel.
2. In the **Vapi dashboard**, set the assistant's **Server URL** to
   `https://ayush-s-ai-voice-bot.vercel.app/api/vapi/webhook` and the same secret.

---

## 🟡 3. Google Calendar — real Meet invites (optional)

Without this, the bot still books appointments and emails the candidate, but with
a placeholder Teams link instead of a real Google Meet event.

1. Google Cloud Console → enable **Calendar API**, create an **OAuth Web client**,
   add redirect URI `http://localhost:3000/oauth2callback`.
2. Put `GOOGLE_CALENDAR_CLIENT_ID` / `_SECRET` / `_REDIRECT_URI` in `.env.local`.
3. Run `npm run google:token`, follow the two-step flow, paste the printed
   `GOOGLE_CALENDAR_REFRESH_TOKEN` into `.env.local` **and** Vercel.
4. `npm run check:config` should now show *Google Calendar: ✓ configured*.

---

## 🟡 4. Resend — real candidate delivery (optional)

Until a sending domain is verified in Resend, candidate emails are
sandbox-redirected to the owner inbox (`RESEND_CC_EMAIL`, default
`ayush17v@gmail.com`).

1. Verify a domain in the **Resend dashboard** (add the DNS records).
2. Set `RESEND_FROM_EMAIL` to an address on that domain in Vercel.
3. Optionally set `RESEND_CC_EMAIL` to the recruiter inbox you want CC'd on every
   candidate email.

---

## ✅ Verification checklist

```bash
npm run check:config          # all required green, DB host = pooler
curl .../api/health           # {"status":"ok"}
```

Then place a real test call from `/call`, hang up, and confirm:
- a Candidate + Call row appear in the dashboard,
- an Appointment is created if an interview date was given,
- the candidate receives the email (CC to the recruiter inbox).

## Pipeline reference

`call ends → /api/vapi/save-call (browser) or /api/vapi/webhook (Vapi) →
processCompletedCall()` → extract data → upsert candidate → upsert call
(idempotent on vapiCallId) → if date given: book calendar + create appointment +
confirmation email, else acknowledgement email → refresh analytics. Both entry
points share `src/lib/vapi/process-call.ts` and are safe to both fire.

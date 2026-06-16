#!/usr/bin/env node
/**
 * Production config preflight check.
 *
 *   node scripts/check-config.mjs
 *
 * Validates that every environment variable the runtime needs is present and
 * not a placeholder, then live-checks the database connection. Use it before a
 * deploy (or after setting Vercel env vars) to catch misconfiguration early.
 *
 * Exit code 0 = all required config present. 1 = a required item is missing.
 * Optional integrations (Calendar, Resend domain) only warn — the app degrades
 * gracefully without them.
 */
import fs from "node:fs";
import path from "node:path";

// Load .env then .env.local (local overrides), without external deps.
for (const file of [".env", ".env.local"]) {
  const p = path.join(process.cwd(), file);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

const isPlaceholder = (v) =>
  !v ||
  /placeholder|your_|xxx|\[ref\]|\[password\]|changeme|example\.com/i.test(v);

const REQUIRED = [
  ["DATABASE_URL", "Postgres pooled connection (Supabase)"],
  ["DIRECT_URL", "Postgres direct connection (migrations)"],
  ["NEXT_PUBLIC_VAPI_PUBLIC_KEY", "VAPI web SDK public key"],
  ["NEXT_PUBLIC_VAPI_ASSISTANT_ID", "VAPI assistant id"],
  ["VAPI_WEBHOOK_SECRET", "Webhook HMAC secret (enforced in production!)"],
  ["RESEND_API_KEY", "Resend API key (emails)"],
  ["RESEND_FROM_EMAIL", "Verified sender address"],
];

const OPTIONAL = [
  ["RESEND_CC_EMAIL", "Recruiter CC inbox (defaults to ayush17v@gmail.com)"],
  ["GOOGLE_CALENDAR_CLIENT_ID", "Google Calendar OAuth — real Meet invites"],
  ["GOOGLE_CALENDAR_CLIENT_SECRET", "Google Calendar OAuth"],
  ["GOOGLE_CALENDAR_REFRESH_TOKEN", "Google Calendar OAuth"],
  ["GOOGLE_CALENDAR_REDIRECT_URI", "Google Calendar OAuth redirect"],
  ["UPSTASH_REDIS_REST_URL", "Rate limiting"],
  ["UPSTASH_REDIS_REST_TOKEN", "Rate limiting"],
  ["NEXT_PUBLIC_APP_URL", "Public app URL"],
];

let failed = 0;
let warned = 0;

console.log("\n=== Required ===");
for (const [key, desc] of REQUIRED) {
  const val = process.env[key];
  if (isPlaceholder(val)) {
    console.log(`  ✗ ${key} — MISSING/placeholder — ${desc}`);
    failed++;
  } else {
    console.log(`  ✓ ${key}`);
  }
}

console.log("\n=== Optional (graceful fallback) ===");
for (const [key, desc] of OPTIONAL) {
  const val = process.env[key];
  if (isPlaceholder(val)) {
    console.log(`  ⚠ ${key} — not set — ${desc}`);
    warned++;
  } else {
    console.log(`  ✓ ${key}`);
  }
}

const calendarReady = ["GOOGLE_CALENDAR_CLIENT_ID", "GOOGLE_CALENDAR_CLIENT_SECRET", "GOOGLE_CALENDAR_REFRESH_TOKEN"]
  .every((k) => !isPlaceholder(process.env[k]));
console.log(
  `\nGoogle Calendar: ${calendarReady ? "✓ configured (real invites)" : "⚠ placeholder — using Teams fallback link"}`
);

// Live DB check
console.log("\n=== Live database check ===");
try {
  const { PrismaClient } = await import("@prisma/client");
  const db = new PrismaClient();
  const [candidates, calls, appts] = await Promise.all([
    db.candidate.count(),
    db.call.count(),
    db.appointment.count(),
  ]);
  console.log(`  ✓ Connected. candidates=${candidates} calls=${calls} appointments=${appts}`);
  await db.$disconnect();
} catch (err) {
  console.log(`  ✗ DB connection failed: ${err.message}`);
  failed++;
}

console.log(
  `\nResult: ${failed === 0 ? "READY ✅" : `${failed} required issue(s) ❌`}` +
    (warned ? ` (${warned} optional warning(s))` : "")
);
process.exit(failed === 0 ? 0 : 1);

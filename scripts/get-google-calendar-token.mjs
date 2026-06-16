#!/usr/bin/env node
/**
 * One-time helper to mint a Google Calendar OAuth refresh token so the bot can
 * create real Google Meet interview invites (instead of the Teams fallback).
 *
 * Prerequisites — in Google Cloud Console:
 *   1. Enable the Google Calendar API.
 *   2. Create an OAuth 2.0 Client ID (type: Web application).
 *   3. Add an authorized redirect URI, e.g. http://localhost:3000/oauth2callback
 *   4. Put these in .env.local:
 *        GOOGLE_CALENDAR_CLIENT_ID=...
 *        GOOGLE_CALENDAR_CLIENT_SECRET=...
 *        GOOGLE_CALENDAR_REDIRECT_URI=http://localhost:3000/oauth2callback
 *
 * Usage:
 *   Step 1 — print the consent URL:   node scripts/get-google-calendar-token.mjs
 *   Step 2 — exchange the ?code=...:  node scripts/get-google-calendar-token.mjs "<code>"
 *
 * Copy the printed refresh_token into GOOGLE_CALENDAR_REFRESH_TOKEN (locally and
 * in Vercel), then re-run `npm run check:config` to confirm.
 */
import fs from "node:fs";
import path from "node:path";

const shellKeys = new Set(Object.keys(process.env));
for (const file of [".env", ".env.local"]) {
  const p = path.join(process.cwd(), file);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !shellKeys.has(m[1])) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

const { google } = await import("googleapis");

const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
const redirectUri =
  process.env.GOOGLE_CALENDAR_REDIRECT_URI || "http://localhost:3000/oauth2callback";

if (!clientId || !clientSecret || /placeholder|your_/i.test(`${clientId}${clientSecret}`)) {
  console.error(
    "✗ Set real GOOGLE_CALENDAR_CLIENT_ID and GOOGLE_CALENDAR_CLIENT_SECRET in .env.local first."
  );
  process.exit(1);
}

const oauth2 = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
const code = process.argv[2];

if (!code) {
  const url = oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // force a refresh_token every time
    scope: ["https://www.googleapis.com/auth/calendar.events"],
  });
  console.log("\n1) Open this URL, approve access:\n");
  console.log(url);
  console.log(
    `\n2) After redirect to ${redirectUri}?code=..., copy the code and run:\n` +
      `   node scripts/get-google-calendar-token.mjs "<code>"\n`
  );
  process.exit(0);
}

try {
  const { tokens } = await oauth2.getToken(code);
  if (!tokens.refresh_token) {
    console.error(
      "✗ No refresh_token returned. Revoke prior access at https://myaccount.google.com/permissions and retry (prompt=consent)."
    );
    process.exit(1);
  }
  console.log("\n✓ Success. Add this to .env.local and Vercel:\n");
  console.log(`GOOGLE_CALENDAR_REFRESH_TOKEN=${tokens.refresh_token}\n`);
} catch (err) {
  console.error("✗ Token exchange failed:", err.message);
  process.exit(1);
}

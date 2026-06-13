import { google } from "googleapis";

/**
 * Google Calendar API Client
 * Uses OAuth2 with refresh token for server-side calendar operations.
 * Falls back gracefully if credentials are not configured.
 */

function getCalendarClient() {
  if (
    !process.env.GOOGLE_CALENDAR_CLIENT_ID ||
    process.env.GOOGLE_CALENDAR_CLIENT_ID.includes("placeholder") ||
    !process.env.GOOGLE_CALENDAR_CLIENT_SECRET ||
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET.includes("placeholder") ||
    !process.env.GOOGLE_CALENDAR_REFRESH_TOKEN ||
    process.env.GOOGLE_CALENDAR_REFRESH_TOKEN.includes("placeholder")
  ) {
    console.warn("[Calendar] Google Calendar credentials not configured (or placeholders)");
    return null;
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CALENDAR_CLIENT_ID,
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
    process.env.GOOGLE_CALENDAR_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_CALENDAR_REFRESH_TOKEN,
  });

  return google.calendar({ version: "v3", auth: oauth2Client });
}

export const calendar = getCalendarClient();

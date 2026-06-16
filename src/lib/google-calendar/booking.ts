import { calendar } from "./client";
import { addMinutes } from "date-fns";

interface BookingParams {
  title: string;
  scheduledAt: Date;
  durationMinutes: number;
  candidateName: string;
  candidateEmail?: string;
  jobRole?: string;
  experience?: string;
}

export async function bookCalendarEvent(params: BookingParams) {
  if (!calendar) {
    console.warn("[Calendar] Skipping booking — calendar not configured");
    return null;
  }

  const { title, scheduledAt, durationMinutes, candidateName, candidateEmail, jobRole, experience } =
    params;
  const endTime = addMinutes(scheduledAt, durationMinutes);

  const formattedDate = scheduledAt.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Kolkata",
  });
  const formattedTime = scheduledAt.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });

  const attendees: Array<{ email: string; displayName: string }> = [];

  if (process.env.RESEND_FROM_EMAIL) {
    attendees.push({
      email: process.env.RESEND_FROM_EMAIL,
      displayName: "Zensar Recruitment",
    });
  }

  if (candidateEmail) {
    attendees.push({
      email: candidateEmail,
      displayName: candidateName,
    });
  }

  try {
    const event = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID || "primary",
      conferenceDataVersion: 1,
      sendUpdates: "all",
      requestBody: {
        summary: title,
        description: `Technical Interview scheduled via Zensar AI Recruitment Bot\n\nCandidate Profile:\n- Name: ${candidateName}\n- Email: ${candidateEmail || "N/A"}\n- Role: ${jobRole || "Software Engineer"}\n- Experience: ${experience || "N/A"}\n\nSchedule:\n- Date: ${formattedDate}\n- Time: ${formattedTime} (IST)\n- Duration: ${durationMinutes} minutes\n\nJoin the Google Meet or Microsoft Teams link attached to this event invitation.`,
        start: {
          dateTime: scheduledAt.toISOString(),
          timeZone: "Asia/Kolkata",
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: "Asia/Kolkata",
        },
        attendees,
        conferenceData: {
          createRequest: {
            requestId: `zensar-${Date.now()}`,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email", minutes: 24 * 60 },
            { method: "popup", minutes: 30 },
          ],
        },
      },
    });

    return event.data;
  } catch (err) {
    const error = err as { code?: number; status?: number };
    if (error.code === 401 || error.status === 401) {
      // Token expired — log clearly
      console.error("Google Calendar token expired. Regenerate refresh token.");
      throw new Error("Calendar auth expired");
    }
    console.error("[Calendar] Failed to book event:", err);
    throw err;
  }
}

export async function checkAvailability(
  date: Date,
  durationMinutes: number
): Promise<boolean> {
  if (!calendar) return true;

  const endTime = addMinutes(date, durationMinutes);

  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: date.toISOString(),
      timeMax: endTime.toISOString(),
      items: [{ id: process.env.GOOGLE_CALENDAR_ID || "primary" }],
    },
  });

  const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";
  const busy = response.data.calendars?.[calendarId]?.busy;

  return !busy || busy.length === 0;
}

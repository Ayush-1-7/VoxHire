import { NextRequest, NextResponse } from "next/server";
import { bookCalendarEvent } from "@/lib/google-calendar/booking";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { scheduledAt, candidateName, candidateEmail } = body;

    if (!scheduledAt || !candidateName || !candidateEmail) {
      return NextResponse.json(
        { error: "Missing required fields: scheduledAt, candidateName, candidateEmail" },
        { status: 400 }
      );
    }

    // Call calendar booking helper
    const event = await bookCalendarEvent({
      title: `Interview - ${candidateName} - Zensar Technologies`,
      scheduledAt: new Date(scheduledAt),
      durationMinutes: 60,
      candidateName,
      candidateEmail,
    });

    return NextResponse.json({
      googleEventId: event?.id || null,
      meetLink: event?.hangoutLink || null,
    });
  } catch (err) {
    const error = err as Error;
    console.error("[Calendar API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to book calendar event" },
      { status: 500 }
    );
  }
}

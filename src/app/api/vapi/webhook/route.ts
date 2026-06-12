import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { extractCandidateData } from "@/lib/vapi/extract-data";
import { sendInterviewConfirmation } from "@/lib/email/resend-client";
import { bookCalendarEvent } from "@/lib/google-calendar/booking";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-vapi-signature");

    if (!verifyWebhookSignature(body, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(body);
    const { message } = payload;

    console.log("[Webhook] Event type:", message?.type);

    switch (message?.type) {
      case "call-started":
        await handleCallStarted(message);
        break;
      case "call-ended":
        await handleCallEnded(message);
        break;
      case "end-of-call-report":
        await handleEndOfCallReport(message);
        break;
      case "assistant-request":
        return NextResponse.json({ assistant: {} });
      default:
        console.log("[Webhook] Unhandled type:", message?.type);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error("[Webhook] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function handleCallStarted(message: { call: { id: string; startedAt?: string } }) {
  const { call } = message;
  await db.call.upsert({
    where: { vapiCallId: call.id },
    create: {
      vapiCallId: call.id,
      status: "IN_PROGRESS",
      startedAt: new Date(call.startedAt || Date.now()),
    },
    update: { status: "IN_PROGRESS" },
  });
}

async function handleCallEnded(message: { call: { id: string; duration?: number } }) {
  const { call } = message;
  await db.call.update({
    where: { vapiCallId: call.id },
    data: {
      status: "COMPLETED",
      endedAt: new Date(),
      duration: call.duration,
    },
  });
}

async function handleEndOfCallReport(message: {
  call: { id: string; duration?: number };
  transcript?: Array<{ role: string; text: string }>;
  summary?: string;
  analysis?: { structuredData?: Record<string, unknown> };
}) {
  const { call, transcript, summary, analysis } = message;

  const candidateData = await extractCandidateData(transcript || [], analysis);

  let candidate = null;

  if (candidateData.email) {
    candidate = await db.candidate.upsert({
      where: { email: candidateData.email },
      create: {
        name: candidateData.name || "Unknown",
        email: candidateData.email,
        phone: candidateData.phone,
        jobRole: candidateData.jobRole,
        experience: candidateData.experience,
        status: "SCREENING",
        notes: candidateData.notes,
        source: "voice-bot",
        consentGiven: true,
      },
      update: {
        name: candidateData.name || undefined,
        phone: candidateData.phone || undefined,
        jobRole: candidateData.jobRole || undefined,
        updatedAt: new Date(),
      },
    });
  } else if (candidateData.name) {
    candidate = await db.candidate.create({
      data: {
        name: candidateData.name,
        phone: candidateData.phone,
        status: "CONTACTED",
        source: "voice-bot",
      },
    });
  }

  await db.call.update({
    where: { vapiCallId: call.id },
    data: {
      candidateId: candidate?.id,
      status: "COMPLETED",
      transcript: transcript as unknown as undefined,
      summary: summary,
      extractedData: candidateData as unknown as undefined,
      duration: call.duration,
      endedAt: new Date(),
    },
  });

  // Schedule interview if date provided and candidate email exists
  if (
    candidateData.preferredInterviewDate &&
    candidate &&
    candidate.email
  ) {
    await scheduleInterview({
      candidate: {
        id: candidate.id,
        name: candidate.name || "Candidate",
        email: candidate.email,
        jobRole: candidate.jobRole || undefined,
        experience: candidate.experience || undefined,
      },
      scheduledAt: new Date(candidateData.preferredInterviewDate),
    });
  }

  // Update daily analytics
  await updateDailyAnalytics();
}

async function scheduleInterview({
  candidate,
  scheduledAt,
}: {
  candidate: { id: string; name: string; email: string | null; jobRole?: string; experience?: string };
  scheduledAt: Date;
}) {
  try {
    let calendarEvent = null;
    const mockMeetLink = `https://teams.live.com/meet/${Math.random().toString(36).substring(2, 12)}`;

    try {
      calendarEvent = await bookCalendarEvent({
        title: `Technical Interview: ${candidate.jobRole || "Software Engineer"} - ${candidate.name} | Zensar Technologies`,
        scheduledAt,
        durationMinutes: 60,
        candidateName: candidate.name,
        candidateEmail: candidate.email || undefined,
        jobRole: candidate.jobRole,
        experience: candidate.experience,
      });
    } catch (calErr) {
      console.error("[Webhook] Google Calendar booking failed, proceeding with local booking:", calErr);
    }

    const meetLink = calendarEvent?.hangoutLink || mockMeetLink;

    const appointment = await db.appointment.create({
      data: {
        candidateId: candidate.id,
        googleEventId: calendarEvent?.id || null,
        googleMeetLink: meetLink,
        scheduledAt,
        durationMinutes: 60,
        status: "SCHEDULED",
      },
    });

    await db.candidate.update({
      where: { id: candidate.id },
      data: { status: "INTERVIEW_SCHEDULED" },
    });

    if (candidate.email) {
      await sendInterviewConfirmation({
        candidateName: candidate.name,
        candidateEmail: candidate.email,
        scheduledAt,
        meetLink,
        jobRole: candidate.jobRole,
        experience: candidate.experience,
      });

      await db.appointment.update({
        where: { id: appointment.id },
        data: { confirmationSent: true },
      });
    }
  } catch (err) {
    console.error("[Webhook] Failed to schedule interview:", err);
  }
}

async function updateDailyAnalytics() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [callCount, newCandidates, scheduledInterviews] = await Promise.all([
    db.call.count({ where: { startedAt: { gte: today } } }),
    db.candidate.count({ where: { createdAt: { gte: today } } }),
    db.appointment.count({
      where: { createdAt: { gte: today }, status: "SCHEDULED" },
    }),
  ]);

  await db.analytics.upsert({
    where: { date: today },
    create: { date: today, callCount, newCandidates, scheduledInterviews },
    update: { callCount, newCandidates, scheduledInterviews },
  });
}

function verifyWebhookSignature(body: string, signature: string | null): boolean {
  if (process.env.NODE_ENV === "development") return true;
  if (!signature || !process.env.VAPI_WEBHOOK_SECRET) return false;
  const expectedSig = crypto
    .createHmac("sha256", process.env.VAPI_WEBHOOK_SECRET)
    .update(body)
    .digest("hex");

  if (signature.length !== expectedSig.length) return false;

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSig)
  );
}

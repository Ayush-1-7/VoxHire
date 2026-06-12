import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { extractCandidateData } from "@/lib/vapi/extract-data";
import { sendInterviewConfirmation } from "@/lib/email/resend-client";
import { bookCalendarEvent } from "@/lib/google-calendar/booking";

/**
 * Client-side call save endpoint.
 * Called by the VoiceAgent/useVapi hook after a call ends, sending the transcript
 * collected by the VAPI SDK on the client.
 *
 * This replaces the webhook flow for local development (since VAPI
 * can't POST to localhost).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { vapiCallId, transcript, duration } = body;

    if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
      return NextResponse.json({ message: "No transcript data" }, { status: 200 });
    }

    // Extract candidate info from transcript
    const candidateData = await extractCandidateData(transcript);

    // Save candidate if we have any identifying information (email, phone, or name)
    let candidate = null;
    if (candidateData.email || candidateData.phone || candidateData.name) {
      if (candidateData.email) {
        candidate = await db.candidate.findFirst({
          where: { email: candidateData.email },
        });
      }

      if (!candidate && candidateData.phone) {
        candidate = await db.candidate.findFirst({
          where: { phone: candidateData.phone },
        });
      }

      const defaultName = candidateData.name || (candidateData.email ? candidateData.email.split('@')[0] : "Applicant");

      if (!candidate) {
        candidate = await db.candidate.create({
          data: {
            name: defaultName,
            email: candidateData.email,
            phone: candidateData.phone,
            jobRole: candidateData.jobRole,
            experience: candidateData.experience,
            source: "voice-bot",
            status: "SCREENING",
            consentGiven: true,
          },
        });
      } else {
        // Update candidate with new info if available
        candidate = await db.candidate.update({
          where: { id: candidate.id },
          data: {
            name: candidateData.name || undefined,
            phone: candidateData.phone || undefined,
            jobRole: candidateData.jobRole || undefined,
            experience: candidateData.experience || undefined,
          },
        });
      }
    }

    // Save call record
    const call = await db.call.create({
      data: {
        vapiCallId: vapiCallId || `local-${Date.now()}`,
        candidateId: candidate ? candidate.id : null,
        status: "COMPLETED",
        duration: duration || 0,
        startedAt: new Date(Date.now() - (duration || 0) * 1000),
        endedAt: new Date(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        transcript: transcript as any,
        summary: candidateData.notes || null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        extractedData: candidateData as any,
      },
    });

    // Schedule interview if preferred date is provided and we have candidate email
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [callCount, newCandidates, scheduledInterviews] = await Promise.all([
      db.call.count({ where: { startedAt: { gte: today } } }),
      db.candidate.count({ where: { createdAt: { gte: today } } }),
      db.appointment.count({
        where: { createdAt: { gte: today }, status: "SCHEDULED" },
      }),
    ]);

    const callsToday = await db.call.findMany({
      where: { startedAt: { gte: today } },
      select: { duration: true }
    });
    const totalDuration = callsToday.reduce((acc, c) => acc + (c.duration || 0), 0);
    const avgDuration = callsToday.length > 0 ? totalDuration / callsToday.length : 0;

    await db.analytics.upsert({
      where: { date: today },
      create: { 
        date: today, 
        callCount, 
        newCandidates, 
        scheduledInterviews,
        avgDuration 
      },
      update: { 
        callCount, 
        newCandidates, 
        scheduledInterviews,
        avgDuration 
      },
    });

    console.log(`[SaveCall] Saved candidate "${candidate ? candidate.name : 'Unknown'}" + call ${call.id}`);

    return NextResponse.json({
      saved: true,
      candidate: candidate ? { id: candidate.id, name: candidate.name } : null,
      call: call.id,
    });
  } catch (err) {
    console.error("[SaveCall] Error:", err);
    return NextResponse.json({ error: "Failed to save call data" }, { status: 500 });
  }
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
      console.error("[SaveCall] Google Calendar booking failed, proceeding with local booking:", calErr);
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
    console.error("[SaveCall] Failed to schedule interview:", err);
  }
}


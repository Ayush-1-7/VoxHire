import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { extractCandidateData } from "@/lib/vapi/extract-data";
import {
  sendCandidateAcknowledgement,
  sendInterviewConfirmation,
} from "@/lib/email/resend-client";
import { bookCalendarEvent } from "@/lib/google-calendar/booking";

/**
 * Shared pipeline for turning a finished VAPI call into persisted data +
 * notifications. Used by BOTH entry points:
 *   - POST /api/vapi/save-call  (client/browser sends the transcript; local dev)
 *   - POST /api/vapi/webhook    (VAPI server "end-of-call-report"; production)
 *
 * Keeping the logic here guarantees the two paths behave identically and stay
 * idempotent if they both fire for the same call.
 */

export type TranscriptEntry = {
  role: string;
  text: string;
};

export type CandidateRecord = {
  id: string;
  name: string | null;
  email: string | null;
  phone?: string | null;
  jobRole?: string | null;
  experience?: string | null;
};

type CandidateData = Awaited<ReturnType<typeof extractCandidateData>>;

type EmailResult =
  | { sent: true; emailId: string | null }
  | { sent: false; reason?: string; error?: string };

export type ProcessCallInput = {
  vapiCallId?: string;
  transcript?: unknown;
  duration?: number;
  startedAt?: unknown;
  endedAt?: unknown;
  summary?: string;
  analysis?: { structuredData?: Record<string, unknown> };
  source: "save-call" | "webhook";
};

export type ProcessCallResult = {
  candidate: CandidateRecord | null;
  candidateData: CandidateData;
  call: { id: string; vapiCallId: string };
  appointment: { id: string; scheduledAt: Date } | null;
  emailResult: EmailResult | null;
  alreadyProcessed: boolean;
};

/**
 * Orchestrates the full post-call flow:
 *   1. extract candidate data from the transcript/analysis
 *   2. save/update the candidate
 *   3. save/update the call (idempotent on vapiCallId)
 *   4. if a preferred date was given -> book calendar + create appointment + confirmation email
 *      otherwise -> send an acknowledgement email
 *   5. refresh daily analytics
 *
 * Emails + booking are skipped if this call was already processed (the other
 * entry point got here first), so the candidate is never double-emailed.
 */
export async function processCompletedCall(
  input: ProcessCallInput
): Promise<ProcessCallResult> {
  const { vapiCallId, source } = input;

  const transcript = normalizeTranscript(input.transcript);
  const candidateData = await extractCandidateData(transcript, input.analysis);
  const candidate = await saveOrUpdateCandidate(candidateData);

  // Idempotency: if a COMPLETED call already exists for this id, another entry
  // point already ran the notification side-effects — don't repeat them.
  const existingCall = vapiCallId
    ? await db.call.findUnique({ where: { vapiCallId } })
    : null;
  const alreadyProcessed = existingCall?.status === "COMPLETED";

  const call = await saveOrUpdateCall({
    vapiCallId,
    candidate,
    transcript,
    candidateData,
    duration: input.duration,
    startedAt: input.startedAt,
    endedAt: input.endedAt,
    summary: input.summary,
  });

  let emailResult: EmailResult | null = null;
  let appointment: { id: string; scheduledAt: Date } | null = null;

  if (alreadyProcessed) {
    emailResult = { sent: false, reason: "already_processed" };
  } else if (candidateData.preferredInterviewDate && candidate?.email) {
    const scheduled = await scheduleInterview({
      candidate,
      scheduledAt: parseDate(candidateData.preferredInterviewDate, new Date()),
      source,
    });
    appointment = scheduled.appointment
      ? { id: scheduled.appointment.id, scheduledAt: scheduled.appointment.scheduledAt }
      : null;
    emailResult = scheduled.emailResult;
  } else if (candidate?.email) {
    emailResult = await sendAcknowledgementEmail(candidate, source);
  }

  await updateDailyAnalytics();

  console.log(
    `[${source}] Processed call ${call.id} for candidate "${candidate?.name ?? "Unknown"}"` +
      (alreadyProcessed ? " (already processed — emails skipped)" : "")
  );

  return {
    candidate,
    candidateData,
    call: { id: call.id, vapiCallId: call.vapiCallId },
    appointment,
    emailResult,
    alreadyProcessed,
  };
}

// ---------------------------------------------------------------------------
// Normalization helpers
// ---------------------------------------------------------------------------

export function normalizeTranscript(value: unknown): TranscriptEntry[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const record = entry as { role?: unknown; text?: unknown };
      const role =
        typeof record.role === "string" && record.role.trim()
          ? record.role.trim()
          : "unknown";
      const text = typeof record.text === "string" ? record.text.trim() : "";
      if (!text) return null;
      return { role, text };
    })
    .filter((entry): entry is TranscriptEntry => Boolean(entry));
}

export function parseDate(value: unknown, fallback: Date): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  if (typeof value === "number" && Number.isFinite(value)) return new Date(value);
  return fallback;
}

function normalizeEmail(value: string | null | undefined): string | null {
  const email = value?.trim().toLowerCase();
  return email || null;
}

function normalizePhone(value: string | null | undefined): string | null {
  const phone = value?.replace(/[^\d+]/g, "");
  return phone && phone.length >= 8 ? phone : null;
}

function nullableToUndefined<T>(value: T | null | undefined): T | undefined {
  return value ?? undefined;
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

async function saveOrUpdateCandidate(
  data: CandidateData
): Promise<CandidateRecord | null> {
  const email = normalizeEmail(data.email);
  const phone = normalizePhone(data.phone);
  const hasIdentifyingInfo = Boolean(data.name || email || phone);

  if (!hasIdentifyingInfo) return null;

  const name = data.name || (email ? email.split("@")[0] : "Applicant");

  const createData: Prisma.CandidateCreateInput = {
    name,
    email,
    phone,
    jobRole: data.jobRole,
    experience: data.experience,
    notes: data.notes,
    source: "voice-bot",
    status: "SCREENING",
    consentGiven: true,
  };

  // Only overwrite fields we actually re-extracted, so a later partial call
  // never clobbers good data (e.g. a real name with the "Applicant" fallback)
  // and never resets the candidate's pipeline status.
  const updateData: Prisma.CandidateUpdateInput = {
    name: data.name || undefined,
    phone: phone || undefined,
    jobRole: data.jobRole || undefined,
    experience: data.experience || undefined,
    notes: data.notes || undefined,
    consentGiven: true,
    updatedAt: new Date(),
  };

  // Email is @unique — upsert is race-safe for the common identifying case.
  if (email) {
    return db.candidate.upsert({
      where: { email },
      create: createData,
      update: updateData,
    });
  }

  const existing = phone
    ? await db.candidate.findFirst({ where: { phone } })
    : null;

  if (existing) {
    return db.candidate.update({ where: { id: existing.id }, data: updateData });
  }

  return db.candidate.create({ data: createData });
}

async function saveOrUpdateCall({
  vapiCallId,
  candidate,
  transcript,
  candidateData,
  duration,
  startedAt,
  endedAt,
  summary,
}: {
  vapiCallId?: string;
  candidate: CandidateRecord | null;
  transcript: TranscriptEntry[];
  candidateData: CandidateData;
  duration?: number;
  startedAt?: unknown;
  endedAt?: unknown;
  summary?: string;
}) {
  const now = new Date();
  const safeDuration =
    typeof duration === "number" && Number.isFinite(duration) ? duration : null;
  const parsedStartedAt = parseDate(
    startedAt,
    new Date(now.getTime() - (safeDuration || 0) * 1000)
  );
  const parsedEndedAt = parseDate(endedAt, now);
  const normalizedVapiCallId =
    typeof vapiCallId === "string" && vapiCallId.trim() ? vapiCallId.trim() : null;
  const callStatus: "COMPLETED" | "NO_ANSWER" =
    transcript.length > 0 ? "COMPLETED" : "NO_ANSWER";

  const callData = {
    candidateId: candidate ? candidate.id : null,
    status: callStatus,
    duration: safeDuration,
    startedAt: parsedStartedAt,
    endedAt: parsedEndedAt,
    transcript: transcript as unknown as Prisma.InputJsonValue,
    summary: candidateData.notes || summary || null,
    extractedData: candidateData as unknown as Prisma.InputJsonValue,
  };

  if (normalizedVapiCallId) {
    return db.call.upsert({
      where: { vapiCallId: normalizedVapiCallId },
      create: { vapiCallId: normalizedVapiCallId, ...callData },
      update: callData,
    });
  }

  return db.call.create({
    data: {
      vapiCallId: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ...callData,
    },
  });
}

// ---------------------------------------------------------------------------
// Scheduling + email
// ---------------------------------------------------------------------------

async function scheduleInterview({
  candidate,
  scheduledAt,
  source,
}: {
  candidate: CandidateRecord;
  scheduledAt: Date;
  source: "save-call" | "webhook";
}) {
  try {
    const existingAppointment = await db.appointment.findFirst({
      where: { candidateId: candidate.id, scheduledAt },
    });

    if (existingAppointment) {
      return {
        appointment: existingAppointment,
        emailResult: { sent: false, reason: "appointment_already_exists" } as EmailResult,
      };
    }

    const candidateName = candidate.name || "Candidate";
    const jobRole = nullableToUndefined(candidate.jobRole);
    const experience = nullableToUndefined(candidate.experience);
    const mockMeetLink = `https://teams.live.com/meet/${Math.random()
      .toString(36)
      .substring(2, 12)}`;

    let calendarEvent = null;
    try {
      calendarEvent = await bookCalendarEvent({
        title: `Technical Interview: ${jobRole || "Software Engineer"} - ${candidateName} | Zensar Technologies`,
        scheduledAt,
        durationMinutes: 60,
        candidateName,
        candidateEmail: nullableToUndefined(candidate.email),
        jobRole,
        experience,
      });
    } catch (calErr) {
      console.error(
        `[${source}] Google Calendar booking failed, proceeding with local booking:`,
        calErr
      );
    }

    const meetLink = calendarEvent?.hangoutLink || mockMeetLink;

    const appointment = await db.appointment.create({
      data: {
        candidateId: candidate.id,
        scheduledAt,
        durationMinutes: 60,
        status: "SCHEDULED",
        title: `Technical Interview: ${jobRole || "Software Engineer"} - ${candidateName} | Zensar Technologies`,
        googleEventId: calendarEvent?.id || null,
        googleMeetLink: meetLink,
      },
    });

    await db.candidate.update({
      where: { id: candidate.id },
      data: { status: "INTERVIEW_SCHEDULED" },
    });

    const emailResult: EmailResult = candidate.email
      ? await sendInterviewConfirmation({
          candidateName,
          candidateEmail: candidate.email,
          scheduledAt,
          meetLink,
          jobRole,
          experience,
        })
          .then((dataResult) => ({
            sent: true as const,
            emailId: dataResult?.id || null,
          }))
          .catch((err) => {
            console.error(
              `[${source}] Failed to send interview confirmation email:`,
              err
            );
            return {
              sent: false as const,
              error: err instanceof Error ? err.message : "Email send failed",
            };
          })
      : { sent: false, reason: "missing_email" };

    if (emailResult.sent) {
      await db.appointment.update({
        where: { id: appointment.id },
        data: { confirmationSent: true },
      });
    }

    return { appointment, emailResult };
  } catch (err) {
    console.error(`[${source}] Failed to schedule interview:`, err);
    return {
      appointment: null,
      emailResult: {
        sent: false,
        error: err instanceof Error ? err.message : "Scheduling failed",
      } as EmailResult,
    };
  }
}

async function sendAcknowledgementEmail(
  candidate: CandidateRecord,
  source: "save-call" | "webhook"
): Promise<EmailResult> {
  return sendCandidateAcknowledgement({
    candidateName: candidate.name || "Candidate",
    candidateEmail: candidate.email!,
    jobRole: nullableToUndefined(candidate.jobRole),
    experience: nullableToUndefined(candidate.experience),
    phone: nullableToUndefined(candidate.phone),
  })
    .then((dataResult) => ({ sent: true as const, emailId: dataResult?.id || null }))
    .catch((err) => {
      console.error(`[${source}] Failed to send acknowledgement email:`, err);
      return {
        sent: false as const,
        error: err instanceof Error ? err.message : "Email send failed",
      };
    });
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

  const callsToday = await db.call.findMany({
    where: { startedAt: { gte: today } },
    select: { duration: true },
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
      avgDuration,
    },
    update: {
      callCount,
      newCandidates,
      scheduledInterviews,
      avgDuration,
    },
  });
}

import { NextRequest, NextResponse } from "next/server";
import { processCompletedCall } from "@/lib/vapi/process-call";

/**
 * Client-side call save endpoint.
 * Called by the VoiceAgent/useVapi hook after a call ends, sending the
 * transcript collected by the VAPI SDK in the browser.
 *
 * This is the primary path for local development (VAPI's server webhook can't
 * POST to localhost). The actual work is shared with the webhook via
 * processCompletedCall(), which is idempotent on vapiCallId.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { vapiCallId, transcript, duration, startedAt, endedAt } = body;

    const result = await processCompletedCall({
      vapiCallId,
      transcript,
      duration,
      startedAt,
      endedAt,
      source: "save-call",
    });

    return NextResponse.json({
      saved: true,
      candidate: result.candidate
        ? {
            id: result.candidate.id,
            name: result.candidate.name,
            email: result.candidate.email,
            phone: result.candidateData.phone,
            jobRole: result.candidateData.jobRole,
            experience: result.candidateData.experience,
          }
        : null,
      call: result.call.id,
      appointment: result.appointment,
      email: result.emailResult,
      extractedData: result.candidateData,
    });
  } catch (err) {
    console.error("[SaveCall] Error:", err);
    return NextResponse.json({ error: "Failed to save call" }, { status: 500 });
  }
}

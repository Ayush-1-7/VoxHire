import { NextRequest, NextResponse } from "next/server";
import { sendInterviewConfirmation } from "@/lib/email/resend-client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { candidateName, candidateEmail, scheduledAt, meetLink } = body;

    if (!candidateEmail) {
      return NextResponse.json({ error: "candidateEmail is required" }, { status: 400 });
    }

    const res = await sendInterviewConfirmation({
      candidateName: candidateName || "Test User",
      candidateEmail,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
      meetLink: meetLink || undefined,
    });

    return NextResponse.json({ success: true, response: res });
  } catch (err) {
    const error = err as Error;
    console.error("[Email API] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to send email" }, { status: 500 });
  }
}

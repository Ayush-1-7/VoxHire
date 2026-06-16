import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { parseDate, processCompletedCall } from "@/lib/vapi/process-call";

/**
 * VAPI server-side webhook (production path).
 * The heavy "end-of-call-report" work is shared with the client save-call
 * endpoint via processCompletedCall(), which is idempotent on vapiCallId — so
 * even if both fire for the same call, the candidate is saved/emailed once.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();

    if (!verifyVapiAuth(body, req.headers.get("x-vapi-secret"), req.headers.get("x-vapi-signature"))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function handleCallStarted(message: { call: { id: string; startedAt?: string } }) {
  const { call } = message;
  await db.call.upsert({
    where: { vapiCallId: call.id },
    create: {
      vapiCallId: call.id,
      status: "IN_PROGRESS",
      startedAt: parseDate(call.startedAt, new Date()),
    },
    update: { status: "IN_PROGRESS" },
  });
}

async function handleCallEnded(message: { call: { id: string; duration?: number } }) {
  const { call } = message;
  await db.call.upsert({
    where: { vapiCallId: call.id },
    create: {
      vapiCallId: call.id,
      status: "COMPLETED",
      duration: typeof call.duration === "number" ? call.duration : null,
      endedAt: new Date(),
    },
    update: {
      status: "COMPLETED",
      duration: typeof call.duration === "number" ? call.duration : null,
      endedAt: new Date(),
    },
  });
}

async function handleEndOfCallReport(message: {
  call: { id: string; duration?: number; startedAt?: string; endedAt?: string };
  transcript?: Array<{ role: string; text: string }>;
  summary?: string;
  analysis?: { structuredData?: Record<string, unknown> };
}) {
  const { call, transcript, summary, analysis } = message;

  return processCompletedCall({
    vapiCallId: call.id,
    transcript,
    duration: call.duration,
    startedAt: call.startedAt,
    endedAt: call.endedAt,
    summary,
    analysis,
    source: "webhook",
  });
}

/** Constant-time string equality that tolerates differing lengths. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/**
 * Verify a VAPI server message. VAPI's standard scheme is a plain shared secret
 * sent in the `x-vapi-secret` header (compared for equality). We also accept an
 * HMAC-SHA256 of the body in `x-vapi-signature` as a fallback. Verification is
 * skipped only in development.
 */
function verifyVapiAuth(
  body: string,
  secretHeader: string | null,
  signatureHeader: string | null
): boolean {
  if (process.env.NODE_ENV === "development") return true;

  const secret = process.env.VAPI_WEBHOOK_SECRET;
  // Treat unset/placeholder secrets as misconfiguration → reject in production.
  if (!secret || /placeholder|your_/i.test(secret)) return false;

  // Primary: plain shared secret header (VAPI default).
  if (secretHeader && safeEqual(secretHeader, secret)) return true;

  // Fallback: HMAC-SHA256 of the raw body, hex-encoded.
  if (signatureHeader) {
    const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
    if (safeEqual(signatureHeader, expected)) return true;
  }

  return false;
}

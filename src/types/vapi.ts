// TypeScript type definitions for VAPI

export interface VapiMessage {
  type: string;
  transcriptType?: "partial" | "final";
  transcript?: string;
  role?: "user" | "assistant";
  call?: {
    id: string;
    startedAt?: string;
    endedAt?: string;
    duration?: number;
  };
}

export interface TranscriptEntry {
  role: "user" | "assistant" | "system";
  text: string;
  timestamp: Date;
}

export type CallStatus =
  | "idle"
  | "connecting"
  | "active"
  | "ending"
  | "ended"
  | "error";

export interface VapiWebhookPayload {
  message: {
    type:
      | "call-started"
      | "call-ended"
      | "end-of-call-report"
      | "assistant-request"
      | "status-update"
      | "transcript";
    call?: {
      id: string;
      startedAt?: string;
      endedAt?: string;
      duration?: number;
    };
    transcript?: Array<{
      role: string;
      text: string;
    }>;
    summary?: string;
    analysis?: {
      structuredData?: Record<string, unknown>;
    };
  };
}

export interface ExtractedCandidateData {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  jobRole?: string | null;
  experience?: string | null;
  preferredInterviewDate?: string | null;
  notes?: string | null;
}

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Vapi from "@vapi-ai/web";
import { useCallStore } from "@/store/callStore";
import type { TranscriptEntry, CallStatus, VapiMessage } from "@/types/vapi";

// Singleton VAPI instance
let vapiInstance: Vapi | null = null;

function getVapiInstance(): Vapi {
  if (!vapiInstance) {
    const apiKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    if (!apiKey) {
      throw new Error("VAPI public key is not configured");
    }
    vapiInstance = new Vapi(apiKey);
  }
  return vapiInstance;
}

export function useVapi() {
  const vapi = getVapiInstance();

  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  const [volumeLevel, setVolumeLevel] = useState(0);

  const callStartTime = useRef<Date | null>(null);
  const transcriptRef = useRef<TranscriptEntry[]>([]);
  const currentCallIdRef = useRef<string | null>(null);
  const { setActiveCall, clearActiveCall } = useCallStore();

  useEffect(() => {
    const handleCallStart = () => {
      setCallStatus("active");
      setError(null);
      callStartTime.current = new Date();
      transcriptRef.current = [];
      currentCallIdRef.current = null;
    };

    const handleCallEnd = async () => {
      setCallStatus("ended");
      setIsSpeaking(false);
      setVolumeLevel(0);
      clearActiveCall();

      const duration = callStartTime.current
        ? Math.round((new Date().getTime() - callStartTime.current.getTime()) / 1000)
        : 0;

      const vapiCallId = currentCallIdRef.current;
      const transcriptData = transcriptRef.current;

      if (transcriptData.length > 0) {
        try {
          console.log("[useVapi] Saving call ending transcript:", transcriptData);
          const response = await fetch("/api/vapi/save-call", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              vapiCallId,
              transcript: transcriptData,
              duration,
            }),
          });
          if (!response.ok) {
            console.error("[useVapi] Failed to save call:", await response.text());
          } else {
            console.log("[useVapi] Call saved successfully:", await response.json());
          }
        } catch (err) {
          console.error("[useVapi] Error saving call:", err);
        }
      } else {
        console.log("[useVapi] No transcript to save");
      }
    };

    const handleSpeechStart = () => setIsSpeaking(true);
    const handleSpeechEnd = () => setIsSpeaking(false);

    const handleMessage = (message: VapiMessage) => {
      if (
        message.type === "transcript" &&
        message.transcriptType === "final" &&
        message.transcript &&
        message.role
      ) {
        const entry: TranscriptEntry = {
          role: message.role,
          text: message.transcript,
          timestamp: new Date(),
        };
        setTranscript((prev) => {
          const updated = [...prev, entry];
          transcriptRef.current = updated;
          return updated;
        });
      }

      if (message.type === "call-update" && message.call?.id) {
        setCurrentCallId(message.call.id);
        currentCallIdRef.current = message.call.id;
        setActiveCall(message.call.id);
      }
    };

    const handleVolumeLevel = (level: number) => setVolumeLevel(level);

    const handleError = (err: unknown) => {
      console.error("[VAPI] Error:", err);
      setError(getErrorMessage(err));
      setCallStatus("error");
      setIsSpeaking(false);
      clearActiveCall();
    };

    vapi.on("call-start", handleCallStart);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vapi.on("call-end", handleCallEnd as any);
    vapi.on("speech-start", handleSpeechStart);
    vapi.on("speech-end", handleSpeechEnd);
    vapi.on("message", handleMessage as (msg: unknown) => void);
    vapi.on("volume-level", handleVolumeLevel);
    vapi.on("error", handleError as (err: unknown) => void);

    return () => {
      vapi.off("call-start", handleCallStart);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vapi.off("call-end", handleCallEnd as any);
      vapi.off("speech-start", handleSpeechStart);
      vapi.off("speech-end", handleSpeechEnd);
      vapi.off("message", handleMessage as (msg: unknown) => void);
      vapi.off("volume-level", handleVolumeLevel);
      vapi.off("error", handleError as (err: unknown) => void);
    };
  }, [clearActiveCall, setActiveCall, vapi]);

  const startCall = useCallback(async () => {
    setCallStatus("connecting");
    setTranscript([]);
    transcriptRef.current = [];
    currentCallIdRef.current = null;
    setError(null);

    try {
      const rateLimitCheck = await fetch("/api/vapi/token", {
        method: "POST",
      });

      if (!rateLimitCheck.ok) {
        const data = await rateLimitCheck.json();
        throw new Error(data.error || "Rate limit exceeded");
      }

      await vapi.start(process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to start call";
      setError(message);
      setCallStatus("error");
    }
  }, [vapi]);

  const stopCall = useCallback(() => {
    setCallStatus("ending");
    vapi.stop();
  }, [vapi]);

  const resetCall = useCallback(() => {
    setCallStatus("idle");
    setTranscript([]);
    transcriptRef.current = [];
    currentCallIdRef.current = null;
    setError(null);
    setCurrentCallId(null);
  }, []);

  const toggleMute = useCallback(() => {
    if (callStatus === "active") {
      vapi.setMuted(!vapi.isMuted);
    }
  }, [callStatus, vapi]);

  return {
    callStatus,
    isSpeaking,
    transcript,
    error,
    currentCallId,
    volumeLevel,
    startCall,
    stopCall,
    resetCall,
    toggleMute,
    isCallActive: callStatus === "active",
    isConnecting: callStatus === "connecting",
  };
}

function getErrorMessage(err: unknown): string {
  const message =
    err instanceof Error
      ? err.message
      : typeof err === "object" && err !== null && "message" in err
        ? String((err as { message?: unknown }).message ?? "")
        : String(err ?? "");

  const lower = message.toLowerCase();
  if (lower.includes("microphone")) {
    return "Microphone access denied. Please allow microphone and refresh.";
  }
  if (lower.includes("network")) {
    return "Network error. Please check your connection.";
  }
  if (lower.includes("rate limit")) {
    return "Too many calls. Please wait a moment.";
  }
  return message || "Connection failed. Please try again.";
}

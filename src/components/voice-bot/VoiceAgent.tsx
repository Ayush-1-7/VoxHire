"use client";

import { useVapi } from "@/hooks/useVapi";
import { AudioVisualizer } from "./AudioVisualizer";
import { CallControls } from "./CallControls";
import { TranscriptDisplay } from "./TranscriptDisplay";
import { cn, formatDuration } from "@/lib/utils";
import { useState, useEffect } from "react";

const CONVERSATION_STEPS = [
  { step: "collect_name", label: "Full Name", icon: "👤" },
  { step: "collect_phone", label: "Phone Number", icon: "📱" },
  { step: "collect_email", label: "Email Address", icon: "✉️" },
  { step: "confirm_interest", label: "Interest Area", icon: "💼" },
  { step: "company_info", label: "Company Overview", icon: "🏢" },
  { step: "schedule_interview", label: "Schedule Interview", icon: "📅" },
  { step: "confirmation", label: "Confirmation", icon: "✅" },
];

export function VoiceAgent() {
  const {
    callStatus,
    transcript,
    error,
    volumeLevel,
    startCall,
    stopCall,
    resetCall,
    toggleMute,
    isCallActive,
  } = useVapi();

  const [elapsed, setElapsed] = useState(0);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isMuted, setIsMuted] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isCallActive) {
      setElapsed(0);
      interval = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    } else {
      if (callStatus === "idle") setElapsed(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCallActive, callStatus]);

  // Step detection from transcript
  useEffect(() => {
    if (transcript.length === 0) {
      setCurrentStep(-1);
      return;
    }
    const lastAssistant = [...transcript]
      .reverse()
      .find((t) => t.role === "assistant");
    if (!lastAssistant) return;

    const text = lastAssistant.text.toLowerCase();
    const stepKeywords = [
      { keywords: ["your name", "full name", "may i know your name"], step: 0 },
      { keywords: ["phone number", "phone", "contact number", "reach you"], step: 1 },
      { keywords: ["email", "email address"], step: 2 },
      { keywords: ["application", "opportunities", "interest", "calling regarding"], step: 3 },
      { keywords: ["zensar is", "zensar technologies", "about zensar", "our company"], step: 4 },
      { keywords: ["schedule", "interview", "assessment", "preferred date"], step: 5 },
      { keywords: ["scheduled", "confirmation", "confirmed", "confirmation email"], step: 6 },
    ];

    for (const { keywords, step } of stepKeywords) {
      if (keywords.some((kw) => text.includes(kw)) && step > currentStep) {
        setCurrentStep(step);
        break;
      }
    }
  }, [transcript, currentStep]);

  const handleToggleMute = () => {
    toggleMute();
    setIsMuted(!isMuted);
  };

  const statusLabel =
    callStatus === "connecting"
      ? "Connecting..."
      : isCallActive
        ? "Call in progress — speak freely"
        : callStatus === "ended"
          ? "Call ended. Thank you!"
          : callStatus === "error"
            ? error || "An error occurred"
            : "Click to start a conversation";

  return (
    <div className="space-y-8">
      {/* Voice Card */}
      <div
        className={cn(
          "glass rounded-3xl p-10 transition-all duration-300",
          isCallActive && "border-primary/30 shadow-glow"
        )}
      >
        {!consentGiven ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">🔒</span>
            </div>
            <h3 className="font-heading text-lg font-bold mb-3 text-foreground">Consent & Data Recording</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-6 leading-relaxed">
              Zensar Technologies uses an AI voice assistant to screen candidates.
              By proceeding, you consent to the recording of your voice call, transcript generation,
              and the extraction of recruitment details (name, email, phone) to update your profile.
            </p>
            <button
              onClick={() => setConsentGiven(true)}
              className="px-6 py-2.5 rounded-full bg-gradient-brand text-white text-xs font-semibold hover:opacity-90 shadow-glow-sm hover:shadow-glow transition-all cursor-pointer border-none"
              id="agree-button"
            >
              I Agree & Consent
            </button>
          </div>
        ) : (
          <>
            <AudioVisualizer
              isActive={isCallActive}
              volumeLevel={volumeLevel}
            />

            <CallControls
              callStatus={callStatus}
              isMuted={isMuted}
              onStart={startCall}
              onStop={stopCall}
              onToggleMute={handleToggleMute}
            />

            <p
              className={cn(
                "text-sm text-center mb-1 transition-colors",
                isCallActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              {statusLabel}
            </p>

            <p
              className={cn(
                "text-xs text-center font-mono text-muted-foreground/60 tabular-nums transition-opacity",
                isCallActive ? "opacity-100" : "opacity-0"
              )}
            >
              {formatDuration(elapsed)}
            </p>

            {callStatus === "ended" && (
              <div className="text-center mt-4">
                <button
                  onClick={resetCall}
                  className="text-sm text-primary hover:text-primary/80 underline underline-offset-4 transition-colors"
                >
                  Start a new call
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Transcript + Steps Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TranscriptDisplay transcript={transcript} isActive={isCallActive} />

        {/* Conversation Steps */}
        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <span className="text-lg">📋</span>
            <h3 className="font-heading font-semibold text-foreground">
              Conversation Flow
            </h3>
          </div>
          <div className="flex flex-col gap-1">
            {CONVERSATION_STEPS.map((step, i) => (
              <div
                key={step.step}
                className={cn(
                  "flex items-center gap-3.5 px-4 py-3.5 rounded-lg border border-transparent transition-all",
                  i === currentStep &&
                    "bg-primary/10 border-primary/20",
                  i < currentStep && "opacity-50"
                )}
              >
                <span
                  className={cn(
                    "w-9 h-9 flex items-center justify-center rounded-lg text-lg border",
                    i === currentStep
                      ? "bg-primary/10 border-primary/20"
                      : i < currentStep
                        ? "bg-success-bg border-success/20"
                        : "bg-muted/30 border-border"
                  )}
                >
                  {step.icon}
                </span>
                <span className="text-sm font-medium text-foreground flex-1">
                  {step.label}
                </span>
                <span className="text-[0.7rem] text-muted-foreground/60 font-medium">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

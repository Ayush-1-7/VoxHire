"use client";

import { useVapi } from "@/hooks/useVapi";
import { AudioVisualizer } from "./AudioVisualizer";
import { CallControls } from "./CallControls";
import { TranscriptDisplay } from "./TranscriptDisplay";
import { cn, formatDuration } from "@/lib/utils";
import { useState, useEffect } from "react";
import {
  User,
  Phone,
  Mail,
  Briefcase,
  Building2,
  CalendarCheck,
  CheckCircle2,
  Lock,
  ShieldCheck,
  ListChecks,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const CONVERSATION_STEPS = [
  { step: "collect_name", label: "Full name", icon: User },
  { step: "collect_phone", label: "Phone number", icon: Phone },
  { step: "collect_email", label: "Email address", icon: Mail },
  { step: "confirm_interest", label: "Interest area", icon: Briefcase },
  { step: "company_info", label: "Company overview", icon: Building2 },
  { step: "schedule_interview", label: "Schedule interview", icon: CalendarCheck },
  { step: "confirmation", label: "Confirmation", icon: CheckCircle2 },
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

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isCallActive) {
      setElapsed(0);
      interval = setInterval(() => setElapsed((p) => p + 1), 1000);
    } else if (callStatus === "idle") {
      setElapsed(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCallActive, callStatus]);

  useEffect(() => {
    if (transcript.length === 0) {
      setCurrentStep(-1);
      return;
    }
    const lastAssistant = [...transcript].reverse().find((t) => t.role === "assistant");
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
      ? "Connecting…"
      : isCallActive
        ? "Listening — speak freely"
        : callStatus === "ended"
          ? "Call ended. Thank you!"
          : callStatus === "error"
            ? error || "Something went wrong"
            : "Tap to start the conversation";

  return (
    <div className="space-y-6">
      {/* Voice card */}
      <div
        className={cn(
          "rounded-2xl border bg-card p-8 shadow-sm transition-all duration-300 sm:p-10",
          isCallActive ? "border-primary/40 shadow-md" : "border-border"
        )}
      >
        {!consentGiven ? (
          <div className="mx-auto max-w-md py-2 text-center">
            <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-xl border border-border bg-muted">
              <Lock className="size-5 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold tracking-tight">Consent to continue</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
              This AI assistant records the call, generates a transcript, and extracts your
              details (name, email, phone) to build your candidate profile.
            </p>
            <Button className="mt-6" onClick={() => setConsentGiven(true)} id="agree-button">
              <ShieldCheck className="size-4" />
              I agree &amp; consent
            </Button>
          </div>
        ) : (
          <>
            <AudioVisualizer isActive={isCallActive} volumeLevel={volumeLevel} />
            <CallControls
              callStatus={callStatus}
              isMuted={isMuted}
              onStart={startCall}
              onStop={stopCall}
              onToggleMute={handleToggleMute}
            />
            <p className={cn("mb-1 text-center text-sm transition-colors", isCallActive ? "text-foreground" : "text-muted-foreground")}>
              {statusLabel}
            </p>
            <p className={cn("text-center font-mono text-xs tabular-nums text-muted-foreground transition-opacity", isCallActive ? "opacity-100" : "opacity-0")}>
              {formatDuration(elapsed)}
            </p>
            {callStatus === "ended" && (
              <div className="mt-4 text-center">
                <Button variant="link" size="sm" onClick={resetCall}>
                  Start a new call
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Transcript + flow */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <TranscriptDisplay transcript={transcript} isActive={isCallActive} />

        <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <div className="mb-4 flex items-center gap-2">
            <ListChecks className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold tracking-tight">Conversation flow</h3>
          </div>
          <div className="space-y-1">
            {CONVERSATION_STEPS.map((step, i) => {
              const active = i === currentStep;
              const done = i < currentStep;
              return (
                <div
                  key={step.step}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 transition-colors",
                    active && "border-primary/20 bg-primary/[0.06]"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-lg border transition-colors",
                      active
                        ? "border-primary/20 bg-primary/10 text-primary"
                        : done
                          ? "border-success/20 bg-success/10 text-success"
                          : "border-border bg-muted text-muted-foreground"
                    )}
                  >
                    {done ? <Check className="size-4" /> : <step.icon className="size-4" />}
                  </span>
                  <span className={cn("flex-1 text-sm font-medium", !active && !done && "text-muted-foreground", done && "text-muted-foreground/70")}>
                    {step.label}
                  </span>
                  <span className="font-mono text-2xs text-muted-foreground/60 tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

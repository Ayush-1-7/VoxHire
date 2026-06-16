"use client";

import { cn } from "@/lib/utils";
import { Phone, X, Mic, MicOff, Loader2 } from "lucide-react";
import type { CallStatus } from "@/types/vapi";

interface CallControlsProps {
  callStatus: CallStatus;
  isMuted?: boolean;
  onStart: () => void;
  onStop: () => void;
  onToggleMute?: () => void;
}

export function CallControls({
  callStatus,
  isMuted = false,
  onStart,
  onStop,
  onToggleMute,
}: CallControlsProps) {
  const isActive = callStatus === "active";
  const isConnecting = callStatus === "connecting";
  const isEnding = callStatus === "ending";

  return (
    <div className="mb-4 flex items-center justify-center gap-4">
      {/* Main call button */}
      <button
        onClick={isActive || isEnding ? onStop : onStart}
        disabled={isConnecting || isEnding}
        className={cn(
          "relative flex size-[68px] items-center justify-center rounded-full text-white transition-all duration-300",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          isActive
            ? "bg-destructive shadow-md hover:scale-105 active:scale-95"
            : isConnecting || isEnding
              ? "bg-warning"
              : "bg-primary shadow-sm hover:scale-105 hover:shadow-md active:scale-95"
        )}
        aria-label={isActive ? "End call" : "Start call"}
        id="call-button"
      >
        {isActive && <span className="pulse-ring absolute inset-0 rounded-full" />}
        {isConnecting ? (
          <Loader2 className="relative z-10 size-6 animate-spin" />
        ) : isActive || isEnding ? (
          <X className="relative z-10 size-6" strokeWidth={2.5} />
        ) : (
          <Phone className="relative z-10 size-6" />
        )}
      </button>

      {/* Mute button */}
      <button
        onClick={onToggleMute}
        disabled={!isActive}
        className={cn(
          "flex size-11 items-center justify-center rounded-full border transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          !isActive
            ? "cursor-not-allowed border-border bg-muted text-muted-foreground opacity-40"
            : isMuted
              ? "border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20"
              : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
        )}
        aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
        id="mute-button"
      >
        {isMuted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
      </button>
    </div>
  );
}

"use client";

import { cn } from "@/lib/utils";
import { Phone, X, Mic, MicOff } from "lucide-react";
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
    <div className="flex items-center justify-center gap-5 mb-4">
      {/* Main Call Button */}
      <button
        onClick={isActive || isEnding ? onStop : onStart}
        disabled={isConnecting || isEnding}
        className={cn(
          "relative w-[72px] h-[72px] rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer border-none",
          isActive
            ? "bg-gradient-to-br from-red-500 to-red-600 shadow-[0_4px_24px_rgba(239,68,68,0.3)] hover:scale-105"
            : isConnecting
              ? "bg-gradient-to-br from-amber-500 to-amber-600 shadow-[0_4px_24px_rgba(245,158,11,0.3)] animate-pulse"
              : "bg-gradient-brand shadow-glow-sm hover:scale-108 hover:shadow-glow active:scale-95"
        )}
        aria-label={isActive ? "End call" : "Start call"}
        id="call-button"
      >
        {/* Pulse ring for active calls */}
        {isActive && (
          <span className="absolute inset-[-4px] rounded-full bg-gradient-to-br from-red-500 to-red-600 animate-pulse-ring" />
        )}

        {isActive || isEnding ? (
          <X className="w-7 h-7 text-white relative z-10" strokeWidth={2.5} />
        ) : (
          <Phone className="w-7 h-7 text-white relative z-10" />
        )}
      </button>

      {/* Mute Button */}
      <button
        onClick={onToggleMute}
        disabled={!isActive}
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-300",
          !isActive
            ? "opacity-30 cursor-not-allowed bg-muted/30 border-border text-muted-foreground"
            : isMuted
              ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
              : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/50 hover:border-primary/30 hover:text-foreground"
        )}
        aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
        id="mute-button"
      >
        {isMuted ? (
          <MicOff className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </button>
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { TranscriptEntry } from "@/types/vapi";

interface TranscriptDisplayProps {
  transcript: TranscriptEntry[];
  isActive: boolean;
}

export function TranscriptDisplay({ transcript, isActive }: TranscriptDisplayProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <span className="text-lg">💬</span>
          <h3 className="font-heading font-semibold text-foreground">Live Transcript</h3>
        </div>
        <span
          className={cn(
            "flex items-center gap-1.5 text-[0.7rem] font-semibold tracking-wider px-2.5 py-1 rounded-full border transition-all",
            isActive
              ? "text-red-400 bg-red-500/10 border-red-500/20"
              : "text-muted-foreground bg-muted/50 border-border"
          )}
        >
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full bg-current",
              isActive && "animate-pulse-dot"
            )}
          />
          LIVE
        </span>
      </div>

      <div
        ref={scrollRef}
        className="min-h-[300px] max-h-[420px] overflow-y-auto custom-scrollbar scroll-smooth pr-2"
      >
        {transcript.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 h-[200px] text-muted-foreground text-sm text-center">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="opacity-30"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p>Start a call to see the live transcript here</p>
          </div>
        ) : (
          transcript.map((entry, i) => (
            <div key={i} className="flex gap-3 mb-4 animate-msg-in">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5 border",
                  entry.role === "assistant"
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "bg-success-bg text-success border-success/20"
                )}
              >
                {entry.role === "assistant" ? "ZR" : "You"}
              </div>
              <div className="flex-1">
                <p className="text-[0.7rem] font-semibold tracking-wider uppercase text-muted-foreground mb-1">
                  {entry.role === "assistant" ? "Zensar Assistant" : "You"}
                </p>
                <p
                  className={cn(
                    "text-sm leading-relaxed p-2.5 rounded-lg border",
                    entry.role === "assistant"
                      ? "bg-primary/5 border-primary/10"
                      : "bg-muted/30 border-border"
                  )}
                >
                  {entry.text}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

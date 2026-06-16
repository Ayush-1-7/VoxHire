"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { MessagesSquare } from "lucide-react";
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
    <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessagesSquare className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold tracking-tight">Live transcript</h3>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-2xs font-medium uppercase tracking-wide transition-colors",
            isActive
              ? "border-destructive/20 bg-destructive/10 text-destructive"
              : "border-border bg-muted text-muted-foreground"
          )}
        >
          <span className={cn("size-1.5 rounded-full bg-current", isActive && "animate-pulse-dot")} />
          Live
        </span>
      </div>

      <div
        ref={scrollRef}
        className="max-h-[420px] min-h-[300px] overflow-y-auto scroll-smooth pr-1 custom-scrollbar"
      >
        {transcript.length === 0 ? (
          <div className="flex h-[240px] flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
            <div className="flex size-11 items-center justify-center rounded-xl border border-border bg-muted">
              <MessagesSquare className="size-5 opacity-60" />
            </div>
            <p>Start a call to see the live transcript.</p>
          </div>
        ) : (
          transcript.map((entry, i) => {
            const isAssistant = entry.role === "assistant";
            return (
              <div key={i} className="mb-4 flex animate-fade-up gap-3">
                <div
                  className={cn(
                    "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border text-2xs font-semibold",
                    isAssistant
                      ? "border-primary/20 bg-primary/10 text-primary"
                      : "border-success/20 bg-success/10 text-success"
                  )}
                >
                  {isAssistant ? "AI" : "You"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-2xs font-medium uppercase tracking-wide text-muted-foreground">
                    {isAssistant ? "AI Recruiter" : "You"}
                  </p>
                  <p
                    className={cn(
                      "rounded-lg border p-2.5 text-sm leading-relaxed",
                      isAssistant ? "border-primary/10 bg-primary/[0.04]" : "border-border bg-muted/40"
                    )}
                  >
                    {entry.text}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

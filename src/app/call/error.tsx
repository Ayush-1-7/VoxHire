"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function CallError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[CallPageErrorBoundary] Error caught:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <div className="glass max-w-md w-full p-8 text-center space-y-4 rounded-xl border border-destructive/20 shadow-lg">
        <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
        <h2 className="font-heading text-lg font-bold text-foreground">Voice Interface Error</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          An error occurred while loading the voice calling assistant. Please verify your microphone connection and try again.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/95 transition-colors cursor-pointer border-none"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted text-xs font-semibold transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}

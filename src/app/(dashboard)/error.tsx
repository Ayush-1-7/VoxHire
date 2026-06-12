"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[DashboardErrorBoundary] Error caught:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <div className="glass max-w-md w-full p-8 text-center space-y-4 rounded-xl border border-destructive/20 shadow-lg">
        <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
        <h2 className="font-heading text-lg font-bold text-foreground">Something went wrong</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          An unexpected error occurred while loading this dashboard section. Please try again.
        </p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/95 transition-colors cursor-pointer border-none"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

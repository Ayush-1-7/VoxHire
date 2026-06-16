"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function CallError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[CallPageErrorBoundary]", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <EmptyState
        className="w-full"
        icon={AlertTriangle}
        title="Voice interface error"
        description="We couldn't load the voice assistant. Check your microphone permissions and try again."
        action={
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => reset()}>
              <RotateCw className="size-4" /> Try again
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/">
                <Home className="size-4" /> Home
              </Link>
            </Button>
          </div>
        }
      />
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[DashboardErrorBoundary]", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md py-16">
      <EmptyState
        icon={AlertTriangle}
        title="Something went wrong"
        description="An unexpected error occurred while loading this section. Please try again."
        action={
          <Button size="sm" onClick={() => reset()}>
            <RotateCw className="size-4" /> Try again
          </Button>
        }
      />
    </div>
  );
}

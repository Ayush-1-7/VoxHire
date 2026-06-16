"use client";

import { useTheme } from "next-themes";
import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  const { resolvedTheme } = useTheme();

  return (
    <SonnerToaster
      theme={(resolvedTheme as "light" | "dark") ?? "dark"}
      position="bottom-right"
      gap={10}
      toastOptions={{
        classNames: {
          toast:
            "group rounded-lg border border-border bg-popover text-popover-foreground shadow-lg",
          title: "text-sm font-medium",
          description: "text-sm text-muted-foreground",
          actionButton: "rounded-md bg-primary text-primary-foreground text-xs px-2 h-7",
          cancelButton: "rounded-md bg-muted text-muted-foreground text-xs px-2 h-7",
        },
      }}
    />
  );
}

export { toast } from "sonner";

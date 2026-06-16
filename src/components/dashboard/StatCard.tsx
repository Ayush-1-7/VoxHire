"use client";

import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  hint?: string;
}

export function StatCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  hint,
}: StatCardProps) {
  const TrendIcon = changeType === "negative" ? ArrowDownRight : ArrowUpRight;

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-xs transition-all duration-200 hover:shadow-md hover:border-border/70">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{title}</span>
        <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
          <Icon className="size-4" />
        </span>
      </div>

      <div className="mt-3 flex items-end justify-between">
        <span className="text-[1.75rem] font-semibold leading-none tracking-tight tabular-nums">
          {value}
        </span>
        {change && (
          <span
            className={cn(
              "mb-0.5 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium tabular-nums",
              changeType === "positive" && "bg-success/10 text-success",
              changeType === "negative" && "bg-destructive/10 text-destructive",
              changeType === "neutral" && "bg-muted text-muted-foreground"
            )}
          >
            {changeType !== "neutral" && <TrendIcon className="size-3" />}
            {change}
          </span>
        )}
      </div>

      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

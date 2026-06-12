"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor?: string;
}

export function StatCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor = "text-primary",
}: StatCardProps) {
  return (
    <div className="glass rounded-xl p-5 glass-hover transition-all duration-300 group">
      <div className="flex items-start justify-between mb-3">
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center border transition-transform group-hover:scale-110",
            iconColor === "text-primary" && "bg-primary/10 border-primary/20",
            iconColor === "text-success" && "bg-success-bg border-success/20",
            iconColor === "text-amber-400" && "bg-amber-500/10 border-amber-500/20",
            iconColor === "text-violet-400" && "bg-violet-500/10 border-violet-500/20"
          )}
        >
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>
        {change && (
          <span
            className={cn(
              "text-xs font-semibold px-2 py-0.5 rounded-full",
              changeType === "positive" && "text-green-400 bg-green-500/10",
              changeType === "negative" && "text-red-400 bg-red-500/10",
              changeType === "neutral" && "text-muted-foreground bg-muted/50"
            )}
          >
            {change}
          </span>
        )}
      </div>
      <p className="text-2xl font-heading font-bold gradient-text mb-1">
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{title}</p>
    </div>
  );
}

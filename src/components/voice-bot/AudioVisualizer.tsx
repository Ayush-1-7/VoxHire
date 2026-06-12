"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface AudioVisualizerProps {
  isActive: boolean;
  volumeLevel: number;
  barCount?: number;
}

export function AudioVisualizer({
  isActive,
  volumeLevel,
  barCount = 20,
}: AudioVisualizerProps) {
  const barsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!barsRef.current) return;
    const bars = barsRef.current.children;
    const normalizedLevel = Math.min(1, Math.max(0, volumeLevel));

    for (let i = 0; i < bars.length; i++) {
      const bar = bars[i] as HTMLElement;
      const distance = Math.abs(i - bars.length / 2) / (bars.length / 2);
      const height = 8 + normalizedLevel * (1 - distance * 0.5) * 50;
      bar.style.height = `${height}px`;
    }
  }, [volumeLevel]);

  return (
    <div
      className={cn(
        "flex items-center justify-center h-[60px] mb-8 transition-opacity duration-300",
        isActive ? "opacity-100" : "opacity-30"
      )}
    >
      <div ref={barsRef} className="flex items-center gap-[3px] h-full">
        {Array.from({ length: barCount }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "visualizer-bar rounded-sm transition-[height] duration-100",
              isActive && "active"
            )}
            style={{
              animationDelay: `${(i <= barCount / 2 ? i : barCount - i) * 0.06}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

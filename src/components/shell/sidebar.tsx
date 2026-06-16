"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Phone,
  BarChart3,
  Settings,
  PhoneCall,
  AudioLines,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/candidates", label: "Candidates", icon: Users },
  { href: "/calls", label: "Call History", icon: Phone },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[260px] flex-col border-r border-border bg-card/40">
      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 px-5">
        <Link href="/" onClick={onNavigate} className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
            <AudioLines className="size-4" />
          </div>
          <div className="leading-none">
            <div className="text-sm font-semibold tracking-tight">VoxHire</div>
            <div className="mt-1 text-2xs text-muted-foreground">AI Recruitment</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3 py-2">
        <p className="px-2 pb-1.5 pt-2 text-2xs font-medium uppercase tracking-wide text-muted-foreground">
          Workspace
        </p>
        {nav.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
              )}
              <item.icon
                className={cn(
                  "size-4 transition-colors",
                  active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* CTA */}
      <div className="p-3">
        <Button asChild className="w-full" size="default">
          <Link href="/call" onClick={onNavigate}>
            <PhoneCall className="size-4" />
            Start voice call
          </Link>
        </Button>
      </div>
    </aside>
  );
}

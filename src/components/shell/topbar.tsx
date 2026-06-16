"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { ThemeToggle } from "@/components/shell/theme-toggle";

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/candidates": "Candidates",
  "/calls": "Call History",
  "/analytics": "Analytics",
  "/settings": "Settings",
};

function useIsMac() {
  const [isMac, setIsMac] = React.useState(false);
  React.useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform));
  }, []);
  return isMac;
}

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const isMac = useIsMac();

  const title =
    TITLES[pathname] ??
    Object.entries(TITLES).find(([href]) => pathname.startsWith(href))?.[1] ??
    "Workspace";

  const openPalette = () => {
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true, ctrlKey: true })
    );
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <Button
        variant="ghost"
        size="icon-sm"
        className="lg:hidden"
        onClick={onMenu}
        aria-label="Open menu"
      >
        <Menu className="size-4" />
      </Button>

      <h1 className="text-sm font-semibold tracking-tight sm:text-[0.9375rem]">{title}</h1>

      <div className="ml-auto flex items-center gap-1.5">
        {/* Command palette trigger */}
        <button
          onClick={openPalette}
          className="hidden h-9 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm text-muted-foreground shadow-xs transition-colors hover:bg-accent sm:flex"
        >
          <Search className="size-4" />
          <span className="pr-8">Search…</span>
          <Kbd>{isMac ? "⌘" : "Ctrl"} K</Kbd>
        </button>
        <Button variant="ghost" size="icon-sm" className="sm:hidden" onClick={openPalette} aria-label="Search">
          <Search className="size-4" />
        </Button>

        <ThemeToggle />

        <Button asChild size="sm" className="hidden sm:inline-flex">
          <Link href="/call">
            <PhoneCall className="size-4" />
            New call
          </Link>
        </Button>
      </div>
    </header>
  );
}

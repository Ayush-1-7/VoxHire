"use client";

import Link from "next/link";
import { AudioLines, ArrowLeft } from "lucide-react";
import { VoiceAgent } from "@/components/voice-bot/VoiceAgent";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/shell/theme-toggle";

export default function CallPage() {
  return (
    <div className="relative min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <AudioLines className="size-4" />
            </div>
            <div className="leading-none">
              <div className="text-sm font-semibold tracking-tight">VoxHire</div>
              <div className="mt-1 text-2xs text-muted-foreground">Voice Interview</div>
            </div>
          </Link>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm">
              <Link href="/">
                <ArrowLeft className="size-3.5" /> Home
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8 text-center">
          <Badge variant="primary" className="mb-3">Live voice screening</Badge>
          <h1 className="text-3xl font-semibold tracking-tighter">Voice interview</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Speak with our AI assistant to begin your recruitment process.
          </p>
        </div>
        <VoiceAgent />
      </main>
    </div>
  );
}

"use client";

import { VoiceAgent } from "@/components/voice-bot/VoiceAgent";
import { Bot } from "lucide-react";
import Link from "next/link";

export default function CallPage() {
  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Ambient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div
          className="ambient-orb"
          style={{
            width: 500,
            height: 500,
            background: "radial-gradient(circle, rgba(99,102,241,0.3), transparent 70%)",
            top: -150,
            right: -100,
          }}
        />
        <div
          className="ambient-orb"
          style={{
            width: 400,
            height: 400,
            background: "radial-gradient(circle, rgba(139,92,246,0.2), transparent 70%)",
            bottom: -100,
            left: -100,
            animationDelay: "-7s",
          }}
        />
      </div>

      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-background/75 border-b border-border">
        <div className="max-w-[800px] mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-sm gradient-text">
                Zensar Technologies
              </h1>
              <p className="text-[0.65rem] text-muted-foreground">
                Voice Interview
              </p>
            </div>
          </Link>
        </div>
      </header>

      <main className="relative z-10 max-w-[800px] mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h2 className="font-heading text-3xl font-bold mb-2">
            <span className="gradient-text">Voice Interview</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            Speak with our AI assistant to begin your recruitment process
          </p>
        </div>
        <VoiceAgent />
      </main>
    </div>
  );
}

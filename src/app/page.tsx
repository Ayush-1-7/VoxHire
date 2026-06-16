"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AudioLines,
  ChevronDown,
  ArrowRight,
  Building2,
  Sparkles,
} from "lucide-react";
import { VoiceAgent } from "@/components/voice-bot/VoiceAgent";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { cn } from "@/lib/utils";

const COMPANY = {
  name: "Zensar Technologies",
  overview:
    "Zensar Technologies is a global technology consulting and digital solutions company headquartered in Pune, India, helping enterprises transform through experience-led digital solutions across cloud, AI, data, and enterprise applications.",
  services: [
    "Application Services",
    "Artificial Intelligence",
    "Cloud & Security",
    "Data & Analytics",
    "Digital Engagement",
    "Digital Workplace",
  ],
  stats: [
    { value: "30+", label: "Global locations" },
    { value: "10K+", label: "Professionals" },
    { value: "6+", label: "Industries" },
  ],
};

const FAQS = [
  { q: "What does Zensar do?", a: "Zensar is a digital transformation and technology services company that helps enterprises modernize using AI, cloud, data analytics, and enterprise applications." },
  { q: "Where is Zensar located?", a: "Headquartered in Pune, India, with operations across more than 30 global locations in North America, Europe, Africa, and Asia-Pacific." },
  { q: "What industries does Zensar serve?", a: "Banking, insurance, healthcare, manufacturing, telecommunications, technology, and consumer services, among others." },
  { q: "What technologies does Zensar work with?", a: "Cloud platforms, artificial intelligence, data analytics, enterprise applications, digital experience platforms, and automation." },
];

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="relative min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <AudioLines className="size-4" />
            </div>
            <div className="leading-none">
              <div className="text-sm font-semibold tracking-tight">VoxHire</div>
              <div className="mt-1 text-2xs text-muted-foreground">Virtual Recruitment Assistant</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard">
                Recruiter dashboard <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="relative mx-auto max-w-6xl px-6 pb-24">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] grid-backdrop" />

        <section className="pt-16 text-center sm:pt-20">
          <Badge variant="primary" className="mb-5">
            <Sparkles className="size-3" /> AI-powered voice screening
          </Badge>
          <h1 className="mx-auto max-w-3xl text-balance text-4xl font-semibold leading-[1.1] tracking-tighter sm:text-5xl">
            Your recruitment journey,
            <br />
            <span className="text-primary">one conversation away</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground">
            Speak with our AI assistant to share your details, explore opportunities,
            and schedule your interview — entirely by voice.
          </p>

          <div className="mx-auto mt-10 max-w-3xl text-left">
            <VoiceAgent />
          </div>
        </section>

        {/* Company + FAQ */}
        <section className="mt-16 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <Building2 className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold tracking-tight">About {COMPANY.name}</h2>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{COMPANY.overview}</p>

            <div className="mt-6 grid grid-cols-3 gap-3">
              {COMPANY.stats.map((s) => (
                <div key={s.label} className="rounded-lg border border-border bg-muted/30 px-3 py-3 text-center">
                  <div className="text-xl font-semibold tracking-tight tabular-nums">{s.value}</div>
                  <div className="mt-0.5 text-2xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>

            <Separator className="my-6" />
            <p className="mb-3 text-2xs font-medium uppercase tracking-wide text-muted-foreground">Services</p>
            <div className="flex flex-wrap gap-1.5">
              {COMPANY.services.map((s) => (
                <Badge key={s} variant="secondary">{s}</Badge>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 text-sm font-semibold tracking-tight">Frequently asked</h2>
            <div className="divide-y divide-border">
              {FAQS.map((faq, i) => {
                const open = openFaq === i;
                return (
                  <div key={i}>
                    <button
                      onClick={() => setOpenFaq(open ? null : i)}
                      className="flex w-full items-center justify-between gap-4 py-3.5 text-left text-sm font-medium transition-colors hover:text-foreground"
                      aria-expanded={open}
                    >
                      {faq.q}
                      <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-200", open && "rotate-180 text-primary")} />
                    </button>
                    <div className={cn("grid transition-all duration-200", open ? "grid-rows-[1fr] pb-3.5" : "grid-rows-[0fr]")}>
                      <p className="overflow-hidden text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center">
        <p className="text-xs text-muted-foreground">© 2026 VoxHire · Built for Zensar Technologies</p>
      </footer>
    </div>
  );
}

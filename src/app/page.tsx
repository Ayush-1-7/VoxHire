"use client";

import { VoiceAgent } from "@/components/voice-bot/VoiceAgent";
import { Bot, ChevronDown } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

const COMPANY = {
  name: "Zensar Technologies",
  overview:
    "Zensar Technologies is a global technology consulting and digital solutions company headquartered in Pune, India. It helps enterprises transform through experience-led digital solutions across cloud, AI, data, and enterprise applications.",
  services: [
    "Application Services",
    "Artificial Intelligence Solutions",
    "Cloud, Infrastructure, and Security",
    "Data Engineering and Analytics",
    "Marketing and Digital Engagement",
    "Digital Workplace Services",
  ],
  industries: [
    "Banking and Financial Services",
    "Insurance",
    "Healthcare and Life Sciences",
    "Manufacturing",
    "Technology, Media, and Telecom",
    "Consumer Services",
  ],
};

const FAQS = [
  {
    question: "What does Zensar do?",
    answer:
      "Zensar Technologies is a digital transformation and technology services company that helps enterprises modernize systems using AI, cloud computing, data analytics, and enterprise applications.",
  },
  {
    question: "Where is Zensar located?",
    answer:
      "Zensar is headquartered in Pune, India, and operates in more than 30 global locations across North America, Europe, Africa, and Asia-Pacific.",
  },
  {
    question: "What industries does Zensar serve?",
    answer:
      "Zensar works with industries including banking, insurance, healthcare, manufacturing, telecommunications, technology, and consumer services.",
  },
  {
    question: "What is the work culture like at Zensar?",
    answer:
      "Zensar promotes a people-first culture focused on collaboration, innovation, continuous learning, and employee well-being.",
  },
  {
    question: "What technologies does Zensar work with?",
    answer:
      "Zensar works with modern technologies including cloud platforms, artificial intelligence, data analytics, enterprise applications, digital experience platforms, and automation tools.",
  },
];

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
        <div
          className="ambient-orb"
          style={{
            width: 300,
            height: 300,
            background: "radial-gradient(circle, rgba(167,139,250,0.15), transparent 70%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            animationDelay: "-14s",
          }}
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-background/75 border-b border-border">
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-sm gradient-text">
                Zensar Technologies
              </h1>
              <p className="text-[0.65rem] text-muted-foreground tracking-wide">
                Virtual Recruitment Assistant
              </p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-full border border-border hover:border-primary/30 transition-all"
          >
            Recruiter Dashboard →
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 max-w-[1200px] mx-auto px-6 pb-20">
        {/* Hero */}
        <section className="pt-16 pb-10 text-center">
          <div className="max-w-[680px] mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-dot" />
              AI-Powered Voice Assistant
            </div>
            <h2 className="font-heading text-4xl md:text-5xl font-extrabold leading-tight tracking-tight mb-4">
              Your Recruitment Journey
              <br />
              <span className="gradient-text">Starts Here</span>
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed max-w-[540px] mx-auto mb-10">
              Speak directly with our AI recruitment assistant. Get quick answers
              about Zensar, explore career opportunities, and schedule your
              interview — all through voice.
            </p>

            <VoiceAgent />
          </div>
        </section>

        {/* Company Info + FAQ */}
        <section className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Company Card */}
          <div className="glass rounded-xl p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <span className="text-lg">🏢</span>
              <h3 className="font-heading font-semibold">
                About {COMPANY.name}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              {COMPANY.overview}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { value: "30+", label: "Global Locations" },
                { value: "10K+", label: "Professionals" },
                { value: "6+", label: "Industries" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="text-center py-3 px-2 rounded-lg bg-muted/30 border border-border hover:border-primary/20 transition-all hover:-translate-y-0.5"
                >
                  <span className="block font-heading text-xl font-bold gradient-text mb-1">
                    {stat.value}
                  </span>
                  <span className="text-[0.65rem] text-muted-foreground/70">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Services */}
            <h4 className="font-heading text-sm font-semibold text-muted-foreground mb-3">
              Our Services
            </h4>
            <div className="flex flex-wrap gap-2 mb-5">
              {COMPANY.services.map((s) => (
                <span
                  key={s}
                  className="px-3 py-1.5 rounded-full text-[0.72rem] font-medium border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 transition-colors hover:-translate-y-px"
                >
                  {s}
                </span>
              ))}
            </div>

            {/* Industries */}
            <h4 className="font-heading text-sm font-semibold text-muted-foreground mb-3">
              Industries We Serve
            </h4>
            <div className="flex flex-wrap gap-2">
              {COMPANY.industries.map((ind) => (
                <span
                  key={ind}
                  className="px-3 py-1.5 rounded-full text-[0.72rem] font-medium border border-success/20 bg-success-bg text-success hover:bg-success/15 transition-colors hover:-translate-y-px"
                >
                  {ind}
                </span>
              ))}
            </div>
          </div>

          {/* FAQ Card */}
          <div className="glass rounded-xl p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <span className="text-lg">❓</span>
              <h3 className="font-heading font-semibold">
                Frequently Asked Questions
              </h3>
            </div>
            <div className="flex flex-col gap-2">
              {FAQS.map((faq, i) => (
                <div
                  key={i}
                  className="border border-border rounded-lg overflow-hidden hover:border-white/10 transition-colors"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-4 py-3.5 text-sm font-medium text-left text-foreground hover:bg-muted/30 transition-colors"
                    aria-expanded={openFaq === i}
                  >
                    {faq.question}
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${
                        openFaq === i ? "rotate-180 text-primary" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      openFaq === i ? "max-h-[200px]" : "max-h-0"
                    }`}
                  >
                    <p className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border py-6 text-center">
        <p className="text-xs text-muted-foreground/60">
          © 2026 Zensar Technologies. All rights reserved.
        </p>
        <p className="text-xs text-muted-foreground/40 italic mt-1">
          Experience-led everything.
        </p>
      </footer>
    </div>
  );
}

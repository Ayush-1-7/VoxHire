"use client";

import { Globe, Bot, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-heading text-2xl font-bold">
          <span className="gradient-text">Settings</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your AI recruitment bot and integrations
        </p>
      </div>

      {/* VAPI Config */}
      <div className="glass rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Bot className="w-4 h-4 text-primary" />
          <h3 className="font-heading font-semibold">Voice Bot Configuration</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground block mb-1.5">VAPI Assistant ID</label>
            <Input
              value={process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID || ""}
              readOnly
              className="bg-muted/30 font-mono text-xs"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-1.5">Webhook URL</label>
            <Input
              value={`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/vapi/webhook`}
              readOnly
              className="bg-muted/30 font-mono text-xs"
            />
            <p className="text-[0.7rem] text-muted-foreground/60 mt-1">
              Set this URL in your VAPI dashboard under Assistant → Server URL
            </p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="glass rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Bell className="w-4 h-4 text-amber-400" />
          <h3 className="font-heading font-semibold">Notifications</h3>
        </div>
        <div className="space-y-3">
          {[
            { label: "New candidate notifications", desc: "Get notified when a new candidate is captured" },
            { label: "Interview reminders", desc: "Receive reminders before scheduled interviews" },
            { label: "Daily summary email", desc: "Get a daily summary of recruitment activity" },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-[0.7rem] text-muted-foreground">{item.desc}</p>
              </div>
              <div className="w-10 h-6 rounded-full bg-primary/20 relative cursor-pointer">
                <div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-primary transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Integration Status */}
      <div className="glass rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Globe className="w-4 h-4 text-success" />
          <h3 className="font-heading font-semibold">Integration Status</h3>
        </div>
        <div className="space-y-2">
          {[
            { name: "VAPI Voice AI", status: true },
            { name: "Supabase Database", status: true },
            { name: "Google Calendar", status: false },
            { name: "Resend Email", status: true },
            { name: "Upstash Redis", status: true },
            { name: "Sentry Monitoring", status: false },
          ].map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/20 transition-colors"
            >
              <span className="text-sm text-foreground">{item.name}</span>
              <span
                className={`text-[0.7rem] font-semibold px-2 py-0.5 rounded-full ${
                  item.status
                    ? "text-green-400 bg-green-500/10"
                    : "text-muted-foreground bg-muted/50"
                }`}
              >
                {item.status ? "Connected" : "Not configured"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

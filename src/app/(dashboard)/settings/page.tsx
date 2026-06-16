"use client";

import { useState } from "react";
import { Bot, Bell, Plug, Check, Copy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/ui/page-header";
import { toast } from "@/components/ui/toaster";

const NOTIFICATIONS = [
  { label: "New candidate notifications", desc: "When a new candidate is captured from a call", defaultOn: true },
  { label: "Interview reminders", desc: "24 hours before a scheduled interview", defaultOn: true },
  { label: "Daily summary email", desc: "A daily digest of recruitment activity", defaultOn: false },
];

const INTEGRATIONS = [
  { name: "VAPI Voice AI", connected: true },
  { name: "Supabase Database", connected: true },
  { name: "Resend Email", connected: true },
  { name: "Upstash Redis", connected: true },
  { name: "Google Calendar", connected: false },
  { name: "Sentry Monitoring", connected: false },
];

function CopyField({ label, value, hint }: { label: string; value: string; hint?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <div className="flex gap-2">
        <Input value={value} readOnly className="font-mono text-xs" />
        <Button variant="outline" size="icon" onClick={copy} aria-label={`Copy ${label}`}>
          {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
        </Button>
      </div>
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Settings" description="Configure the voice assistant and integrations." />

      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <Bot className="size-4 text-primary" />
          <div>
            <CardTitle>Voice bot configuration</CardTitle>
            <CardDescription>Connect VAPI to this deployment.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <CopyField label="VAPI Assistant ID" value={process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID || "Not configured"} />
          <CopyField
            label="Webhook URL"
            value={`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/vapi/webhook`}
            hint="Set this in the VAPI dashboard under Assistant → Server URL."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <Bell className="size-4 text-primary" />
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {NOTIFICATIONS.map((item, i) => (
            <div key={item.label}>
              {i > 0 && <Separator className="my-1" />}
              <div className="flex items-center justify-between py-2.5">
                <div className="pr-4">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Switch defaultChecked={item.defaultOn} aria-label={item.label} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <Plug className="size-4 text-primary" />
          <CardTitle>Integrations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {INTEGRATIONS.map((item) => (
            <div key={item.name} className="flex items-center justify-between rounded-lg px-2 py-2.5 transition-colors hover:bg-accent/50">
              <span className="text-sm">{item.name}</span>
              <Badge variant={item.connected ? "success" : "secondary"} dot>
                {item.connected ? "Connected" : "Not configured"}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

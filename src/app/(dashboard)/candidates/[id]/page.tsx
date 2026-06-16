"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  Briefcase,
  Clock,
  ShieldCheck,
  FileText,
  AlertCircle,
  Video,
  Sparkles,
  CalendarClock,
} from "lucide-react";
import { cn, formatStatusLabel } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { InitialsAvatar } from "@/components/ui/avatar";

interface Call {
  id: string;
  vapiCallId: string;
  duration: number | null;
  status: string;
  startedAt: string;
  summary: string | null;
  transcript: Array<{ role: string; text: string }> | null;
}
interface Appointment {
  id: string;
  title: string;
  scheduledAt: string;
  googleMeetLink: string | null;
  status: string;
}
interface CandidateDetail {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  jobRole: string | null;
  experience: string | null;
  status: string;
  notes: string | null;
  source: string | null;
  consentGiven: boolean;
  createdAt: string;
  calls: Call[];
  appointments: Appointment[];
}

const STATUS_VARIANT: Record<string, BadgeProps["variant"]> = {
  HIRED: "success",
  INTERVIEW_SCHEDULED: "primary",
  OFFER_SENT: "primary",
  REJECTED: "destructive",
};

function ProfileRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

export default function CandidateDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [candidate, setCandidate] = useState<CandidateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`/api/candidates/${id}`);
        if (!res.ok) throw new Error(res.status === 404 ? "Candidate not found" : "Failed to load candidate");
        const data = await res.json();
        setCandidate(data);
        if (data.calls?.length) setSelectedCallId(data.calls[0].id);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-16 w-full max-w-md rounded-xl" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="mx-auto max-w-md py-12">
        <EmptyState
          icon={AlertCircle}
          title={error === "Candidate not found" ? "Candidate not found" : "Couldn't load candidate"}
          description={
            error === "Candidate not found"
              ? "This candidate doesn't exist or may have been removed."
              : "Something went wrong fetching this profile. Please try again."
          }
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/candidates">
                <ArrowLeft className="size-4" /> Back to candidates
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  const selectedCall = candidate.calls.find((c) => c.id === selectedCallId);

  return (
    <div className="space-y-6">
      <Link
        href="/candidates"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Candidates
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-center gap-4">
        <InitialsAvatar name={candidate.name} className="size-12 text-base" />
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{candidate.name}</h1>
          <p className="text-sm text-muted-foreground">
            Added{" "}
            {new Date(candidate.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <Badge variant={STATUS_VARIANT[candidate.status] ?? "secondary"} dot className="sm:ml-auto">
          {formatStatusLabel(candidate.status)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: profile + appointments */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <ProfileRow icon={Mail} label="Email" value={candidate.email || "—"} />
              <ProfileRow icon={Phone} label="Phone" value={candidate.phone || "—"} />
              <ProfileRow icon={Briefcase} label="Applied role" value={candidate.jobRole || "—"} />
              <ProfileRow icon={Clock} label="Experience" value={candidate.experience || "—"} />
              <ProfileRow
                icon={ShieldCheck}
                label="Recording consent"
                value={
                  <span className={candidate.consentGiven ? "text-success" : "text-muted-foreground"}>
                    {candidate.consentGiven ? "Granted" : "Not granted"}
                  </span>
                }
              />
              <ProfileRow icon={FileText} label="Source" value={<span className="capitalize">{candidate.source || "voice-bot"}</span>} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Interviews</CardTitle></CardHeader>
            <CardContent>
              {candidate.appointments.length > 0 ? (
                <div className="space-y-3">
                  {candidate.appointments.map((apt) => (
                    <div key={apt.id} className="rounded-lg border border-border bg-muted/20 p-3">
                      <div className="mb-1.5 flex items-center justify-between">
                        <Badge variant="primary">{formatStatusLabel(apt.status)}</Badge>
                        <CalendarClock className="size-3.5 text-muted-foreground" />
                      </div>
                      <p className="truncate text-sm font-medium">{apt.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                        {new Date(apt.scheduledAt).toLocaleString("en-IN", {
                          weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                      {apt.googleMeetLink && (
                        <a
                          href={apt.googleMeetLink}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                        >
                          <Video className="size-3.5" /> Join meeting
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">No interviews scheduled.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: calls + transcript */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Call history</CardTitle></CardHeader>
          <CardContent>
            {candidate.calls.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-[180px_1fr]">
                {/* Call selector */}
                <div className="space-y-1.5 md:border-r md:border-border md:pr-4">
                  {candidate.calls.map((call) => (
                    <button
                      key={call.id}
                      onClick={() => setSelectedCallId(call.id)}
                      className={cn(
                        "flex w-full flex-col gap-0.5 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                        selectedCallId === call.id
                          ? "border-primary/30 bg-primary/10 text-foreground"
                          : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      <span className="font-medium">
                        {new Date(call.startedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                      <span className="text-xs opacity-70 tabular-nums">
                        {call.duration ? `${Math.floor(call.duration / 60)}m ${call.duration % 60}s` : "—"}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Transcript */}
                <div className="min-w-0 space-y-4">
                  {selectedCall ? (
                    <>
                      {selectedCall.summary && (
                        <div className="rounded-lg border border-primary/15 bg-primary/[0.04] p-3">
                          <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-primary">
                            <Sparkles className="size-3.5" /> AI summary
                          </p>
                          <p className="text-sm leading-relaxed text-muted-foreground">{selectedCall.summary}</p>
                        </div>
                      )}
                      <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1 custom-scrollbar">
                        {selectedCall.transcript?.length ? (
                          selectedCall.transcript.map((entry, i) => {
                            const isUser = entry.role === "user";
                            return (
                              <div
                                key={i}
                                className={cn(
                                  "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                                  isUser
                                    ? "ml-auto rounded-br-sm bg-primary text-primary-foreground"
                                    : "mr-auto rounded-bl-sm border border-border bg-muted"
                                )}
                              >
                                <span className={cn("mb-1 block text-2xs font-medium uppercase tracking-wide", isUser ? "text-primary-foreground/70" : "text-muted-foreground")}>
                                  {isUser ? "Candidate" : "AI Recruiter"}
                                </span>
                                {entry.text}
                              </div>
                            );
                          })
                        ) : (
                          <p className="py-10 text-center text-sm text-muted-foreground">No transcript for this call.</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="py-10 text-center text-sm text-muted-foreground">Select a call to view its transcript.</p>
                  )}
                </div>
              </div>
            ) : (
              <EmptyState icon={Phone} title="No calls yet" description="This candidate has no recorded calls." className="border-0" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

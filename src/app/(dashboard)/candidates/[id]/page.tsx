"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Clock, 
  Calendar, 
  ShieldCheck, 
  FileText, 
  Loader2, 
  AlertCircle 
} from "lucide-react";
import { cn, getStatusColor, formatStatusLabel } from "@/lib/utils";

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

export default function CandidateDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [candidate, setCandidate] = useState<CandidateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCandidate() {
      try {
        const res = await fetch(`/api/candidates/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Candidate not found");
          }
          throw new Error("Failed to fetch candidate details");
        }
        const data = await res.json();
        setCandidate(data);
        if (data.calls && data.calls.length > 0) {
          setSelectedCallId(data.calls[0].id);
        }
      } catch (err) {
        const error = err as Error;
        console.error("[CandidateDetail] Fetch error:", error);
        setError(error.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchCandidate();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="space-y-6 max-w-xl mx-auto py-12">
        <div className="glass rounded-xl p-8 text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-destructive/80 mx-auto" />
          <h2 className="font-heading text-xl font-bold text-foreground">
            {error === "Candidate not found" ? "404 - Candidate Not Found" : "Error Loading Candidate"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {error === "Candidate not found"
              ? "The candidate ID you visited does not exist in our records."
              : "We couldn't retrieve the details for this candidate. Please try again later."}
          </p>
          <div className="pt-2">
            <Link
              href="/candidates"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/95 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Candidates
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const selectedCall = candidate.calls.find((c) => c.id === selectedCallId);

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      {/* Back Header */}
      <div>
        <Link
          href="/candidates"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Candidates List
        </Link>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">
              {candidate.name}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Candidate profile created {new Date(candidate.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric"
              })}
            </p>
          </div>
          <div className="sm:ml-auto">
            <span
              className={cn(
                "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border",
                getStatusColor(candidate.status)
              )}
            >
              {formatStatusLabel(candidate.status)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="space-y-6">
          <div className="glass rounded-xl p-6 space-y-5">
            <h3 className="font-heading font-semibold text-sm border-b border-border/50 pb-2">
              Profile Summary
            </h3>
            
            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Email Address</p>
                  <p className="font-medium text-foreground">{candidate.email || "—"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Phone Number</p>
                  <p className="font-medium text-foreground">{candidate.phone || "—"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Briefcase className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Applied Role</p>
                  <p className="font-medium text-foreground">{candidate.jobRole || "—"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Experience</p>
                  <p className="font-medium text-foreground">{candidate.experience || "—"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Recording Consent</p>
                  <p className="font-medium text-foreground">
                    {candidate.consentGiven ? "✅ Agreed" : "❌ Denied"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Source</p>
                  <p className="font-medium text-foreground capitalize">{candidate.source || "voice-bot"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Appointments section */}
          <div className="glass rounded-xl p-6 space-y-4">
            <h3 className="font-heading font-semibold text-sm border-b border-border/50 pb-2">
              Scheduled Interviews
            </h3>
            {candidate.appointments.length > 0 ? (
              <div className="space-y-3">
                {candidate.appointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-3 rounded-lg bg-muted/20 border border-border/50 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-primary">{apt.status}</span>
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <p className="text-xs font-medium truncate">{apt.title}</p>
                    <p className="text-[0.65rem] text-muted-foreground">
                      {new Date(apt.scheduledAt).toLocaleString("en-IN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                    {apt.googleMeetLink && (
                      <a
                        href={apt.googleMeetLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-[0.65rem] font-bold text-indigo-400 hover:underline pt-1"
                      >
                        Join Google Meet →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No interviews scheduled yet
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Call Details & Transcript */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-xl p-6 min-h-[400px] flex flex-col">
            <h3 className="font-heading font-semibold text-sm border-b border-border/50 pb-3 mb-4 flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" /> Call Transcript History
            </h3>

            {candidate.calls.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-1">
                {/* Left pane: Call selector */}
                <div className="md:col-span-1 space-y-2 border-r border-border/50 pr-4">
                  <p className="text-[0.7rem] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Select Call
                  </p>
                  {candidate.calls.map((call) => (
                    <button
                      key={call.id}
                      onClick={() => setSelectedCallId(call.id)}
                      className={cn(
                        "w-full text-left p-2.5 rounded-lg border text-xs transition-all flex flex-col gap-1.5",
                        selectedCallId === call.id
                          ? "bg-primary/10 border-primary/30 text-primary font-medium"
                          : "border-border/50 hover:bg-muted/20 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span className="font-medium">
                        {new Date(call.startedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short"
                        })}
                      </span>
                      <span className="text-[0.65rem] opacity-70">
                        Duration: {call.duration ? `${Math.floor(call.duration / 60)}m ${call.duration % 60}s` : "—"}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Right pane: Transcript & summary */}
                <div className="md:col-span-3 flex flex-col gap-4 min-h-[300px]">
                  {selectedCall ? (
                    <>
                      {/* Summary block */}
                      {selectedCall.summary && (
                        <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-lg">
                          <p className="text-[0.7rem] font-semibold text-indigo-400 mb-1">
                            Call Summary & Notes
                          </p>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {selectedCall.summary}
                          </p>
                        </div>
                      )}

                      {/* Conversation thread */}
                      <div className="flex-1 overflow-y-auto max-h-[350px] space-y-3 pr-2 scrollbar-thin">
                        {selectedCall.transcript && Array.isArray(selectedCall.transcript) && selectedCall.transcript.length > 0 ? (
                          selectedCall.transcript.map((entry, index) => {
                            const isUser = entry.role === "user";
                            return (
                              <div
                                key={index}
                                className={cn(
                                  "flex flex-col max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed",
                                  isUser
                                    ? "bg-primary text-white ml-auto rounded-tr-none"
                                    : "bg-muted text-foreground mr-auto rounded-tl-none border border-border"
                                )}
                              >
                                <span className={cn("text-[0.65rem] font-bold mb-1 opacity-70", isUser ? "text-indigo-100" : "text-primary")}>
                                  {isUser ? "Candidate" : "AI Recruiter"}
                                </span>
                                <p>{entry.text}</p>
                              </div>
                            );
                          })
                        ) : (
                          <div className="flex items-center justify-center h-full py-12 text-muted-foreground text-xs">
                            No transcript text available for this call record.
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center flex-1 text-muted-foreground text-xs">
                      Select a call to view its transcript details.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center flex-1">
                <Phone className="w-12 h-12 text-muted-foreground/15 mb-4" />
                <p className="text-xs text-muted-foreground font-medium">No calls on record for this candidate</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

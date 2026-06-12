"use client";

import { useState } from "react";
import { cn, formatDate, getStatusColor, formatStatusLabel } from "@/lib/utils";
import { Phone, Clock, User } from "lucide-react";

interface Call {
  id: string;
  vapiCallId: string;
  status: string;
  duration: number | null;
  startedAt: string | Date;
  summary: string | null;
  transcript?: Array<{ role: string; text: string }> | null;
  candidate?: { id: string; name: string; email: string | null } | null;
}

interface CallHistoryTableProps {
  calls: Call[];
  compact?: boolean;
}

export function CallHistoryTable({ calls, compact = false }: CallHistoryTableProps) {
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);

  if (calls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Phone className="w-10 h-10 mb-3 opacity-30" />
        <p className="text-sm">No call records yet</p>
        <p className="text-xs mt-1">Calls will appear here after your first voice session</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="overflow-x-auto animate-fade-in">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="pb-3 font-medium text-muted-foreground">Candidate</th>
              <th className="pb-3 font-medium text-muted-foreground">Status</th>
              <th className="pb-3 font-medium text-muted-foreground">Duration</th>
              {!compact && (
                <th className="pb-3 font-medium text-muted-foreground">Date</th>
              )}
              {!compact && (
                <th className="pb-3 font-medium text-muted-foreground">Summary</th>
              )}
            </tr>
          </thead>
          <tbody>
            {calls.map((call) => (
              <tr
                key={call.id}
                onClick={() => setSelectedCall(call)}
                className="border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer"
              >
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="font-medium text-foreground">
                      {call.candidate?.name || "Unknown"}
                    </span>
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-[0.7rem] font-semibold border",
                      getStatusColor(call.status)
                    )}
                  >
                    {formatStatusLabel(call.status)}
                  </span>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {call.duration
                      ? `${Math.floor(call.duration / 60)}m ${call.duration % 60}s`
                      : "—"}
                  </div>
                </td>
                {!compact && (
                  <td className="py-3 pr-4 text-muted-foreground">
                    {formatDate(call.startedAt)}
                  </td>
                )}
                {!compact && (
                  <td className="py-3 text-muted-foreground max-w-[200px] truncate">
                    {call.summary || "—"}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Transcript Detail Modal */}
      {selectedCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass w-full max-w-2xl rounded-2xl flex flex-col max-h-[85vh] shadow-glow border border-border">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h3 className="font-heading font-bold text-lg text-foreground">
                  Call Record Transcript
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Candidate: {selectedCall.candidate?.name || "Unknown"} ({selectedCall.candidate?.email || "No Email"})
                </p>
              </div>
              <button
                onClick={() => setSelectedCall(null)}
                className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors cursor-pointer text-muted-foreground hover:text-foreground text-xs"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm scrollbar-thin">
              {/* Summary */}
              {selectedCall.summary && (
                <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl">
                  <p className="text-xs font-semibold text-primary mb-1">AI Call Summary</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {selectedCall.summary}
                  </p>
                </div>
              )}

              {/* Transcript thread */}
              <div className="space-y-4">
                <p className="text-[0.7rem] font-semibold text-muted-foreground uppercase tracking-wider">
                  Conversation Log
                </p>
                {selectedCall.transcript && Array.isArray(selectedCall.transcript) && selectedCall.transcript.length > 0 ? (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {selectedCall.transcript.map((entry, index) => {
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
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    No transcript text available for this call.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

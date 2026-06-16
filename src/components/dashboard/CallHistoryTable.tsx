"use client";

import { useState } from "react";
import { formatDate } from "@/lib/utils";
import { Clock, Phone, Sparkles } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { InitialsAvatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

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

const STATUS_VARIANT: Record<string, BadgeProps["variant"]> = {
  COMPLETED: "success",
  IN_PROGRESS: "primary",
  INITIATED: "secondary",
  NO_ANSWER: "warning",
  FAILED: "destructive",
};

function statusLabel(s: string) {
  return s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDuration(d: number | null) {
  if (!d) return "—";
  return `${Math.floor(d / 60)}m ${d % 60}s`;
}

export function CallHistoryTable({
  calls,
  compact = false,
}: {
  calls: Call[];
  compact?: boolean;
}) {
  const [selected, setSelected] = useState<Call | null>(null);

  if (calls.length === 0) {
    return (
      <EmptyState
        icon={Phone}
        title="No calls yet"
        description="Completed voice screenings will appear here with transcripts and extracted details."
      />
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Candidate</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Duration</TableHead>
            {!compact && <TableHead>Date</TableHead>}
            {!compact && <TableHead>Summary</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {calls.map((call) => (
            <TableRow
              key={call.id}
              onClick={() => setSelected(call)}
              className="cursor-pointer"
            >
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <InitialsAvatar name={call.candidate?.name} className="size-7" />
                  <div className="min-w-0">
                    <div className="truncate font-medium">{call.candidate?.name || "Unknown"}</div>
                    {call.candidate?.email && (
                      <div className="truncate text-xs text-muted-foreground">{call.candidate.email}</div>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[call.status] ?? "secondary"} dot>
                  {statusLabel(call.status)}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground tabular-nums">
                  <Clock className="size-3.5" />
                  {formatDuration(call.duration)}
                </span>
              </TableCell>
              {!compact && (
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                  {formatDate(call.startedAt)}
                </TableCell>
              )}
              {!compact && (
                <TableCell className="max-w-[260px] truncate text-sm text-muted-foreground">
                  {call.summary || "—"}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Call transcript</DialogTitle>
            <DialogDescription>
              {selected?.candidate?.name || "Unknown"}
              {selected?.candidate?.email ? ` · ${selected.candidate.email}` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] space-y-5 overflow-y-auto pr-1 custom-scrollbar">
            {selected?.summary && (
              <div className="rounded-lg border border-primary/15 bg-primary/[0.04] p-3.5">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-primary">
                  <Sparkles className="size-3.5" /> AI summary
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">{selected.summary}</p>
              </div>
            )}

            <div className="space-y-3">
              {selected?.transcript && selected.transcript.length > 0 ? (
                selected.transcript.map((entry, i) => {
                  const isUser = entry.role === "user";
                  return (
                    <div
                      key={i}
                      className={cn(
                        "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                        isUser
                          ? "ml-auto rounded-br-sm bg-primary text-primary-foreground"
                          : "mr-auto rounded-bl-sm border border-border bg-muted text-foreground"
                      )}
                    >
                      <span
                        className={cn(
                          "mb-1 block text-2xs font-medium uppercase tracking-wide",
                          isUser ? "text-primary-foreground/70" : "text-muted-foreground"
                        )}
                      >
                        {isUser ? "Candidate" : "AI Recruiter"}
                      </span>
                      {entry.text}
                    </div>
                  );
                })
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No transcript available for this call.
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

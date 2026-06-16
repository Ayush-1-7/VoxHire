"use client";

import { useEffect, useMemo, useState } from "react";
import { CallHistoryTable } from "@/components/dashboard/CallHistoryTable";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { cn, formatDate, formatStatusLabel } from "@/lib/utils";
import { Download } from "lucide-react";
import { downloadCsv } from "@/lib/export";
import { toast } from "@/components/ui/toaster";

interface CallData {
  id: string;
  vapiCallId: string;
  status: string;
  duration: number | null;
  startedAt: string;
  summary: string | null;
  transcript?: Array<{ role: string; text: string }> | null;
  candidate: { id: string; name: string; email: string | null } | null;
}

const STATUS_FILTERS = ["COMPLETED", "IN_PROGRESS", "NO_ANSWER", "FAILED"];

export default function CallsPage() {
  const [calls, setCalls] = useState<CallData[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/calls?pageSize=100");
        const data = await res.json();
        setCalls(data.data || []);
        setTotal(data.total || 0);
      } catch (err) {
        console.error("[Calls] Fetch error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(
    () => (filterStatus ? calls.filter((c) => c.status === filterStatus) : calls),
    [calls, filterStatus]
  );

  const handleExport = () => {
    const rows = filtered.map((c) => ({
      Candidate: c.candidate?.name || "Unknown",
      Email: c.candidate?.email || "",
      Status: formatStatusLabel(c.status),
      "Duration (s)": c.duration ?? 0,
      Date: formatDate(c.startedAt),
      Summary: c.summary || "",
    }));
    const ok = downloadCsv(`calls-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    toast[ok ? "success" : "error"](ok ? `Exported ${rows.length} calls` : "Nothing to export");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Call History"
        description="Every voice screening, with transcripts and AI summaries."
        actions={
          <>
            {!loading && total > 0 && (
              <Badge variant="secondary" className="tabular-nums">
                {total} total
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={handleExport} disabled={!filtered.length}>
              <Download className="size-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap gap-1.5">
        <FilterChip active={!filterStatus} onClick={() => setFilterStatus("")}>
          All
        </FilterChip>
        {STATUS_FILTERS.map((s) => (
          <FilterChip
            key={s}
            active={s === filterStatus}
            onClick={() => setFilterStatus(s === filterStatus ? "" : s)}
          >
            {formatStatusLabel(s)}
          </FilterChip>
        ))}
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="p-2">
            <CallHistoryTable calls={filtered} />
          </div>
        )}
      </Card>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-primary/20 bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

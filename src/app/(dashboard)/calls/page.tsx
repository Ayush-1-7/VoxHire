"use client";

import { useEffect, useState } from "react";
import { CallHistoryTable } from "@/components/dashboard/CallHistoryTable";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";

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

export default function CallsPage() {
  const [calls, setCalls] = useState<CallData[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/calls?pageSize=50");
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Call History"
        description="Every voice screening, with transcripts and AI summaries."
        actions={
          !loading && total > 0 ? (
            <Badge variant="secondary" className="tabular-nums">
              {total} total
            </Badge>
          ) : undefined
        }
      />

      <Card className="overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="p-2">
            <CallHistoryTable calls={calls} />
          </div>
        )}
      </Card>
    </div>
  );
}

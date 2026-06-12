"use client";

import { CallHistoryTable } from "@/components/dashboard/CallHistoryTable";
import { Phone, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface CallData {
  id: string;
  vapiCallId: string;
  status: string;
  duration: number | null;
  startedAt: string;
  summary: string | null;
  candidate: { id: string; name: string; email: string | null } | null;
}

export default function CallsPage() {
  const [calls, setCalls] = useState<CallData[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function fetchCalls() {
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
    }
    fetchCalls();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">
          <span className="gradient-text">Call History</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          View all voice bot call records and transcripts
        </p>
      </div>

      <div className="glass rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Phone className="w-4 h-4 text-primary" />
          <h3 className="font-heading font-semibold">All Calls</h3>
          <span className="text-xs text-muted-foreground ml-auto">
            {total} total
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : calls.length > 0 ? (
          <CallHistoryTable calls={calls} />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Phone className="w-12 h-12 text-muted-foreground/20 mb-4" />
            <p className="text-sm text-muted-foreground font-medium">No calls recorded yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1 max-w-sm">
              Call records will appear here automatically after voice calls are completed through the landing page.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

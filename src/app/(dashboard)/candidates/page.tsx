"use client";

import { cn, getStatusColor, formatStatusLabel, formatDate } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Users, Search, Mail, Briefcase, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Candidate {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  jobRole: string | null;
  experience: string | null;
  status: string;
  createdAt: string;
  _count?: { calls: number; appointments: number };
}

const ALL_STATUSES = [
  "INTERVIEW_SCHEDULED",
  "SCREENING",
  "HIRED",
  "OFFER_SENT",
  "NEW",
  "CONTACTED",
  "INTERVIEWED",
  "REJECTED",
];

export default function CandidatesPage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [total, setTotal] = useState(0);

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ pageSize: "50" });
      if (search) params.set("search", search);
      if (filterStatus) params.set("status", filterStatus);

      const res = await fetch(`/api/candidates?${params}`);
      const data = await res.json();
      setCandidates(data.data || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("[Candidates] Fetch error:", err);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus]);

  useEffect(() => {
    const timer = setTimeout(fetchCandidates, 300); // debounce search
    return () => clearTimeout(timer);
  }, [fetchCandidates]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">
          <span className="gradient-text">Candidates</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage and track all recruitment candidates
          {total > 0 && (
            <span className="text-primary ml-2">({total} total)</span>
          )}
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search candidates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted/30"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus("")}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
              !filterStatus
                ? "bg-primary/10 text-primary border-primary/20"
                : "text-muted-foreground border-border hover:border-primary/20"
            )}
          >
            All
          </button>
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s === filterStatus ? "" : s)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                s === filterStatus
                  ? getStatusColor(s)
                  : "text-muted-foreground border-border hover:border-primary/20"
              )}
            >
              {formatStatusLabel(s)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : candidates.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-left font-medium text-muted-foreground px-6 py-3">Candidate</th>
                  <th className="text-left font-medium text-muted-foreground px-6 py-3">Role</th>
                  <th className="text-left font-medium text-muted-foreground px-6 py-3">Experience</th>
                  <th className="text-left font-medium text-muted-foreground px-6 py-3">Status</th>
                  <th className="text-left font-medium text-muted-foreground px-6 py-3">Added</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/candidates/${c.id}`)}
                    className="border-b border-border/50 hover:bg-muted/10 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                          <Users className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{c.name}</p>
                          {c.email && (
                            <span className="flex items-center gap-1 text-[0.7rem] text-muted-foreground mt-0.5">
                              <Mail className="w-3 h-3" />
                              {c.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 text-foreground">
                        <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                        {c.jobRole || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{c.experience || "—"}</td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-[0.7rem] font-semibold border",
                          getStatusColor(c.status)
                        )}
                      >
                        {formatStatusLabel(c.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {formatDate(c.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="w-12 h-12 text-muted-foreground/20 mb-4" />
            <p className="text-sm text-muted-foreground font-medium">No candidates yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1 max-w-sm">
              Candidates will appear here automatically after voice calls are completed.
              Start a call from the landing page to begin.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

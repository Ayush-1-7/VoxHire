"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn, formatDate, formatStatusLabel } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { InitialsAvatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Search, Briefcase } from "lucide-react";

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

const STATUS_FILTERS = [
  "INTERVIEW_SCHEDULED",
  "SCREENING",
  "HIRED",
  "OFFER_SENT",
  "NEW",
  "CONTACTED",
  "INTERVIEWED",
  "REJECTED",
];

const STATUS_VARIANT: Record<string, BadgeProps["variant"]> = {
  HIRED: "success",
  INTERVIEW_SCHEDULED: "primary",
  OFFER_SENT: "primary",
  SCREENING: "secondary",
  INTERVIEWED: "secondary",
  NEW: "secondary",
  CONTACTED: "secondary",
  REJECTED: "destructive",
  WITHDRAWN: "warning",
};

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
    const timer = setTimeout(fetchCandidates, 300);
    return () => clearTimeout(timer);
  }, [fetchCandidates]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Candidates"
        description="Every candidate captured from voice screenings."
        actions={
          total > 0 ? (
            <Badge variant="secondary" className="tabular-nums">
              {total} total
            </Badge>
          ) : undefined
        }
      />

      {/* Filters */}
      <div className="space-y-3">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
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
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : candidates.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Candidate</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Added</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.map((c) => (
                <TableRow
                  key={c.id}
                  onClick={() => router.push(`/candidates/${c.id}`)}
                  className="cursor-pointer"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <InitialsAvatar name={c.name} />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{c.name}</p>
                        {c.email && (
                          <p className="truncate text-xs text-muted-foreground">{c.email}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-sm">
                      <Briefcase className="size-3.5 text-muted-foreground" />
                      {c.jobRole || "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.experience || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[c.status] ?? "secondary"} dot>
                      {formatStatusLabel(c.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(c.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            icon={Users}
            title={search || filterStatus ? "No matching candidates" : "No candidates yet"}
            description={
              search || filterStatus
                ? "Try a different search term or clear the filters."
                : "Candidates are captured automatically after each completed voice screening."
            }
            className="border-0"
          />
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

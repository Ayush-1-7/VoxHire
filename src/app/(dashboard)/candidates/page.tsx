"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { cn, formatDate, formatStatusLabel } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Users, Search, Briefcase, Download, ArrowDownUp, Check } from "lucide-react";
import { downloadCsv } from "@/lib/export";
import { toast } from "@/components/ui/toaster";

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

type SortKey = "recent" | "oldest" | "name" | "role" | "status";
const SORT_LABELS: Record<SortKey, string> = {
  recent: "Newest first",
  oldest: "Oldest first",
  name: "Name (A–Z)",
  role: "Role (A–Z)",
  status: "Status",
};

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
  const [sort, setSort] = useState<SortKey>("recent");
  const [total, setTotal] = useState(0);

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ pageSize: "100" });
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

  const sorted = useMemo(() => {
    const list = [...candidates];
    const byStr = (a?: string | null, b?: string | null) =>
      (a || "").localeCompare(b || "", undefined, { sensitivity: "base" });
    switch (sort) {
      case "name":
        return list.sort((a, b) => byStr(a.name, b.name));
      case "role":
        return list.sort((a, b) => byStr(a.jobRole, b.jobRole));
      case "status":
        return list.sort((a, b) => byStr(a.status, b.status));
      case "oldest":
        return list.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
      case "recent":
      default:
        return list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    }
  }, [candidates, sort]);

  const handleExport = () => {
    const rows = sorted.map((c) => ({
      Name: c.name,
      Email: c.email || "",
      Phone: c.phone || "",
      Role: c.jobRole || "",
      Experience: c.experience || "",
      Status: formatStatusLabel(c.status),
      Calls: c._count?.calls ?? 0,
      Interviews: c._count?.appointments ?? 0,
      Added: new Date(c.createdAt).toISOString().slice(0, 10),
    }));
    const ok = downloadCsv(`candidates-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    toast[ok ? "success" : "error"](ok ? `Exported ${rows.length} candidates` : "Nothing to export");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Candidates"
        description="Every candidate captured from voice screenings."
        actions={
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <ArrowDownUp className="size-4" />
                  <span className="hidden sm:inline">{SORT_LABELS[sort]}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                  <DropdownMenuItem key={key} onClick={() => setSort(key)}>
                    {SORT_LABELS[key]}
                    {sort === key && <Check className="ml-auto size-4 text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={!sorted.length}>
              <Download className="size-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
          </>
        }
      />

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or role…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {total > 0 && (
            <Badge variant="secondary" className="tabular-nums">
              {total} total
            </Badge>
          )}
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
        ) : sorted.length > 0 ? (
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
              {sorted.map((c) => (
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

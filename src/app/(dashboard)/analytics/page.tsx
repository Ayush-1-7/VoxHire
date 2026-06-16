"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { BarChart3, TrendingUp, PieChart as PieIcon } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartPie,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { formatStatusLabel } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

const STATUS_COLORS: Record<string, string> = {
  NEW: "#3b82f6",
  CONTACTED: "#6366f1",
  SCREENING: "#eab308",
  INTERVIEWED: "#8b5cf6",
  INTERVIEW_SCHEDULED: "#a855f7",
  OFFER_SENT: "#10b981",
  HIRED: "#22c55e",
  REJECTED: "#ef4444",
};

interface AnalyticsData {
  summary: {
    totalCandidates: number;
    totalCalls: number;
    scheduledInterviews: number;
    hiredCount: number;
  };
  statusDistribution: Array<{ status: string; count: number }>;
  analytics: Array<{ date: string; totalCalls: number; newCandidates: number }>;
}

/** Resolve design-token colors for Recharts, re-evaluated on theme change. */
function useChartColors() {
  const { resolvedTheme } = useTheme();
  const [colors, setColors] = useState({
    primary: "#6366f1",
    secondary: "#a855f7",
    grid: "rgba(120,120,130,0.15)",
    axis: "#9CA3AF",
  });

  useEffect(() => {
    const root = getComputedStyle(document.documentElement);
    const v = (name: string) => root.getPropertyValue(name).trim();
    const hsl = (name: string, fallback: string) => {
      const raw = v(name);
      return raw ? `hsl(${raw})` : fallback;
    };
    setColors({
      primary: hsl("--primary", "#6366f1"),
      secondary: "#a855f7",
      grid: hsl("--border", "rgba(120,120,130,0.15)"),
      axis: hsl("--muted-foreground", "#9CA3AF"),
    });
  }, [resolvedTheme]);

  return colors;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md">
      {label && <p className="mb-1 text-xs text-muted-foreground">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-medium tabular-nums" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const c = useChartColors();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/analytics?days=30");
        setData(await res.json());
      } catch (err) {
        console.error("[Analytics] Fetch error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const chartData = (data?.analytics || []).map((a) => ({
    date: new Date(a.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    calls: a.totalCalls,
    candidates: a.newCandidates,
  }));

  const statusData = (data?.statusDistribution || []).map((s) => ({
    name: formatStatusLabel(s.status),
    value: s.count,
    color: STATUS_COLORS[s.status] || "#6366f1",
  }));

  const summary = data?.summary || { totalCandidates: 0, totalCalls: 0, scheduledInterviews: 0, hiredCount: 0 };
  const funnelData = [
    { stage: "Calls", count: summary.totalCalls },
    { stage: "Candidates", count: summary.totalCandidates },
    { stage: "Interviews", count: summary.scheduledInterviews },
    { stage: "Hired", count: summary.hiredCount },
  ];
  const hasData = summary.totalCalls > 0 || summary.totalCandidates > 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Recruitment performance over the last 30 days." />

      {loading ? (
        <div className="space-y-5">
          <Skeleton className="h-[360px] rounded-xl" />
          <div className="grid gap-5 lg:grid-cols-2">
            <Skeleton className="h-[300px] rounded-xl" />
            <Skeleton className="h-[300px] rounded-xl" />
          </div>
        </div>
      ) : !hasData ? (
        <EmptyState
          icon={BarChart3}
          title="No analytics yet"
          description="Charts populate automatically as voice calls are made and candidates are captured."
        />
      ) : (
        <>
          <Card>
            <CardHeader className="flex-row items-center gap-2 space-y-0">
              <TrendingUp className="size-4 text-primary" />
              <CardTitle>Call volume &amp; new candidates</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData} margin={{ left: -16, right: 8, top: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
                    <XAxis dataKey="date" stroke={c.axis} fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke={c.axis} fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Line type="monotone" dataKey="calls" stroke={c.primary} strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="Calls" />
                    <Line type="monotone" dataKey="candidates" stroke={c.secondary} strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="Candidates" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                  Daily aggregates will appear here soon.
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex-row items-center gap-2 space-y-0">
                <PieIcon className="size-4 text-primary" />
                <CardTitle>Candidate status</CardTitle>
              </CardHeader>
              <CardContent>
                {statusData.length > 0 ? (
                  <div className="flex flex-col items-center gap-6 sm:flex-row">
                    <ResponsiveContainer width="50%" height={200} minWidth={160}>
                      <RechartPie>
                        <Pie data={statusData} cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
                          {statusData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                      </RechartPie>
                    </ResponsiveContainer>
                    <div className="w-full space-y-2">
                      {statusData.map((item) => (
                        <div key={item.name} className="flex items-center gap-2 text-sm">
                          <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-muted-foreground">{item.name}</span>
                          <span className="ml-auto font-medium tabular-nums">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">No data yet</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center gap-2 space-y-0">
                <BarChart3 className="size-4 text-primary" />
                <CardTitle>Recruitment funnel</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={funnelData} layout="vertical" margin={{ left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={c.grid} horizontal={false} />
                    <XAxis type="number" stroke={c.axis} fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis dataKey="stage" type="category" stroke={c.axis} fontSize={12} width={78} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: c.grid }} />
                    <Bar dataKey="count" fill={c.primary} radius={[0, 6, 6, 0]} name="Count" barSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

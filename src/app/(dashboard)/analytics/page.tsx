"use client";

import { BarChart3, TrendingUp, PieChart, Loader2, BarChart2 } from "lucide-react";
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
import { useEffect, useState } from "react";
import { formatStatusLabel } from "@/lib/utils";

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

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} className="text-sm font-medium" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch("/api/analytics?days=30");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("[Analytics] Fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // Process chart data from analytics records
  const chartData = (data?.analytics || []).map((a) => ({
    date: new Date(a.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    calls: a.totalCalls,
    candidates: a.newCandidates,
  }));

  // Process status distribution for pie chart
  const statusData = (data?.statusDistribution || []).map((s) => ({
    name: formatStatusLabel(s.status),
    value: s.count,
    color: STATUS_COLORS[s.status] || "#6366f1",
  }));

  // Build funnel data from summary
  const summary = data?.summary || { totalCandidates: 0, totalCalls: 0, scheduledInterviews: 0, hiredCount: 0 };
  const funnelData = [
    { stage: "Total Calls", count: summary.totalCalls },
    { stage: "Candidates", count: summary.totalCandidates },
    { stage: "Interviews", count: summary.scheduledInterviews },
    { stage: "Hired", count: summary.hiredCount },
  ];

  const hasData = summary.totalCalls > 0 || summary.totalCandidates > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">
          <span className="gradient-text">Analytics</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track recruitment performance and insights
        </p>
      </div>

      {!hasData ? (
        /* Empty state */
        <div className="glass rounded-xl p-12 text-center">
          <BarChart2 className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="text-lg font-heading font-semibold text-foreground mb-2">
            No analytics data yet
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Analytics will populate automatically as voice calls are made and candidates are captured.
            Start a call from the landing page to begin collecting data.
          </p>
        </div>
      ) : (
        <>
          {/* Call Volume Chart */}
          <div className="glass rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h3 className="font-heading font-semibold">Call Volume & New Candidates</h3>
            </div>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="#55556e" fontSize={12} />
                  <YAxis stroke="#55556e" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="calls"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#6366f1" }}
                    name="Calls"
                  />
                  <Line
                    type="monotone"
                    dataKey="candidates"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#8b5cf6" }}
                    name="Candidates"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-slate-400">
                No data yet
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <div className="glass rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <PieChart className="w-4 h-4 text-violet-400" />
                <h3 className="font-heading font-semibold">Candidate Status Distribution</h3>
              </div>
              {statusData.length > 0 ? (
                <div className="flex items-center gap-8">
                  <ResponsiveContainer width="50%" height={220}>
                    <RechartPie>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartPie>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {statusData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2 text-sm">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-muted-foreground">{item.name}</span>
                        <span className="font-semibold text-foreground ml-auto">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 text-slate-400">
                  No data yet
                </div>
              )}
            </div>

            {/* Conversion Funnel */}
            <div className="glass rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                <h3 className="font-heading font-semibold">Recruitment Funnel</h3>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={funnelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" stroke="#55556e" fontSize={12} />
                  <YAxis dataKey="stage" type="category" stroke="#55556e" fontSize={11} width={90} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} name="Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

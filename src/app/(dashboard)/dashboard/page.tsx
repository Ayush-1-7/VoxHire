"use client";

import { StatCard } from "@/components/dashboard/StatCard";
import { CallHistoryTable } from "@/components/dashboard/CallHistoryTable";
import { Users, Phone, Calendar, UserCheck, ArrowUpRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

interface DashboardData {
  summary: {
    totalCandidates: number;
    totalCalls: number;
    scheduledInterviews: number;
    hiredCount: number;
  };
  recentCalls: Array<{
    id: string;
    vapiCallId: string;
    status: string;
    duration: number | null;
    startedAt: string;
    summary: string | null;
    candidate: { id: string; name: string; email: string | null } | null;
  }>;
  upcomingAppointments: Array<{
    id: string;
    scheduledAt: string;
    candidate: { name: string; jobRole: string | null };
  }>;
}

export default function DashboardPage() {
  const { data, isLoading: loading } = useQuery<DashboardData>({
    queryKey: ["dashboardData"],
    queryFn: async () => {
      const [analyticsRes, callsRes, appointmentsRes] = await Promise.all([
        fetch("/api/analytics?days=30"),
        fetch("/api/calls?pageSize=5"),
        fetch("/api/appointments"),
      ]);

      if (!analyticsRes.ok || !callsRes.ok || !appointmentsRes.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const analytics = await analyticsRes.json();
      const calls = await callsRes.json();
      const appointments = await appointmentsRes.json();

      return {
        summary: analytics.summary || {
          totalCandidates: 0,
          totalCalls: 0,
          scheduledInterviews: 0,
          hiredCount: 0,
        },
        recentCalls: calls.data || [],
        upcomingAppointments: appointments.data || [],
      };
    },
    refetchInterval: 30 * 1000,
    staleTime: 60 * 1000,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const stats = data?.summary || {
    totalCandidates: 0,
    totalCalls: 0,
    scheduledInterviews: 0,
    hiredCount: 0,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold">
          <span className="gradient-text">Recruitment Dashboard</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of your AI recruitment pipeline
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Candidates"
          value={stats.totalCandidates}
          icon={Users}
          iconColor="text-primary"
        />
        <StatCard
          title="Total Calls"
          value={stats.totalCalls}
          icon={Phone}
          iconColor="text-violet-400"
        />
        <StatCard
          title="Upcoming Interviews"
          value={stats.scheduledInterviews}
          icon={Calendar}
          iconColor="text-amber-400"
        />
        <StatCard
          title="Candidates Hired"
          value={stats.hiredCount}
          icon={UserCheck}
          iconColor="text-success"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Calls */}
        <div className="lg:col-span-2 glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" />
              <h3 className="font-heading font-semibold">Recent Calls</h3>
            </div>
            <Link
              href="/calls"
              className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
            >
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          {data?.recentCalls && data.recentCalls.length > 0 ? (
            <CallHistoryTable calls={data.recentCalls} compact />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Phone className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No calls yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Start a voice call to see activity here
              </p>
            </div>
          )}
        </div>

        {/* Upcoming Interviews */}
        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Calendar className="w-4 h-4 text-amber-400" />
            <h3 className="font-heading font-semibold">Upcoming Interviews</h3>
          </div>
          {data?.upcomingAppointments && data.upcomingAppointments.length > 0 ? (
            <div className="space-y-3">
              {data.upcomingAppointments.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-border/50 hover:border-primary/20 transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {item.candidate.name}
                    </p>
                    <p className="text-[0.7rem] text-muted-foreground">
                      {item.candidate.jobRole || "—"}
                    </p>
                    <p className="text-[0.65rem] text-primary mt-1">
                      {new Date(item.scheduledAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      •{" "}
                      {new Date(item.scheduledAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No interviews scheduled</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Interviews will appear after voice calls
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

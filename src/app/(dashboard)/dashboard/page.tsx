"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Phone,
  Calendar,
  UserCheck,
  ArrowUpRight,
  CalendarClock,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { CallHistoryTable } from "@/components/dashboard/CallHistoryTable";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { InitialsAvatar } from "@/components/ui/avatar";

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
    transcript?: Array<{ role: string; text: string }> | null;
    candidate: { id: string; name: string; email: string | null } | null;
  }>;
  upcomingAppointments: Array<{
    id: string;
    scheduledAt: string;
    candidate: { name: string; jobRole: string | null };
  }>;
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery<DashboardData>({
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

  const stats = data?.summary ?? {
    totalCandidates: 0,
    totalCalls: 0,
    scheduledInterviews: 0,
    hiredCount: 0,
  };

  return (
    <div className="space-y-7">
      <PageHeader
        title="Dashboard"
        description="A live view of your AI recruitment pipeline."
      />

      {/* KPI grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[116px] rounded-xl" />
          ))
        ) : (
          <>
            <StatCard title="Total candidates" value={stats.totalCandidates} icon={Users} />
            <StatCard title="Total calls" value={stats.totalCalls} icon={Phone} />
            <StatCard title="Upcoming interviews" value={stats.scheduledInterviews} icon={Calendar} />
            <StatCard title="Candidates hired" value={stats.hiredCount} icon={UserCheck} />
          </>
        )}
      </div>

      {/* Activity */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Recent calls */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold tracking-tight">Recent calls</h2>
            <Link
              href="/calls"
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              View all <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
          <div className="p-2">
            {isLoading ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded-lg" />
                ))}
              </div>
            ) : (
              <CallHistoryTable calls={data?.recentCalls ?? []} compact />
            )}
          </div>
        </Card>

        {/* Upcoming interviews */}
        <Card>
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold tracking-tight">Upcoming interviews</h2>
          </div>
          <div className="p-3">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
              </div>
            ) : data?.upcomingAppointments && data.upcomingAppointments.length > 0 ? (
              <div className="space-y-1">
                {data.upcomingAppointments.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-accent/60"
                  >
                    <InitialsAvatar name={item.candidate.name} className="size-8" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.candidate.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {item.candidate.jobRole || "Role not specified"}
                      </p>
                      <p className="mt-1 inline-flex items-center gap-1 text-xs text-primary tabular-nums">
                        <CalendarClock className="size-3" />
                        {new Date(item.scheduledAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                        {" · "}
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
              <EmptyState
                icon={Calendar}
                title="No interviews scheduled"
                description="Interviews booked during voice calls will show up here."
                className="border-0 bg-transparent py-10"
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

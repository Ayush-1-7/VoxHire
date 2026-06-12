import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "30");

    const since = new Date();
    since.setDate(since.getDate() - days);

    const [analytics, totalCandidates, totalCalls, scheduledInterviews, hiredCount] =
      await Promise.all([
        db.analytics.findMany({
          where: { date: { gte: since } },
          orderBy: { date: "asc" },
        }),
        db.candidate.count(),
        db.call.count(),
        db.appointment.count({
          where: { status: { in: ["SCHEDULED", "CONFIRMED"] } },
        }),
        db.candidate.count({ where: { status: "HIRED" } }),
      ]);

    // Status distribution
    const statusDistribution = await db.candidate.groupBy({
      by: ["status"],
      _count: { _all: true },
    });

    return NextResponse.json({
      analytics,
      summary: {
        totalCandidates,
        totalCalls,
        scheduledInterviews,
        hiredCount,
      },
      statusDistribution: statusDistribution.map((s) => ({
        status: s.status,
        count: s._count._all,
      })),
    });
  } catch (err) {
    console.error("[Analytics] GET error:", err);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}

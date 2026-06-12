import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const upcoming = await db.appointment.findMany({
      where: {
        scheduledAt: { gte: new Date() },
        status: "SCHEDULED",
      },
      include: {
        candidate: {
          select: {
            name: true,
            jobRole: true,
          },
        },
      },
      orderBy: {
        scheduledAt: "asc",
      },
      take: 5,
    });

    return NextResponse.json({ data: upcoming });
  } catch (err) {
    console.error("[Appointments] GET error:", err);
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 });
  }
}

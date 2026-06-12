import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { candidateUpdateSchema } from "@/lib/validations/candidate";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const candidate = await db.candidate.findUnique({
      where: { id: params.id },
      include: {
        calls: { orderBy: { startedAt: "desc" }, take: 20 },
        appointments: { orderBy: { scheduledAt: "desc" }, take: 10 },
      },
    });

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    return NextResponse.json(candidate);
  } catch (err) {
    console.error("[Candidate] GET error:", err);
    return NextResponse.json({ error: "Failed to fetch candidate" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const parsed = candidateUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const candidate = await db.candidate.update({
      where: { id: params.id },
      data: parsed.data,
    });

    return NextResponse.json(candidate);
  } catch (err) {
    console.error("[Candidate] PUT error:", err);
    return NextResponse.json({ error: "Failed to update candidate" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.candidate.delete({ where: { id: params.id } });
    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("[Candidate] DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete candidate" }, { status: 500 });
  }
}

import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export async function getCalls({
  page = 1,
  pageSize = 20,
  status,
  candidateId,
  sortBy = "startedAt",
  sortOrder = "desc",
}: {
  page?: number;
  pageSize?: number;
  status?: string;
  candidateId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
} = {}) {
  const where: Prisma.CallWhereInput = {};

  if (status) {
    where.status = status as Prisma.EnumCallStatusFilter;
  }
  if (candidateId) {
    where.candidateId = candidateId;
  }

  const [data, total] = await Promise.all([
    db.call.findMany({
      where,
      include: {
        candidate: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.call.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getCallByVapiId(vapiCallId: string) {
  return db.call.findUnique({
    where: { vapiCallId },
    include: {
      candidate: true,
    },
  });
}

export async function getCallById(id: string) {
  return db.call.findUnique({
    where: { id },
    include: {
      candidate: true,
    },
  });
}

export async function upsertCall(
  vapiCallId: string,
  data: Omit<Prisma.CallCreateInput, "vapiCallId">
) {
  return db.call.upsert({
    where: { vapiCallId },
    create: { vapiCallId, ...data },
    update: data,
  });
}

export async function updateCallByVapiId(
  vapiCallId: string,
  data: Prisma.CallUpdateInput
) {
  return db.call.update({
    where: { vapiCallId },
    data,
  });
}

export async function getRecentCalls(limit = 5) {
  return db.call.findMany({
    include: {
      candidate: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { startedAt: "desc" },
    take: limit,
  });
}

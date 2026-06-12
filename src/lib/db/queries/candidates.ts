import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export async function getCandidates({
  page = 1,
  pageSize = 20,
  status,
  search,
  sortBy = "createdAt",
  sortOrder = "desc",
}: {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
} = {}) {
  const where: Prisma.CandidateWhereInput = {};

  if (status) {
    where.status = status as Prisma.EnumCandidateStatusFilter;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
      { jobRole: { contains: search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    db.candidate.findMany({
      where,
      include: {
        _count: { select: { calls: true, appointments: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.candidate.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getCandidateById(id: string) {
  return db.candidate.findUnique({
    where: { id },
    include: {
      calls: {
        orderBy: { startedAt: "desc" },
        take: 10,
      },
      appointments: {
        orderBy: { scheduledAt: "desc" },
        take: 10,
      },
    },
  });
}

export async function createCandidate(data: Prisma.CandidateCreateInput) {
  return db.candidate.create({ data });
}

export async function updateCandidate(
  id: string,
  data: Prisma.CandidateUpdateInput
) {
  return db.candidate.update({ where: { id }, data });
}

export async function deleteCandidate(id: string) {
  return db.candidate.delete({ where: { id } });
}

export async function upsertCandidateByEmail(
  email: string,
  data: Prisma.CandidateCreateInput
) {
  return db.candidate.upsert({
    where: { email },
    create: data,
    update: {
      name: data.name || undefined,
      phone: data.phone || undefined,
      jobRole: data.jobRole || undefined,
      updatedAt: new Date(),
    },
  });
}

import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export async function getAppointments({
  page = 1,
  pageSize = 20,
  status,
  candidateId,
  upcoming = false,
}: {
  page?: number;
  pageSize?: number;
  status?: string;
  candidateId?: string;
  upcoming?: boolean;
} = {}) {
  const where: Prisma.AppointmentWhereInput = {};

  if (status) {
    where.status = status as Prisma.EnumAppointmentStatusFilter;
  }
  if (candidateId) {
    where.candidateId = candidateId;
  }
  if (upcoming) {
    where.scheduledAt = { gte: new Date() };
    where.status = { in: ["SCHEDULED", "CONFIRMED"] };
  }

  const [data, total] = await Promise.all([
    db.appointment.findMany({
      where,
      include: {
        candidate: {
          select: { id: true, name: true, email: true },
        },
        recruiter: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { scheduledAt: upcoming ? "asc" : "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.appointment.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function createAppointment(
  data: Prisma.AppointmentUncheckedCreateInput
) {
  return db.appointment.create({
    data,
    include: {
      candidate: true,
    },
  });
}

export async function updateAppointment(
  id: string,
  data: Prisma.AppointmentUpdateInput
) {
  return db.appointment.update({
    where: { id },
    data,
    include: {
      candidate: true,
    },
  });
}

export async function getUpcomingAppointments(limit = 5) {
  return db.appointment.findMany({
    where: {
      scheduledAt: { gte: new Date() },
      status: { in: ["SCHEDULED", "CONFIRMED"] },
    },
    include: {
      candidate: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { scheduledAt: "asc" },
    take: limit,
  });
}

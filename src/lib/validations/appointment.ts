import { z } from "zod";

export const appointmentCreateSchema = z.object({
  candidateId: z.string().min(1),
  recruiterId: z.string().optional().nullable(),
  title: z.string().max(200).optional().default("Interview - Zensar Technologies"),
  scheduledAt: z.string().datetime(),
  durationMinutes: z.number().int().min(15).max(480).optional().default(60),
  notes: z.string().max(5000).optional().nullable(),
});

export const appointmentUpdateSchema = z.object({
  status: z.enum([
    "SCHEDULED",
    "CONFIRMED",
    "CANCELLED",
    "COMPLETED",
    "NO_SHOW",
    "RESCHEDULED",
  ]).optional(),
  scheduledAt: z.string().datetime().optional(),
  notes: z.string().max(5000).optional().nullable(),
});

export type AppointmentCreateInput = z.infer<typeof appointmentCreateSchema>;
export type AppointmentUpdateInput = z.infer<typeof appointmentUpdateSchema>;

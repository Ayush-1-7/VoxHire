import { z } from "zod";

export const candidateCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email").optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  jobRole: z.string().max(200).optional().nullable(),
  experience: z.string().max(200).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  source: z.string().max(50).optional().default("voice-bot"),
  consentGiven: z.boolean().optional().default(false),
});

export const candidateUpdateSchema = candidateCreateSchema.partial();

export type CandidateCreateInput = z.infer<typeof candidateCreateSchema>;
export type CandidateUpdateInput = z.infer<typeof candidateUpdateSchema>;

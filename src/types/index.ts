export type { CandidateStatus, CallStatus as PrismaCallStatus, AppointmentStatus, UserRole } from "@prisma/client";

export interface CandidateWithRelations {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  jobRole: string | null;
  experience: string | null;
  status: string;
  notes: string | null;
  source: string | null;
  consentGiven: boolean;
  createdAt: Date;
  updatedAt: Date;
  calls?: CallRecord[];
  appointments?: AppointmentRecord[];
}

export interface CallRecord {
  id: string;
  vapiCallId: string;
  candidateId: string | null;
  duration: number | null;
  status: string;
  transcript: unknown;
  summary: string | null;
  extractedData: unknown;
  sentiment: string | null;
  recordingUrl: string | null;
  startedAt: Date;
  endedAt: Date | null;
  createdAt: Date;
  candidate?: {
    id: string;
    name: string;
    email: string | null;
  } | null;
}

export interface AppointmentRecord {
  id: string;
  candidateId: string;
  recruiterId: string | null;
  googleEventId: string | null;
  googleMeetLink: string | null;
  title: string;
  scheduledAt: Date;
  durationMinutes: number;
  status: string;
  notes: string | null;
  reminderSent: boolean;
  confirmationSent: boolean;
  createdAt: Date;
  candidate?: {
    id: string;
    name: string;
    email: string | null;
  };
}

export interface AnalyticsData {
  id: string;
  date: Date;
  callCount: number;
  avgDuration: number;
  newCandidates: number;
  scheduledInterviews: number;
  completedInterviews: number;
}

export interface DashboardStats {
  totalCandidates: number;
  totalCalls: number;
  scheduledInterviews: number;
  hiredCount: number;
  recentCalls: CallRecord[];
  upcomingAppointments: AppointmentRecord[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

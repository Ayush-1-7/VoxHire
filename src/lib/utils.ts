import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    NEW: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    CONTACTED: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    SCREENING: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    INTERVIEW_SCHEDULED: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    INTERVIEWED: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    OFFER_SENT: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    HIRED: "bg-green-500/10 text-green-400 border-green-500/20",
    REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
    WITHDRAWN: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    COMPLETED: "bg-green-500/10 text-green-400 border-green-500/20",
    IN_PROGRESS: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    INITIATED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    FAILED: "bg-red-500/10 text-red-400 border-red-500/20",
    NO_ANSWER: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    SCHEDULED: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    CONFIRMED: "bg-green-500/10 text-green-400 border-green-500/20",
    CANCELLED: "bg-red-500/10 text-red-400 border-red-500/20",
    NO_SHOW: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    RESCHEDULED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };
  return colors[status] || "bg-gray-500/10 text-gray-400 border-gray-500/20";
}

export function formatStatusLabel(status: string): string {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

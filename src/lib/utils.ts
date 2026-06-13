import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("fr-FR", options ?? {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function isOverdue(date: Date | string): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  return d < new Date();
}

export const PIPELINE_STAGES = [
  { id: "new_lead", label: "Nouveau Lead" },
  { id: "contacted", label: "Contacté" },
  { id: "meeting_scheduled", label: "Réunion Planifiée" },
  { id: "proposal_sent", label: "Devis Envoyé" },
  { id: "won", label: "Gagné" },
  { id: "lost", label: "Perdu" },
] as const;

export const STATUS_LABELS: Record<string, string> = {
  prospect: "Prospect",
  client: "Client",
  lost: "Perdu",
};

export const STATUS_COLORS: Record<string, string> = {
  prospect: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  client: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  lost: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export const SOURCE_LABELS: Record<string, string> = {
  website: "Site web",
  event: "Événement",
  referral: "Référence",
  other: "Autre",
};

export const PRIORITY_LABELS: Record<string, string> = {
  low: "Faible",
  medium: "Moyenne",
  high: "Haute",
};

export const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export const ACTIVITY_ICONS: Record<string, string> = {
  contact_added: "UserPlus",
  appointment_created: "Calendar",
  status_updated: "RefreshCw",
  followup_created: "Bell",
  followup_completed: "CheckCircle",
};

export const ACTIVITY_LABELS: Record<string, string> = {
  contact_added: "Contact ajouté",
  appointment_created: "Rendez-vous créé",
  status_updated: "Statut mis à jour",
  followup_created: "Relance créée",
  followup_completed: "Relance complétée",
};

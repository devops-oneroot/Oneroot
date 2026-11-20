import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Lead, TeamMember } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizePersonName(name: string): string {
  return name.trim().toLowerCase();
}

export function namesMatch(a: string, b: string): boolean {
  return normalizePersonName(a) === normalizePersonName(b);
}

/** Match a lead to a team member by current assignee (responsible person). */
export function leadMatchesTeamMember(lead: Lead, member: TeamMember): boolean {
  return namesMatch(lead.responsiblePerson, member.name);
}

export function teamMemberNames(members: TeamMember[]): string[] {
  return members.map((m) => m.name).filter(Boolean);
}

/** Team + assignees from leads — same list as Activity Kanban reassign. */
export function buildReassignTeamNames(
  team: TeamMember[],
  leads: Lead[],
  extraNames: string[] = []
): string[] {
  const known = new Set<string>();
  const names: string[] = [];

  const add = (raw: string) => {
    const name = raw.trim();
    if (!name) return;
    const key = normalizePersonName(name);
    if (known.has(key)) return;
    known.add(key);
    names.push(name);
  };

  for (const member of team) add(member.name);
  for (const lead of leads) add(lead.responsiblePerson ?? "");
  for (const name of extraNames) add(name);

  return names.sort((a, b) => a.localeCompare(b));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatTurnoverCr(value: number) {
  const formatted = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(value);
  return `${formatted} cr`;
}

export function formatFollowUpDate(iso?: string | null) {
  if (!iso) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

export type FollowUpUrgency = "none" | "overdue" | "today" | "upcoming";

export function getFollowUpUrgency(iso?: string | null): FollowUpUrgency {
  if (!iso) return "none";
  const date = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const followUp = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (followUp < today) return "overdue";
  if (followUp.getTime() === today.getTime()) return "today";
  return "upcoming";
}

export function isFollowUpOverdue(iso?: string | null): boolean {
  return getFollowUpUrgency(iso) === "overdue";
}

export function daysFollowUpOverdue(iso?: string | null): number | null {
  if (!isFollowUpOverdue(iso)) return null;
  const date = new Date(iso!);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const followUp = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffMs = today.getTime() - followUp.getTime();
  return Math.max(1, Math.floor(diffMs / (24 * 60 * 60 * 1000)));
}

export const followUpBadgeClass: Record<FollowUpUrgency, string> = {
  none: "bg-slate-100 text-slate-500",
  overdue: "bg-red-100 text-red-700",
  today: "bg-amber-100 text-amber-800",
  upcoming: "bg-sky-100 text-sky-800",
};

const FOLLOW_UP_SORT_ORDER: Record<FollowUpUrgency, number> = {
  overdue: 0,
  today: 1,
  upcoming: 2,
  none: 3,
};

/** Kanban: overdue first, then today, then soonest upcoming; no date last. */
export function compareLeadsByFollowUp<
  T extends { followUpDate?: string | null },
>(a: T, b: T): number {
  const urgencyA = getFollowUpUrgency(a.followUpDate);
  const urgencyB = getFollowUpUrgency(b.followUpDate);
  if (urgencyA !== urgencyB) {
    return FOLLOW_UP_SORT_ORDER[urgencyA] - FOLLOW_UP_SORT_ORDER[urgencyB];
  }
  const timeA = a.followUpDate ? new Date(a.followUpDate).getTime() : Infinity;
  const timeB = b.followUpDate ? new Date(b.followUpDate).getTime() : Infinity;
  return timeA - timeB;
}

/** The business-day key (YYYY-MM-DD) a timestamp falls on, for date filters. */
export function dateOnly(iso?: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA").format(date);
}

/** Table display: "Sep 7, 2026" plus "11:31 AM" on a second line. */
export function formatDateTimeParts(
  iso?: string | null
): { date: string; time: string } | null {
  if (!iso) return null;
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) return null;
  return {
    date: new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(value),
    time: new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(value),
  };
}

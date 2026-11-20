import type { LeadStatus } from "./types";

export interface DailyActivityLeadRow {
  leadId: string;
  name: string;
  company: string;
  contactPerson: string;
  status: LeadStatus;
  createdAt: string;
}

export interface DailyStatusChange {
  leadId: string;
  name: string;
  company: string;
  contactPerson: string;
  fromStatus: string;
  toStatus: string;
  at: string;
}

export interface DailyRemark {
  remarkId?: string;
  leadId: string;
  name: string;
  company: string;
  contactPerson: string;
  text: string;
  author?: string;
  at: string;
}

export interface DailyReassignment {
  leadId: string;
  name: string;
  company: string;
  contactPerson: string;
  fromResponsible: string;
  toResponsible: string;
  reassignedBy: string;
  at: string;
}

export interface DailyActivityReport {
  date: string;
  userName: string;
  summary: {
    leadsAdded: number;
    statusChanges: number;
    remarksAdded: number;
    reassignments: number;
  };
  leadsAdded: DailyActivityLeadRow[];
  statusChanges: DailyStatusChange[];
  reassignments: DailyReassignment[];
  remarks: DailyRemark[];
}

export interface SavedDayListItem {
  _id: string;
  userId: string;
  userName: string;
  date: string;
  summary: DailyActivityReport["summary"];
  savedAt: string;
}

export interface SavedDayDetail extends SavedDayListItem {
  report: DailyActivityReport;
}

export function todayDateInputValue(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatActivityTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

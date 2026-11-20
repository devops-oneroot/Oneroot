import type React from "react";
import { getLeadLastTouchedAt } from "./leadStale";
import { dateOnly, daysFollowUpOverdue, formatFollowUpDate } from "./utils";
import type { Lead } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Follow-up alerts, by how long a lead has gone without real activity.
 * `min` is inclusive, `max` exclusive; the last bucket is open-ended so the
 * most neglected leads never fall off the end.
 */
export const IDLE_BUCKETS = [
  {
    id: "missed_follow",
    label: "Missed Follow",
    hint: "No activity for 1–2 days",
    min: 1,
    max: 2,
    active: "bg-amber-500 text-white border-amber-500",
    dot: "bg-amber-500",
    buttonAlert: {
      "--alert-soft": "#f59e0b",
      "--alert-strong": "#b45309",
      "--alert-border": "#d97706",
      "--alert-border-strong": "#92400e",
    } as React.CSSProperties,
    card: {
      "--alert-soft": "#fef3c7",
      "--alert-strong": "#fcd34d",
      "--alert-border": "#f59e0b",
      "--alert-border-strong": "#d97706",
    } as React.CSSProperties,
    cardText: { title: "text-amber-950", body: "text-amber-900", muted: "text-amber-800", tag: "text-amber-800" },
  },
  {
    id: "idle_critical",
    label: "Idle Critical",
    hint: "No activity for 2–5 days",
    min: 2,
    max: 5,
    active: "bg-orange-500 text-white border-orange-500",
    dot: "bg-orange-500",
    buttonAlert: {
      "--alert-soft": "#f97316",
      "--alert-strong": "#c2410c",
      "--alert-border": "#ea580c",
      "--alert-border-strong": "#9a3412",
    } as React.CSSProperties,
    card: {
      "--alert-soft": "#ffedd5",
      "--alert-strong": "#fdba74",
      "--alert-border": "#f97316",
      "--alert-border-strong": "#ea580c",
    } as React.CSSProperties,
    cardText: { title: "text-orange-950", body: "text-orange-900", muted: "text-orange-800", tag: "text-orange-800" },
  },
  {
    id: "risk",
    label: "Risk",
    hint: "No activity for 5 days or more",
    min: 5,
    max: Infinity,
    active: "bg-red-600 text-white border-red-600",
    dot: "bg-red-600",
    buttonAlert: {
      "--alert-soft": "#ef4444",
      "--alert-strong": "#b91c1c",
      "--alert-border": "#dc2626",
      "--alert-border-strong": "#991b1b",
    } as React.CSSProperties,
    card: {
      "--alert-soft": "#fee2e2",
      "--alert-strong": "#fca5a5",
      "--alert-border": "#ef4444",
      "--alert-border-strong": "#dc2626",
    } as React.CSSProperties,
    cardText: { title: "text-red-950", body: "text-red-900", muted: "text-red-800", tag: "text-red-700" },
  },
] as const;

export type IdleBucketId = (typeof IDLE_BUCKETS)[number]["id"];

/** Days since the lead was last worked. Prefers the API's figure. */
export function leadIdleDays(lead: Lead): number {
  if (typeof lead.idleDays === "number") return lead.idleDays;
  if (lead.lastActivityAt) {
    const at = new Date(lead.lastActivityAt).getTime();
    if (Number.isFinite(at)) return Math.max(0, Math.floor((Date.now() - at) / DAY_MS));
  }
  return Math.max(0, Math.floor((Date.now() - getLeadLastTouchedAt(lead)) / DAY_MS));
}

export function isClosedLead(lead: Lead): boolean {
  return lead.status === "closed_won" || lead.status === "closed_lost";
}

export type LeadAlertReason = "follow_up" | "inactivity";

/**
 * What the alert is measuring for this lead, and how many days.
 *
 * A follow-up date that has passed with nothing done since it was due is a
 * missed follow-up, and the days are counted from that date — even if the
 * lead had been quiet for much longer before. Without an overdue follow-up,
 * the days are simply how long the lead has gone without activity.
 */
export function leadAlertDays(lead: Lead): { days: number; reason: LeadAlertReason } {
  const overdue = daysFollowUpOverdue(lead.followUpDate);
  if (overdue !== null && lead.followUpDate) {
    // Activity on or after the due date means the follow-up was attended to.
    const dueDay = dateOnly(lead.followUpDate);
    const lastDay = lead.lastActivityAt ? dateOnly(lead.lastActivityAt) : "";
    const attended = lastDay !== "" && lastDay >= dueDay;
    if (!attended) return { days: overdue, reason: "follow_up" };
  }
  return { days: leadIdleDays(lead), reason: "inactivity" };
}

/** A follow-up booked for today or later: the lead is being handled. */
export function hasUpcomingFollowUp(lead: Lead): boolean {
  if (!lead.followUpDate) return false;
  const due = dateOnly(lead.followUpDate);
  return due !== "" && due >= dateOnly(new Date().toISOString());
}

/**
 * Which alert a lead belongs in, or null if it needs none.
 *
 * No alert while a follow-up is scheduled for today or later — there is a
 * plan for it. The alert comes when that date passes with nothing done, or
 * when a lead with no follow-up at all goes quiet.
 */
export function leadIdleBucket(lead: Lead): IdleBucketId | null {
  if (isClosedLead(lead)) return null;
  if (hasUpcomingFollowUp(lead)) return null;
  const { days } = leadAlertDays(lead);
  const bucket = IDLE_BUCKETS.find((b) => days >= b.min && days < b.max);
  return bucket?.id ?? null;
}

/** "follow-up overdue 1 day" / "no activity 14 days" */
export function leadAlertLabel(lead: Lead): string {
  const { days, reason } = leadAlertDays(lead);
  return reason === "follow_up"
    ? `follow-up overdue ${idleDaysLabel(days)}`
    : `no activity ${idleDaysLabel(days)}`;
}

export function groupLeadsByIdleBucket(
  leads: Lead[]
): Record<IdleBucketId, Lead[]> {
  const groups = Object.fromEntries(
    IDLE_BUCKETS.map((b) => [b.id, [] as Lead[]])
  ) as Record<IdleBucketId, Lead[]>;
  for (const lead of leads) {
    const id = leadIdleBucket(lead);
    if (id) groups[id].push(lead);
  }
  // Most neglected first within each alert.
  for (const id of Object.keys(groups) as IdleBucketId[]) {
    groups[id].sort((a, b) => leadAlertDays(b).days - leadAlertDays(a).days);
  }
  return groups;
}

export function idleDaysLabel(days: number): string {
  if (days <= 0) return "today";
  if (days === 1) return "1 day";
  return `${days} days`;
}

const BUCKET_BY_ID = Object.fromEntries(IDLE_BUCKETS.map((b) => [b.id, b])) as Record<
  IdleBucketId,
  (typeof IDLE_BUCKETS)[number]
>;

export function idleBucketMeta(id: IdleBucketId) {
  return BUCKET_BY_ID[id];
}

/** Open leads that need no alert: recent activity, or a follow-up booked. */
export function activeLeads(leads: Lead[]): Lead[] {
  return leads
    .filter((lead) => !isClosedLead(lead) && leadIdleBucket(lead) === null)
    .sort((a, b) => leadIdleDays(a) - leadIdleDays(b));
}

/** Why a lead counts as active: "follow-up Sep 14" or "active today". */
export function leadActiveLabel(lead: Lead): string {
  if (hasUpcomingFollowUp(lead)) {
    return `follow-up ${formatFollowUpDate(lead.followUpDate) ?? ""}`.trim();
  }
  const days = leadIdleDays(lead);
  return days <= 0 ? "active today" : `active ${idleDaysLabel(days)} ago`;
}

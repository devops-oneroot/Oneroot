import {
  DAILY_ACTIVITY_TYPES,
  type DailyActivityTypeId,
} from "./leadOptions";

export interface OutreachLeadDetail {
  leadId: string;
  name: string;
  company: string;
  contactPerson: string;
  at: string;
  followUpDate?: string;
  dailyActivityType?: string;
  remarkText?: string;
}

export type DailyActivityCounts = Record<DailyActivityTypeId, number>;
export type DailyActivityBuckets = Record<
  DailyActivityTypeId,
  OutreachLeadDetail[]
>;

export interface OutreachDetailReport {
  date: string;
  userName: string;
  followUps: OutreachLeadDetail[];
  daily: DailyActivityBuckets;
}

export interface OutreachTableRow {
  date: string;
  userName: string;
  followUps: number;
  daily: DailyActivityCounts;
}

export interface OutreachTableReport {
  from: string;
  to: string;
  dailyActivityTypes: DailyActivityTypeId[];
  userNames?: string[];
  rows: OutreachTableRow[];
}

export const OUTREACH_DAILY_COLUMNS = DAILY_ACTIVITY_TYPES;

export function emptyDailyCounts(): DailyActivityCounts {
  return Object.fromEntries(
    DAILY_ACTIVITY_TYPES.map(({ id }) => [id, 0])
  ) as DailyActivityCounts;
}

export function outreachRowTotal(row: OutreachTableRow): number {
  const dailySum = OUTREACH_DAILY_COLUMNS.reduce(
    (sum, { id }) => sum + (row.daily?.[id] ?? 0),
    0
  );
  return dailySum + (row.followUps ?? 0);
}

export function formatFollowUpDateLabel(date?: string): string {
  if (!date) return "";
  try {
    const [y, m, d] = date.split("-").map(Number);
    return `${m}/${d}/${y}`;
  } catch {
    return date;
  }
}

export function formatOutreachTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function clientLabel(row: {
  name: string;
  company: string;
  contactPerson: string;
}): string {
  const parts = [
    row.company?.trim(),
    row.name?.trim(),
    row.contactPerson?.trim(),
  ].filter(Boolean);
  return parts[0] || "—";
}

export function dailyActivityLabel(type?: string): string {
  if (!type) return "";
  const match = DAILY_ACTIVITY_TYPES.find(({ id }) => id === type);
  return match?.label ?? type.replace(/_/g, " ");
}

export function formatOutreachDate(date: string): string {
  try {
    const [y, m, d] = date.split("-").map(Number);
    return `${m}/${d}/${y}`;
  } catch {
    return date;
  }
}

export function todayDateInputValue(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function weekAgoDateInputValue(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const DETAIL_HEADER_COLORS = [
  "bg-violet-700",
  "bg-sky-700",
  "bg-indigo-700",
  "bg-emerald-700",
  "bg-rose-700",
  "bg-amber-700",
  "bg-orange-700",
  "bg-teal-700",
  "bg-cyan-700",
  "bg-fuchsia-700",
  "bg-blue-700",
  "bg-lime-700",
  "bg-pink-700",
];

export function outreachDetailHeaderClass(index: number): string {
  return DETAIL_HEADER_COLORS[index % DETAIL_HEADER_COLORS.length];
}

import { DAILY_ACTIVITY_TYPES } from "./leadOptions";

/** One saved daily-activity entry on a lead, as returned by the API. */
export interface LeadActivityLogEntry {
  _id: string;
  activities: string[];
  note: string;
  userName: string;
  createdAt: string;
}

const LABEL_BY_ID = new Map(
  DAILY_ACTIVITY_TYPES.map((item) => [item.id as string, item.label])
);

export function activityTypeLabel(id: string): string {
  return LABEL_BY_ID.get(id) ?? id;
}

export function activityTypeLabels(ids: string[]): string {
  return ids.map(activityTypeLabel).join(", ");
}

/** "Thu, Aug 14, 2026" */
export function formatActivityDay(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** "6:43 PM" */
export function formatActivityTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

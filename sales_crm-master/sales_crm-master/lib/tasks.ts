import { todayBusinessDate } from "./businessDate";

export const TASK_PRIORITIES = [
  {
    id: "urgent",
    label: "Urgent",
    badgeClass: "bg-red-100 text-red-700 ring-1 ring-red-200",
  },
  {
    id: "high",
    label: "High",
    badgeClass: "bg-orange-100 text-orange-700 ring-1 ring-orange-200",
  },
  {
    id: "medium",
    label: "Medium",
    badgeClass: "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
  },
  {
    id: "low",
    label: "Low",
    badgeClass: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  },
] as const;

export const TASK_STATUSES = [
  {
    id: "pending",
    label: "Pending",
    badgeClass: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  },
  {
    id: "in_progress",
    label: "In progress",
    badgeClass: "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200",
  },
  {
    id: "completed",
    label: "Completed",
    badgeClass: "bg-sky-100 text-sky-700 ring-1 ring-sky-200",
  },
] as const;

/**
 * The Alert column. Order is the order you should work the list in —
 * red and yellow first, completed last.
 */
export const TASK_ALERTS = [
  {
    id: "overdue",
    label: "Overdue",
    dot: "bg-red-500",
    chipClass: "bg-red-50 text-red-700 ring-1 ring-red-200",
    activeChipClass: "bg-red-600 text-white ring-1 ring-red-600",
    rowClass: "bg-red-50/40",
  },
  {
    id: "due_soon",
    label: "Due Soon",
    dot: "bg-amber-400",
    chipClass: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
    activeChipClass: "bg-amber-500 text-white ring-1 ring-amber-500",
    rowClass: "bg-amber-50/40",
  },
  {
    id: "on_track",
    label: "On Track",
    dot: "bg-emerald-500",
    chipClass: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    activeChipClass: "bg-emerald-600 text-white ring-1 ring-emerald-600",
    rowClass: "",
  },
  {
    id: "completed",
    label: "Completed",
    dot: "bg-sky-500",
    chipClass: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
    activeChipClass: "bg-sky-600 text-white ring-1 ring-sky-600",
    rowClass: "bg-slate-50/70",
  },
] as const;

export type TaskPriorityId = (typeof TASK_PRIORITIES)[number]["id"];
export type TaskStatusId = (typeof TASK_STATUSES)[number]["id"];
export type TaskAlertId = (typeof TASK_ALERTS)[number]["id"];

/** A progress note the assignee adds while working the task. */
export interface TaskUpdate {
  _id: string;
  text: string;
  author: string;
  createdAt: string;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  priority: TaskPriorityId;
  dueDate: string;
  status: TaskStatusId;
  assignedTo: string;
  assignedToName: string;
  assignedBy: string;
  assignedByName: string;
  completedAt?: string | null;
  completedByName?: string;
  updates: TaskUpdate[];
  alert: TaskAlertId;
  daysUntilDue: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskSummary {
  overdue: number;
  due_soon: number;
  on_track: number;
  completed: number;
  total: number;
  needsAttention: number;
}

export interface TaskInput {
  title: string;
  description?: string;
  priority: TaskPriorityId;
  dueDate: string;
  assignedTo: string;
}

/** Same window the backend uses to turn a task yellow. */
export const DUE_SOON_WINDOW_DAYS = 2;

const ALERT_BY_ID = Object.fromEntries(
  TASK_ALERTS.map((alert) => [alert.id, alert])
) as Record<TaskAlertId, (typeof TASK_ALERTS)[number]>;

const PRIORITY_BY_ID = Object.fromEntries(
  TASK_PRIORITIES.map((priority) => [priority.id, priority])
) as Record<TaskPriorityId, (typeof TASK_PRIORITIES)[number]>;

const STATUS_BY_ID = Object.fromEntries(
  TASK_STATUSES.map((status) => [status.id, status])
) as Record<TaskStatusId, (typeof TASK_STATUSES)[number]>;

export function alertMeta(id: TaskAlertId) {
  return ALERT_BY_ID[id] ?? ALERT_BY_ID.on_track;
}

export function priorityMeta(id: TaskPriorityId) {
  return PRIORITY_BY_ID[id] ?? PRIORITY_BY_ID.medium;
}

export function statusMeta(id: TaskStatusId) {
  return STATUS_BY_ID[id] ?? STATUS_BY_ID.pending;
}

export function formatUpdatedAt(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function daysUntilDue(dueDate: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return null;
  const due = Date.parse(`${dueDate}T00:00:00Z`);
  const today = Date.parse(`${todayBusinessDate()}T00:00:00Z`);
  if (Number.isNaN(due) || Number.isNaN(today)) return null;
  return Math.round((due - today) / 86400000);
}

/** Mirrors the backend so a locally-changed task recolours without a refetch. */
export function taskAlert(task: {
  status: TaskStatusId;
  dueDate: string;
}): TaskAlertId {
  if (task.status === "completed") return "completed";
  const days = daysUntilDue(task.dueDate);
  if (days === null) return "on_track";
  if (days < 0) return "overdue";
  if (days <= DUE_SOON_WINDOW_DAYS) return "due_soon";
  return "on_track";
}

export function formatDueDate(dueDate: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return dueDate;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${dueDate}T12:00:00`));
}

/** "4 days late" / "Due today" / "in 3 days" — the urgency in plain words. */
export function dueLabel(task: Pick<Task, "dueDate" | "status">): string {
  if (task.status === "completed") return "Done";

  const days = daysUntilDue(task.dueDate);
  if (days === null) return "";
  if (days < 0) {
    const late = Math.abs(days);
    return late === 1 ? "1 day late" : `${late} days late`;
  }
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `in ${days} days`;
}

export function todayDateInputValue(): string {
  return todayBusinessDate();
}

import type { Lead } from "./types";

export const STALE_LEAD_DAYS = 10;

export function getLeadLastTouchedAt(lead: Lead): number {
  const times = [
    new Date(lead.updatedAt).getTime(),
    new Date(lead.createdAt).getTime(),
  ];

  for (const remark of lead.remarks ?? []) {
    if (remark.createdAt) {
      times.push(new Date(remark.createdAt).getTime());
    }
  }

  for (const doc of lead.documents ?? []) {
    if (doc.createdAt) {
      times.push(new Date(doc.createdAt).getTime());
    }
  }

  return Math.max(...times.filter((t) => Number.isFinite(t)));
}

export function isLeadStale(
  lead: Lead,
  staleDays = STALE_LEAD_DAYS
): boolean {
  if (lead.status === "closed_lost" || lead.status === "closed_won") return false;
  const fromApi = lead.lastActivityAt
    ? new Date(lead.lastActivityAt).getTime()
    : NaN;
  const lastTouched = Number.isFinite(fromApi)
    ? fromApi
    : getLeadLastTouchedAt(lead);
  const cutoff = Date.now() - staleDays * 24 * 60 * 60 * 1000;
  return lastTouched < cutoff;
}

export function staleLeadCardClass(stale: boolean): string {
  return stale
    ? "border-red-500 bg-red-100 ring-1 ring-red-400 hover:border-red-600 hover:bg-red-200 hover:shadow-md"
    : "border-slate-200 bg-white hover:border-violet-300 hover:shadow-md";
}

export function staleLeadRowClass(stale: boolean): string {
  return stale
    ? "bg-red-100 text-red-950 hover:bg-red-200"
    : "hover:bg-violet-50/40";
}

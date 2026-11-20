import type { Lead } from "./types";
import { LEAD_STATUSES } from "./types";

export interface ChartDatum {
  name: string;
  value: number;
}

export const CHART_COLORS = [
  "#7c3aed",
  "#0ea5e9",
  "#f59e0b",
  "#22c55e",
  "#ef4444",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#6366f1",
  "#84cc16",
];

function countBy(leads: Lead[], keyFn: (lead: Lead) => string): ChartDatum[] {
  const map = new Map<string, number>();
  for (const lead of leads) {
    const key = keyFn(lead).trim() || "Not specified";
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function getLeadsByCountry(leads: Lead[]) {
  return countBy(leads, (l) => l.country ?? "Not specified");
}

export function getLeadsByProduct(leads: Lead[]) {
  const map = new Map<string, number>();
  for (const lead of leads) {
    const names =
      lead.products?.map((p) => p.name).filter(Boolean) ??
      (lead.product?.name
        ? lead.product.name.split(",").map((s) => s.trim())
        : []);
    if (!names.length) {
      map.set("Not specified", (map.get("Not specified") ?? 0) + 1);
      continue;
    }
    for (const name of names) {
      map.set(name, (map.get(name) ?? 0) + 1);
    }
  }
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function getLeadsByStatus(leads: Lead[]) {
  const counts = countBy(leads, (l) => l.status);
  const labelMap = Object.fromEntries(
    LEAD_STATUSES.map((s) => [s.id, s.label])
  );
  return counts.map((d) => ({
    name: labelMap[d.name] ?? d.name,
    value: d.value,
  }));
}

export function getLeadsByIndustry(leads: Lead[]) {
  return countBy(leads, (l) =>
    l.industry ? l.industry.charAt(0).toUpperCase() + l.industry.slice(1) : "Not specified"
  );
}

export function getLeadsByResponsible(leads: Lead[]) {
  return countBy(leads, (l) => l.responsiblePerson || "Not assigned");
}

export function getPipelineSummary(leads: Lead[]) {
  const deals = leads.filter((l) => l.status === "closed_won").length;
  return {
    total: leads.length,
    deals,
    inPipeline: leads.length - deals,
    export: leads.filter((l) => l.industry === "export").length,
    domestic: leads.filter((l) => l.industry === "domestic").length,
  };
}

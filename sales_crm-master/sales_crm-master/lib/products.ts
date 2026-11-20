import type { Lead, ProductName } from "./types";
import { PRODUCT_OPTIONS } from "./types";

const VALID_IDS = new Set(PRODUCT_OPTIONS.map((p) => p.id));

/** Legacy product ids still stored on old leads */
const PRODUCT_ID_ALIASES: Record<string, ProductName> = {
  dorm: "dorb",
};

function normalizeProductId(id: string): ProductName | null {
  const trimmed = id.trim();
  if (VALID_IDS.has(trimmed as ProductName)) return trimmed as ProductName;
  return PRODUCT_ID_ALIASES[trimmed] ?? null;
}

export function parseProductNamesFromLead(lead: Lead): ProductName[] {
  const fromArray = (lead.products ?? [])
    .map((p) => normalizeProductId(p.name))
    .filter((id): id is ProductName => id !== null);

  if (fromArray.length) return fromArray;

  const raw = lead.product?.name?.trim();
  if (!raw) return [];

  return raw
    .split(",")
    .map((s) => normalizeProductId(s))
    .filter((id): id is ProductName => id !== null);
}

export function formatProductsLabel(lead: Lead): string {
  const ids = parseProductNamesFromLead(lead);
  if (!ids.length) return "";
  return ids
    .map((id) => PRODUCT_OPTIONS.find((p) => p.id === id)?.label ?? id)
    .join(", ");
}

export function getLeadDisplayTitle(lead: Lead): string {
  return lead.company?.trim() || lead.name?.trim() || "—";
}

import { resolveCountry, type CountryOption } from "./countries";
import { getLeadDisplayTitle } from "./products";
import type { Lead } from "./types";

export const UNSET_FILTER = "__unset__";

export function matchesCountryFilter(
  lead: Lead,
  countryFilter: string,
  countries?: CountryOption[]
): boolean {
  if (countryFilter === "all") return true;
  if (countryFilter === UNSET_FILTER) return !lead.country?.trim();

  const filter = countryFilter.trim();
  const leadCountry = lead.country?.trim() ?? "";

  if (countries?.length) {
    const filterMatch = resolveCountry(filter, countries);
    const leadMatch = resolveCountry(leadCountry, countries);
    if (filterMatch && leadMatch) {
      return filterMatch.code === leadMatch.code;
    }
  }

  return leadCountry.toLowerCase() === filter.toLowerCase();
}

export function matchesNameSearch(lead: Lead, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return (
    getLeadDisplayTitle(lead).toLowerCase().includes(q) ||
    (lead.name ?? "").toLowerCase().includes(q) ||
    (lead.company ?? "").toLowerCase().includes(q)
  );
}

export function matchesLeadStatusFilter(
  lead: Lead,
  leadStatusFilter: string
): boolean {
  if (leadStatusFilter === "all") return true;
  if (leadStatusFilter === UNSET_FILTER) return !lead.leadStatus?.trim();
  return (lead.leadStatus ?? "") === leadStatusFilter;
}

export function leadPassesFilters(
  lead: Lead,
  filters: {
    countryFilter?: string;
    leadStatusFilter?: string;
  }
): boolean {
  const { countryFilter = "all", leadStatusFilter = "all" } = filters;
  return (
    matchesCountryFilter(lead, countryFilter) &&
    matchesLeadStatusFilter(lead, leadStatusFilter)
  );
}

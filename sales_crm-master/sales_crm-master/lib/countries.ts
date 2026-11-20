import {
  BUNDLED_COUNTRIES,
  type CountryOption,
  getFlagUrl,
} from "./countryFallback";

export type { CountryOption };
export { getFlagUrl, BUNDLED_COUNTRIES };

/** Returns bundled country list — no external restcountries API. */
export async function fetchCountries(): Promise<CountryOption[]> {
  return BUNDLED_COUNTRIES;
}

export function resolveCountry(
  value: string | undefined,
  countries: CountryOption[]
): CountryOption | undefined {
  if (!value?.trim()) return undefined;
  const q = value.trim().toLowerCase();
  return countries.find(
    (c) => c.name.toLowerCase() === q || c.code.toLowerCase() === q
  );
}

export type MarketFilter = "all" | "india" | "international";

export const MARKET_FILTERS: { id: MarketFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "india", label: "India" },
  { id: "international", label: "International" },
];

export function isIndiaCountry(country?: string): boolean {
  if (!country?.trim()) return false;
  const q = country.trim().toLowerCase();
  return q === "india" || q === "in";
}

export function matchesMarketFilter(
  country: string | undefined,
  filter: MarketFilter
): boolean {
  if (filter === "all") return true;
  if (filter === "india") return isIndiaCountry(country);
  return !!country?.trim() && !isIndiaCountry(country);
}

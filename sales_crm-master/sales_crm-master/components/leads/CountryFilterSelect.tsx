"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { selectClass } from "@/lib/formCommon";
import { fetchCountries } from "@/lib/countries";
import { UNSET_FILTER } from "@/lib/leadFilters";
import type { Lead } from "@/lib/types";

interface CountryFilterSelectProps {
  leads?: Lead[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function CountryFilterSelect({
  leads = [],
  value,
  onChange,
  className = "",
}: CountryFilterSelectProps) {
  const { data: countries = [] } = useQuery({
    queryKey: ["countries"],
    queryFn: fetchCountries,
    staleTime: Infinity,
  });

  const list = useMemo(() => countries, [countries]);

  const hasNoCountry = useMemo(
    () => leads.some((lead) => !lead.country?.trim()),
    [leads]
  );

  const extraLeadCountries = useMemo(() => {
    const apiNames = new Set(list.map((c) => c.name.toLowerCase()));
    const extras = new Set<string>();
    for (const lead of leads) {
      const country = lead.country?.trim();
      if (country && !apiNames.has(country.toLowerCase())) {
        extras.add(country);
      }
    }
    return [...extras].sort((a, b) => a.localeCompare(b));
  }, [leads, list]);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className || selectClass}
      style={{ colorScheme: "light" }}
    >
      <option value="all">All countries</option>
      {hasNoCountry && <option value={UNSET_FILTER}>No country</option>}
      {list.map((country) => (
        <option key={country.code} value={country.name}>
          {country.name}
        </option>
      ))}
      {extraLeadCountries.map((country) => (
        <option key={`extra-${country}`} value={country}>
          {country}
        </option>
      ))}
    </select>
  );
}

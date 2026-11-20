"use client";

import { useQuery } from "@tanstack/react-query";
import { Globe } from "lucide-react";
import { fetchCountries, getFlagUrl, resolveCountry } from "@/lib/countries";
import { cn } from "@/lib/utils";

interface CountryFlagProps {
  countryName?: string;
  size?: number;
  showName?: boolean;
  className?: string;
}

export function CountryFlag({
  countryName,
  size = 20,
  showName = false,
  className,
}: CountryFlagProps) {
  const { data: countries = [] } = useQuery({
    queryKey: ["countries"],
    queryFn: fetchCountries,
    staleTime: 1000 * 60 * 60 * 24,
  });

  if (!countryName?.trim()) return null;

  const match = resolveCountry(countryName, countries);
  const flagSrc = match
    ? getFlagUrl(match.code, size <= 20 ? 40 : 80)
    : null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs text-slate-600",
        className
      )}
    >
      {flagSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={flagSrc}
          alt=""
          width={size}
          height={Math.round(size * 0.75)}
          className="shrink-0 rounded-sm border border-slate-200 object-cover"
        />
      ) : (
        <Globe className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      )}
      {showName && (
        <span className="truncate">{match?.name ?? countryName}</span>
      )}
    </span>
  );
}

"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { UseFormRegister, UseFormWatch } from "react-hook-form";
import type { LeadFormInput } from "@/lib/leadForm";
import { selectClass } from "@/lib/formCommon";
import { fetchCountries, resolveCountry } from "@/lib/countries";

interface CountrySelectProps {
  register: UseFormRegister<LeadFormInput>;
  watch: UseFormWatch<LeadFormInput>;
}

export function CountrySelect({ register, watch }: CountrySelectProps) {
  const selectedName = watch("country");
  const { data: countries = [] } = useQuery({
    queryKey: ["countries"],
    queryFn: fetchCountries,
    staleTime: Infinity,
  });

  const list = useMemo(() => countries, [countries]);

  const selected = resolveCountry(selectedName, list);

  const extraLeadCountry =
    selectedName &&
    !selected &&
    !list.some((c) => c.name.toLowerCase() === selectedName.toLowerCase())
      ? selectedName
      : null;

  return (
    <div className="relative z-10 space-y-2">
      <select
        {...register("country")}
        className={selectClass}
        style={{ colorScheme: "light" }}
      >
        <option value="">Select country</option>
        {list.map((c) => (
          <option key={c.code} value={c.name}>
            {c.name}
          </option>
        ))}
        {extraLeadCountry && (
          <option value={extraLeadCountry}>{extraLeadCountry}</option>
        )}
      </select>
      {selected && (
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selected.flagUrl}
            alt=""
            width={28}
            height={20}
            className="rounded-sm border border-slate-200 object-cover"
          />
          <span className="text-sm font-medium text-slate-700">
            {selected.name}
          </span>
        </div>
      )}
    </div>
  );
}

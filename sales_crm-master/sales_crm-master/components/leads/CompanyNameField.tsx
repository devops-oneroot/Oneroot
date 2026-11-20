"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { UseFormRegister, UseFormWatch } from "react-hook-form";
import { checkLeadDuplicates } from "@/lib/api";
import type { LeadFormInput } from "@/lib/leadForm";
import { inputClass } from "@/lib/leadForm";
import { duplicateMatchTitle } from "@/lib/leadDuplicates";
import { FormField } from "./FormField";
import { useLeadFormMode } from "./LeadFormModeContext";

interface CompanyNameFieldProps {
  register: UseFormRegister<LeadFormInput>;
  watch: UseFormWatch<LeadFormInput>;
  error?: string;
}

export function CompanyNameField({
  register,
  watch,
  error,
}: CompanyNameFieldProps) {
  const { isNewLead } = useLeadFormMode();
  const company = watch("company") ?? "";
  const trimmed = company.trim();
  const leadType = watch("leadType") === "export" ? "export" : "domestic";

  const { data: duplicates = [], isFetching } = useQuery({
    queryKey: ["lead-duplicates", trimmed, leadType],
    queryFn: () => checkLeadDuplicates(trimmed, [], leadType),
    enabled: isNewLead && trimmed.length >= 2,
    staleTime: 30_000,
  });

  const showDuplicates = useMemo(
    () => isNewLead && trimmed.length >= 2 && duplicates.length > 0,
    [isNewLead, trimmed, duplicates.length]
  );

  return (
    <FormField label="Company name *" error={error}>
      <input {...register("company")} className={inputClass} autoComplete="off" />
      {isNewLead && isFetching && trimmed.length >= 2 && (
        <p className="mt-1.5 text-xs text-slate-500">Checking existing leads…</p>
      )}
      {showDuplicates && (
        <div className="mt-2 overflow-hidden rounded-lg border border-red-300 bg-red-50">
          <p className="border-b border-red-200 px-3 py-2 text-xs font-semibold text-red-800">
            Already present in database — this lead cannot be created
          </p>
          <ul className="max-h-40 overflow-y-auto">
            {duplicates.map((match) => (
              <li
                key={match._id}
                className="border-b border-red-100 px-3 py-2 text-xs text-red-950 last:border-b-0"
              >
                <span className="font-semibold">{duplicateMatchTitle(match)}</span>
                <span className="text-red-800">
                  {" "}
                  · Created by {match.createdByName || "Unknown user"}
                </span>
                {match.responsiblePerson &&
                  match.responsiblePerson !== match.createdByName && (
                    <span className="text-red-700">
                      {" "}
                      · Responsible: {match.responsiblePerson}
                    </span>
                  )}
              </li>
            ))}
          </ul>
          <p className="border-t border-red-200 px-3 py-2 text-xs text-red-800">
            Use a different company name, or open the existing lead instead.
          </p>
        </div>
      )}
    </FormField>
  );
}

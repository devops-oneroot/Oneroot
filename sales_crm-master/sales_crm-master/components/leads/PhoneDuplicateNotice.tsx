"use client";

import { useQuery } from "@tanstack/react-query";
import { useWatch, type Control } from "react-hook-form";
import { checkLeadDuplicates } from "@/lib/api";
import { duplicateMatchTitle, phoneKey } from "@/lib/leadDuplicates";
import type { LeadFormInput } from "@/lib/leadForm";
import { useLeadFormMode } from "./LeadFormModeContext";

/**
 * Warns as soon as a typed phone number already belongs to another lead —
 * the same rule the API enforces on create.
 */
export function PhoneDuplicateNotice({
  control,
}: {
  control: Control<LeadFormInput>;
}) {
  const { isNewLead } = useLeadFormMode();
  const contacts = useWatch({ control, name: "contacts" });
  const type = useWatch({ control, name: "leadType" });
  const leadType = type === "export" ? "export" : "domestic";

  const phones = [
    ...new Set(
      (contacts ?? [])
        .flatMap((c) => [...(c?.phones ?? []), c?.phone ?? ""])
        .map((p) => String(p ?? "").trim())
        .filter((p) => phoneKey(p))
    ),
  ];

  const key = phones.map(phoneKey).sort().join(",");

  const { data: matches = [] } = useQuery({
    queryKey: ["lead-duplicates-phone", key, leadType],
    queryFn: () => checkLeadDuplicates("", phones, leadType),
    enabled: isNewLead && phones.length > 0,
    staleTime: 30_000,
  });

  const phoneMatches = matches.filter((m) => m.matchedOn !== "company");
  if (!isNewLead || phoneMatches.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-red-300 bg-red-50">
      <p className="border-b border-red-200 px-3 py-2 text-xs font-semibold text-red-800">
        This phone number is already in the database — this lead cannot be
        created
      </p>
      <ul className="max-h-40 overflow-y-auto">
        {phoneMatches.map((match) => (
          <li
            key={match._id}
            className="border-b border-red-100 px-3 py-2 text-xs text-red-950 last:border-b-0"
          >
            <span className="font-semibold">{duplicateMatchTitle(match)}</span>
            {match.matchedPhone && (
              <span className="text-red-800"> · {match.matchedPhone}</span>
            )}
            <span className="text-red-800">
              {" "}
              · Created by {match.createdByName || "Unknown user"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

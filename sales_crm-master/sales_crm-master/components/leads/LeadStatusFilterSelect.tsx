"use client";

import { LEAD_PROGRESS_STATUSES } from "@/lib/leadOptions";
import { UNSET_FILTER } from "@/lib/leadFilters";

interface LeadStatusFilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  showUnset?: boolean;
}

export function LeadStatusFilterSelect({
  value,
  onChange,
  className = "",
  showUnset = true,
}: LeadStatusFilterSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    >
      <option value="all">All lead statuses</option>
      {showUnset && (
        <option value={UNSET_FILTER}>No lead status</option>
      )}
      {LEAD_PROGRESS_STATUSES.map((item) => (
        <option key={item.id} value={item.id}>
          {item.label}
        </option>
      ))}
    </select>
  );
}

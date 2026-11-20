"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import axios from "axios";
import { reassignLead } from "@/lib/api";
import { invalidateLeadActivity } from "@/lib/invalidateActivity";
import { cn } from "@/lib/utils";

interface ReassignLeadSelectProps {
  leadId: string;
  value: string;
  team: string[];
  className?: string;
  compact?: boolean;
}

export function ReassignLeadSelect({
  leadId,
  value,
  team,
  className,
  compact = false,
}: ReassignLeadSelectProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (responsiblePerson: string) =>
      reassignLead(leadId, responsiblePerson),
    onSuccess: (updated) => {
      invalidateLeadActivity(queryClient);
      toast.success(`Lead reassigned to ${updated.responsiblePerson}`);
    },
    onError: (err: unknown) => {
      const message =
        axios.isAxiosError(err) &&
        typeof err.response?.data?.message === "string"
          ? err.response.data.message
          : "Failed to reassign lead";
      toast.error(message);
    },
  });

  const options = [...new Set([...team, value].filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  );

  return (
    <select
      value={value}
      disabled={mutation.isPending}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onChange={(e) => {
        e.stopPropagation();
        const next = e.target.value;
        if (next && next !== value) {
          mutation.mutate(next);
        }
      }}
      className={cn(
        "rounded-md border bg-white text-slate-700 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 disabled:opacity-60",
        compact
          ? "max-w-[7.5rem] truncate px-2 py-1 text-[11px]"
          : "w-full px-3 py-2 text-sm",
        className
      )}
      aria-label="Reassign lead"
    >
      {options.map((member) => (
        <option key={member} value={member}>
          {member}
        </option>
      ))}
    </select>
  );
}

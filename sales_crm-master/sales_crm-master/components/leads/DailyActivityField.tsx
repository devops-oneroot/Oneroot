"use client";

import type {
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import type { LeadFormInput } from "@/lib/leadForm";
import { inputClass } from "@/lib/leadForm";
import {
  DAILY_ACTIVITY_SELECTABLE_TYPES,
  type DailyActivitySelectableId,
} from "@/lib/leadOptions";
import {
  activityTypeLabels,
  formatActivityDay,
  formatActivityTime,
  type LeadActivityLogEntry,
} from "@/lib/leadActivityLog";
import { cn } from "@/lib/utils";
import { FormField } from "./FormField";

interface DailyActivityFieldProps {
  register: UseFormRegister<LeadFormInput>;
  watch: UseFormWatch<LeadFormInput>;
  setValue: UseFormSetValue<LeadFormInput>;
  errors: FieldErrors<LeadFormInput>;
  className?: string;
  /** Previously saved activities for this lead, newest first. Permanent —
   * there is no way to edit one; logging something new adds another entry. */
  history?: LeadActivityLogEntry[];
  historyLoading?: boolean;
  historyError?: boolean;
}

export function DailyActivityField({
  register,
  watch,
  setValue,
  errors,
  className,
  history = [],
  historyLoading = false,
  historyError = false,
}: DailyActivityFieldProps) {
  const dailyActivities = watch("dailyActivities") ?? [];
  const dailyActivityNote = watch("dailyActivityNote") ?? "";
  const hasSelection = dailyActivities.length > 0;
  const hasNote = dailyActivityNote.trim().length > 0;

  const toggleActivity = (id: DailyActivitySelectableId, checked: boolean) => {
    const current = dailyActivities as DailyActivitySelectableId[];
    const next = checked
      ? [...current, id]
      : current.filter((item) => item !== id);
    setValue("dailyActivities", next, { shouldDirty: true });
  };

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-base font-semibold text-slate-800">Daily Activity</h3>
      <FormField
        label={hasNote ? "Select activities *" : "Select activities"}
        error={
          errors.dailyActivities?.message ??
          (errors.dailyActivities as { root?: { message?: string } } | undefined)
            ?.root?.message
        }
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {DAILY_ACTIVITY_SELECTABLE_TYPES.map((item) => {
            const checked = dailyActivities.includes(item.id);
            return (
              <label
                key={item.id}
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                  checked
                    ? "border-violet-300 bg-violet-50 text-violet-900"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => toggleActivity(item.id, e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                />
                <span>{item.label}</span>
              </label>
            );
          })}
        </div>
      </FormField>

      <FormField
        label={hasSelection ? "Activity note *" : "Activity note"}
        error={errors.dailyActivityNote?.message}
      >
        <textarea
          rows={3}
          placeholder="Write what happened with this lead…"
          {...register("dailyActivityNote")}
          className={inputClass}
        />
        {!hasSelection && (
          <p
            className={cn(
              "mt-1.5 text-xs",
              hasNote ? "font-medium text-amber-700" : "text-slate-500"
            )}
          >
            Tick an activity above — a note on its own is not saved.
          </p>
        )}
      </FormField>

      <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
          Activity history{history.length > 0 && ` (${history.length})`}
        </h4>

        {historyLoading && (
          <p className="mt-2 text-xs text-slate-500">Loading activity history…</p>
        )}

        {!historyLoading && historyError && (
          <p className="mt-2 text-xs font-medium text-red-600">
            Could not load activity history. Check the backend is running.
          </p>
        )}

        {!historyLoading && !historyError && history.length === 0 && (
          <p className="mt-2 text-xs text-slate-500">
            No activity saved yet. The first one you save will appear here.
          </p>
        )}

        {!historyLoading && history.length > 0 && (
          <ul className="mt-2 max-h-64 space-y-2 overflow-y-auto pr-1">
            {history.map((entry) => (
              <li
                key={entry._id}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                  <p className="text-sm font-semibold text-violet-700">
                    {entry.activities.length
                      ? activityTypeLabels(entry.activities)
                      : "Activity"}
                  </p>
                  <p className="text-xs font-medium text-slate-500 tabular-nums">
                    {formatActivityDay(entry.createdAt)} ·{" "}
                    {formatActivityTime(entry.createdAt)}
                  </p>
                </div>
                {entry.note && (
                  <p className="mt-1 whitespace-pre-line text-sm text-slate-700">
                    {entry.note}
                  </p>
                )}
                {entry.userName && (
                  <p className="mt-1 text-xs text-slate-500">
                    by {entry.userName}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

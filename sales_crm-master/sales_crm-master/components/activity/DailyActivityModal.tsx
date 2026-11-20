"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { DailyReportView } from "./DailyReportView";
import { fetchDailyActivity } from "@/lib/api";
import { todayDateInputValue } from "@/lib/dailyActivity";

interface DailyActivityModalProps {
  open: boolean;
  onClose: () => void;
  responsiblePerson?: string;
  isAdmin: boolean;
}

export function DailyActivityModal({
  open,
  onClose,
  responsiblePerson,
  isAdmin,
}: DailyActivityModalProps) {
  const [date, setDate] = useState(todayDateInputValue());

  const targetName =
    responsiblePerson && responsiblePerson !== "all"
      ? responsiblePerson
      : undefined;

  const viewingOther = isAdmin && !!targetName;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["daily-activity", date, targetName ?? "self"],
    queryFn: () =>
      fetchDailyActivity({
        date,
        responsible: isAdmin ? targetName : undefined,
      }),
    enabled: open,
  });

  if (!open) return null;

  const titleUser =
    targetName || data?.userName || (isAdmin ? "Team member" : "You");

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative z-10 flex max-h-[min(92dvh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-t-xl bg-white shadow-2xl sm:rounded-xl">
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 bg-[#0b0e1e] px-4 py-4 text-white sm:px-6">
          <div>
            <h2 className="text-lg font-semibold">Daily activity</h2>
            <p className="text-sm text-slate-400">{titleUser}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1 text-slate-300 hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-3 sm:px-6">
          <label className="text-sm font-medium text-slate-700">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={() => refetch()}
            className="text-sm font-semibold text-violet-600 hover:text-violet-800"
          >
            Refresh
          </button>
          {!viewingOther && !isAdmin && (
            <p className="ml-auto text-xs text-slate-500">
              Syncs to My Days automatically
            </p>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {isLoading && (
            <p className="py-12 text-center text-slate-500">Loading report…</p>
          )}
          {isError && (
            <p className="py-12 text-center text-red-600">
              Could not load daily report. Is the backend running?
            </p>
          )}
          {data && !isLoading && <DailyReportView report={data} />}
        </div>
      </div>
    </div>
  );
}

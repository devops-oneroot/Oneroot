"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Eye, X } from "lucide-react";
import { DailyReportView } from "./DailyReportView";
import {
  fetchSavedDay,
  fetchSavedDays,
  fetchTeamMembers,
  saveDayReport,
} from "@/lib/api";
import { todayDateInputValue } from "@/lib/dailyActivity";
import { teamMemberNames } from "@/lib/utils";
import type { DailyActivityReport, SavedDayListItem } from "@/lib/dailyActivity";
import { useAuth } from "@/providers/AuthProvider";

function formatSavedAt(iso: string): string {
  try {
    return format(new Date(iso), "MMM d, yyyy h:mm a");
  } catch {
    return iso;
  }
}

function formatDisplayDate(date: string): string {
  try {
    return format(new Date(`${date}T12:00:00`), "EEE, MMM d, yyyy");
  } catch {
    return date;
  }
}

export function MyDaysDashboard() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [userFilter, setUserFilter] = useState<string>("all");
  const [viewId, setViewId] = useState<string | null>(null);
  const today = todayDateInputValue();

  const { data: team = [] } = useQuery({
    queryKey: ["team"],
    queryFn: fetchTeamMembers,
  });

  const listQueryKey = ["saved-days", isAdmin ? userFilter : "self"];

  useEffect(() => {
    if (isAdmin) return;
    saveDayReport(today)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["saved-days"] });
      })
      .catch(() => {});
  }, [today, queryClient, isAdmin]);

  const {
    data: savedDays = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: listQueryKey,
    queryFn: () =>
      fetchSavedDays(
        isAdmin && userFilter !== "all" ? { userName: userFilter } : undefined
      ),
    refetchInterval: 20_000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const viewingToday =
    !!viewId && savedDays.find((d) => d._id === viewId)?.date === today;

  const { data: viewedDay, isLoading: viewLoading } = useQuery({
    queryKey: ["saved-day", viewId],
    queryFn: () => fetchSavedDay(viewId!),
    enabled: !!viewId,
    refetchInterval: viewingToday ? 15_000 : false,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const teamOptions = useMemo(() => {
    const fromData = savedDays.map((d) => d.userName).filter(Boolean);
    return [...new Set([...teamMemberNames(team), ...fromData])].sort();
  }, [team, savedDays]);

  return (
    <div className="p-3 sm:p-4">
      <div className="mb-4 rounded-lg border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm text-slate-700">
        {isAdmin ? (
          <>
            <p className="font-medium text-slate-900">Team daily reports</p>
            <p className="mt-1 text-xs text-slate-600">
              Admin activity is not recorded here. View saved days for sales
              users only — filter by team member below.
            </p>
          </>
        ) : (
          <>
            <p className="font-medium text-slate-900">Auto-saved from Activity</p>
            <p className="mt-1 text-xs text-slate-600">
              Today&apos;s report updates when you add leads, move cards on the
              board, get reassigned leads, or add remarks. This list refreshes
              automatically.
            </p>
          </>
        )}
      </div>

      {isAdmin && (
        <div className="mb-4">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Team member
          </p>
          <div className="flex gap-2 overflow-x-auto pb-0.5">
            <button
              type="button"
              onClick={() => setUserFilter("all")}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
                userFilter === "all"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              All users
            </button>
            {teamOptions.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setUserFilter(name)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
                  userFilter === name
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {isLoading && (
        <p className="py-8 text-center text-slate-500">Loading saved days…</p>
      )}
      {isError && (
        <p className="py-8 text-center text-red-600">
          Could not load saved days. Restart the backend.
        </p>
      )}

      {!isLoading && !isError && savedDays.length === 0 && (
        <div className="py-12 text-center text-slate-500">
          <p className="font-medium text-slate-700">No activity saved yet</p>
          <p className="mt-1 text-sm">
            Work on the <strong>Activity</strong> board — your day will appear
            here automatically.
          </p>
        </div>
      )}

      {!isLoading && !isError && savedDays.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-3">Date</th>
                {isAdmin && <th className="px-3 py-3">User</th>}
                <th className="px-3 py-3">Leads</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Reassign</th>
                <th className="px-3 py-3">Remarks</th>
                <th className="px-3 py-3 hidden sm:table-cell">Updated</th>
                <th className="px-3 py-3 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {savedDays.map((row: SavedDayListItem) => (
                <tr key={row._id} className="hover:bg-slate-50/80">
                  <td className="px-3 py-3 font-medium text-slate-900">
                    {formatDisplayDate(row.date)}
                    {row.date === today && (
                      <span className="ml-2 rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-violet-700">
                        Today
                      </span>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="px-3 py-3 text-slate-700">{row.userName}</td>
                  )}
                  <td className="px-3 py-3 tabular-nums">
                    {row.summary.leadsAdded}
                  </td>
                  <td className="px-3 py-3 tabular-nums">
                    {row.summary.statusChanges}
                  </td>
                  <td className="px-3 py-3 tabular-nums">
                    {row.summary.reassignments ?? 0}
                  </td>
                  <td className="px-3 py-3 tabular-nums">
                    {row.summary.remarksAdded}
                  </td>
                  <td className="hidden px-3 py-3 text-slate-500 sm:table-cell">
                    {formatSavedAt(row.savedAt)}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setViewId(row._id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-50"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewId && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setViewId(null)}
            aria-label="Close"
          />
          <div className="relative z-10 flex max-h-[min(92dvh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-t-xl bg-white shadow-2xl sm:rounded-xl">
            <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 bg-[#0b0e1e] px-4 py-4 text-white sm:px-6">
              <div>
                <h2 className="text-lg font-semibold">Saved day</h2>
                <p className="text-sm text-slate-400">
                  {viewedDay
                    ? `${viewedDay.userName} · ${formatDisplayDate(viewedDay.date)}`
                    : "Loading…"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewId(null)}
                className="rounded-lg p-1 text-slate-300 hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
              {viewLoading && (
                <p className="py-12 text-center text-slate-500">Loading…</p>
              )}
              {!viewLoading && viewedDay?.report && (
                <DailyReportView report={viewedDay.report as DailyActivityReport} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

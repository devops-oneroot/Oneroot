"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import { OutreachDetailModal } from "./OutreachDetailModal";
import {
  OutreachLeadPreviewModal,
  type OutreachLeadPreviewSelection,
} from "./OutreachLeadPreviewModal";
import { openLeadDetailInNewTab } from "@/lib/leadNavigation";
import type { Lead } from "@/lib/types";
import { fetchOutreachTable, fetchTeamMembers } from "@/lib/api";
import {
  formatOutreachDate,
  OUTREACH_DAILY_COLUMNS,
  outreachRowTotal,
  todayDateInputValue,
  weekAgoDateInputValue,
  type OutreachTableRow,
} from "@/lib/outreachReport";
import { teamMemberNames } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";

export function OutreachReportDashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [from, setFrom] = useState(weekAgoDateInputValue());
  const [to, setTo] = useState(todayDateInputValue());
  const [userFilter, setUserFilter] = useState("all");
  const [detailRow, setDetailRow] = useState<OutreachTableRow | null>(null);
  const [preview, setPreview] =
    useState<OutreachLeadPreviewSelection | null>(null);

  const closeOutreachModals = () => {
    setPreview(null);
    setDetailRow(null);
  };

  const handleMoreDetail = (lead: Lead) => {
    openLeadDetailInNewTab(lead._id);
  };

  const { data: team = [] } = useQuery({
    queryKey: ["team"],
    queryFn: fetchTeamMembers,
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["outreach-table", from, to, isAdmin ? userFilter : "self"],
    queryFn: () =>
      fetchOutreachTable({
        from,
        to,
        userName:
          isAdmin && userFilter !== "all" ? userFilter : undefined,
      }),
    refetchInterval: 30_000,
  });

  const teamOptions = useMemo(() => {
    const fromReport = data?.userNames ?? [];
    const fromRows = (data?.rows ?? []).map((row) => row.userName).filter(Boolean);
    return [...new Set([...teamMemberNames(team), ...fromReport, ...fromRows])].sort(
      (a, b) => a.localeCompare(b)
    );
  }, [team, data?.userNames, data?.rows]);

  const visibleRows = useMemo(() => {
    const rows = data?.rows ?? [];
    return rows.filter((row) => outreachRowTotal(row) > 0);
  }, [data?.rows]);

  const columnCount = 3 + OUTREACH_DAILY_COLUMNS.length + 1;

  return (
    <div className="p-3 sm:p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            From
          </label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            To
          </label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        {isAdmin && (
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              User
            </label>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="all">All users</option>
              {teamOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        )}
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
        >
          Refresh
        </button>
      </div>

      {isLoading && (
        <p className="py-12 text-center text-slate-500">Loading outreach table…</p>
      )}
      {isError && (
        <p className="py-12 text-center text-red-600">
          Could not load outreach report.
        </p>
      )}

      {!isLoading && !isError && (
        <div className="overflow-x-auto rounded-lg border border-slate-700 shadow-sm">
          <table className="min-w-max text-sm">
            <thead>
              <tr className="bg-slate-900 text-left text-xs font-semibold uppercase tracking-wide text-white">
                <th className="sticky left-0 z-10 bg-slate-900 px-3 py-3">
                  Date
                </th>
                <th className="sticky left-[5.5rem] z-10 bg-slate-900 px-3 py-3">
                  User
                </th>
                {OUTREACH_DAILY_COLUMNS.map(({ id, label }) => (
                  <th
                    key={id}
                    className="whitespace-nowrap px-2 py-3 text-center text-[10px] leading-tight"
                    title={label}
                  >
                    {label}
                  </th>
                ))}
                <th className="whitespace-nowrap px-2 py-3 text-center">
                  Follow-ups
                </th>
                <th className="sticky right-0 z-10 bg-slate-900 px-3 py-3 text-right">
                  Detail
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columnCount}
                    className="bg-emerald-50 px-3 py-10 text-center text-slate-500"
                  >
                    No activity in this date range. Set Daily Activity on a lead
                    and save, or add a follow-up date.
                  </td>
                </tr>
              ) : (
                visibleRows.map((row) => (
                  <tr
                    key={`${row.date}-${row.userName}`}
                    className="border-t border-emerald-200/80 bg-emerald-50/90 text-slate-900 even:bg-emerald-100/70"
                  >
                    <td className="sticky left-0 z-[1] whitespace-nowrap bg-inherit px-3 py-2.5 font-medium">
                      {formatOutreachDate(row.date)}
                    </td>
                    <td className="sticky left-[5.5rem] z-[1] bg-inherit px-3 py-2.5 font-semibold">
                      {row.userName}
                    </td>
                    {OUTREACH_DAILY_COLUMNS.map(({ id }) => (
                      <td
                        key={id}
                        className="px-2 py-2.5 text-center tabular-nums"
                      >
                        {row.daily?.[id] || "—"}
                      </td>
                    ))}
                    <td className="px-2 py-2.5 text-center tabular-nums">
                      {row.followUps || "—"}
                    </td>
                    <td className="sticky right-0 z-[1] bg-inherit px-3 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => setDetailRow(row)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-50"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <OutreachDetailModal
        open={!!detailRow}
        date={detailRow?.date ?? ""}
        userName={detailRow?.userName ?? ""}
        onClose={closeOutreachModals}
        onSelectLead={setPreview}
      />

      <OutreachLeadPreviewModal
        open={!!preview}
        selection={preview}
        onClose={() => setPreview(null)}
        onMoreDetail={handleMoreDetail}
      />
    </div>
  );
}

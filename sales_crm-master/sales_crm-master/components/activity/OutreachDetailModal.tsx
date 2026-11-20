"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, X } from "lucide-react";
import { fetchOutreachDetail } from "@/lib/api";
import type { OutreachLeadPreviewSelection } from "./OutreachLeadPreviewModal";
import {
  clientLabel,
  formatFollowUpDateLabel,
  formatOutreachDate,
  formatOutreachTime,
  OUTREACH_DAILY_COLUMNS,
  outreachDetailHeaderClass,
  type OutreachDetailReport,
  type OutreachLeadDetail,
} from "@/lib/outreachReport";
import { cn } from "@/lib/utils";

interface OutreachDetailModalProps {
  open: boolean;
  date: string;
  userName: string;
  onClose: () => void;
  onSelectLead: (selection: OutreachLeadPreviewSelection) => void;
}

function LeadCell({
  row,
  showFollowUpDate,
  onSelect,
}: {
  row: OutreachLeadDetail;
  showFollowUpDate?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full rounded-md border border-slate-200/90 bg-white px-2.5 py-2 text-left shadow-sm transition-colors hover:border-violet-300 hover:bg-violet-50/50"
    >
      <p className="text-sm font-semibold leading-snug text-slate-900">
        {clientLabel(row)}
      </p>
      {row.contactPerson && (
        <p className="mt-0.5 truncate text-xs text-slate-600">
          {row.contactPerson}
        </p>
      )}
      <p className="mt-1 text-[11px] font-medium text-slate-400">
        {formatOutreachTime(row.at)}
      </p>
      {row.remarkText && (
        <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-slate-500">
          {row.remarkText}
        </p>
      )}
      {showFollowUpDate && row.followUpDate && (
        <p className="mt-1.5 inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">
          <Calendar className="h-3 w-3" />
          {formatFollowUpDateLabel(row.followUpDate)}
        </p>
      )}
    </button>
  );
}

function OutreachDetailTable({
  detail,
  onSelectLead,
}: {
  detail: OutreachDetailReport;
  onSelectLead: (selection: OutreachLeadPreviewSelection) => void;
}) {
  const dailyColumns = useMemo(
    () =>
      OUTREACH_DAILY_COLUMNS.map(({ id, label }, index) => ({
        id,
        label,
        headerClass: outreachDetailHeaderClass(index),
        items: detail.daily?.[id] ?? [],
      })),
    [detail]
  );

  const followUpColumn = {
    id: "followUps" as const,
    label: "Follow-ups",
    headerClass: "bg-amber-700",
    items: detail.followUps ?? [],
  };

  const columns = [...dailyColumns, followUpColumn];
  const maxRows = Math.max(...columns.map((c) => c.items.length), 1);
  const isEmpty = columns.every((c) => c.items.length === 0);

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-700 shadow-sm">
      <table className="min-w-max border-collapse text-sm">
        <thead>
          <tr>
            {columns.map(({ id, label, headerClass, items }) => (
              <th
                key={id}
                className={cn(
                  "min-w-[9.5rem] border-r border-slate-800/40 px-2 py-3 text-center last:border-r-0 sm:min-w-[11rem]",
                  headerClass
                )}
              >
                <div className="flex flex-col items-center gap-1 text-white">
                  <span className="text-[10px] font-bold uppercase leading-tight tracking-wide sm:text-xs">
                    {label}
                  </span>
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-bold tabular-nums">
                    {items.length}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isEmpty ? (
            <tr>
              <td
                colSpan={columns.length}
                className="bg-emerald-50 px-4 py-12 text-center text-slate-500"
              >
                No activity logged for this day.
              </td>
            </tr>
          ) : (
            Array.from({ length: maxRows }, (_, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-t border-emerald-200/80 bg-emerald-50/90 even:bg-emerald-100/60"
              >
                {columns.map(({ id, label, items }) => {
                  const row = items[rowIndex];
                  return (
                    <td
                      key={`${id}-${rowIndex}`}
                      className="align-top border-r border-emerald-200/60 px-2 py-2 last:border-r-0 sm:px-3"
                    >
                      {row ? (
                        <LeadCell
                          row={row}
                          showFollowUpDate={id === "followUps"}
                          onSelect={() =>
                            onSelectLead({ row, activityLabel: label })
                          }
                        />
                      ) : (
                        <span className="block px-2 py-6 text-center text-slate-300">
                          —
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function OutreachDetailModal({
  open,
  date,
  userName,
  onClose,
  onSelectLead,
}: OutreachDetailModalProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["outreach-detail", date, userName],
    queryFn: () => fetchOutreachDetail({ date, userName }),
    enabled: open && !!date && !!userName,
  });

  if (!open) return null;

  return (
      <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-2 lg:p-4">
        <button
          type="button"
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
          aria-label="Close"
        />
        <div className="relative z-10 flex max-h-[min(96dvh,820px)] w-full max-w-[min(98vw,1600px)] flex-col overflow-hidden rounded-t-2xl bg-slate-50 shadow-2xl sm:rounded-2xl">
          <header className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 bg-[#0b0e1e] px-4 py-4 text-white sm:px-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-violet-300">
                Daily breakdown
              </p>
              <h2 className="mt-1 text-xl font-bold sm:text-2xl">{userName}</h2>
              <p className="text-sm text-slate-400">
                {formatOutreachDate(date)} · Click a lead for preview
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg p-1.5 text-slate-300 hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-auto px-2 py-4 sm:px-4 sm:py-5">
            {isLoading && (
              <p className="py-16 text-center text-slate-500">Loading details…</p>
            )}
            {isError && (
              <p className="py-16 text-center text-red-600">
                Could not load outreach details.
              </p>
            )}
            {data && !isLoading && (
              <OutreachDetailTable
                detail={data}
                onSelectLead={onSelectLead}
              />
            )}
          </div>
        </div>
      </div>
  );
}
